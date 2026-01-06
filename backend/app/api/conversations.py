from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, schemas, database

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("/", response_model=List[schemas.Conversation])
def read_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    conversations = db.query(models.Conversation).offset(skip).limit(limit).all()
    
    # Enrich conversations with some details for the UI
    results = []
    for conv in conversations:
        conv_schema = schemas.Conversation.model_validate(conv)
        conv_schema.customer_name = conv.customer.name
        conv_schema.customer_avatar = conv.customer.avatar
        if conv.messages:
            last_msg = conv.messages[-1]
            conv_schema.last_message = last_msg.text
            conv_schema.last_timestamp = last_msg.timestamp
        results.append(conv_schema)
    
    return results

@router.post("/", response_model=schemas.Conversation)
def create_conversation(conversation: schemas.ConversationCreate, db: Session = Depends(database.get_db)):
    db_conv = models.Conversation(**conversation.model_dump())
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)
    return db_conv

@router.get("/{conversation_id}", response_model=schemas.Conversation)
def read_conversation(conversation_id: int, db: Session = Depends(database.get_db)):
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if db_conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv_schema = schemas.Conversation.model_validate(db_conv)
    conv_schema.customer_name = db_conv.customer.name
    conv_schema.customer_avatar = db_conv.customer.avatar
    if db_conv.messages:
        last_msg = db_conv.messages[-1]
        conv_schema.last_message = last_msg.text
        conv_schema.last_timestamp = last_msg.timestamp
    
    return conv_schema

@router.patch("/{conversation_id}/status")
def update_conversation_status(conversation_id: int, status: models.ConversationStatus, db: Session = Depends(database.get_db)):
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if db_conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db_conv.status = status
    if status == models.ConversationStatus.resolved:
        db_conv.resolved_at = datetime.utcnow()
    else:
        db_conv.resolved_at = None
        
    db.commit()
    return {"message": "Status updated"}

@router.get("/{conversation_id}/messages", response_model=List[schemas.Message])
def read_messages(conversation_id: int, db: Session = Depends(database.get_db)):
    messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).all()
    return messages

@router.post("/{conversation_id}/messages", response_model=schemas.Message)
def create_message(conversation_id: int, message: schemas.MessageCreate, db: Session = Depends(database.get_db)):
    db_msg = models.Message(**message.model_dump(), conversation_id=conversation_id)
    db.add(db_msg)
    
    # Update conversation last activity
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if db_conv:
        if message.sender == 'user':
            db_conv.unread_count += 1
            db_conv.status = models.ConversationStatus.unread
        else:
            db_conv.unread_count = 0
            db_conv.status = models.ConversationStatus.active
            
    db.commit()
    db.refresh(db_msg)
    return db_msg
