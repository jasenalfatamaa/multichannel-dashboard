from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/ai", tags=["ai"])

def get_ai_client():
    api_key = os.getenv("API_KEY")
    if not api_key:
        # In case API_KEY is not set, we can't initialize Gemini
        return None
    genai.configure(api_key=api_key)
    return genai

@router.post("/suggest")
async def get_suggestion(conversation_id: int, tone: str = "Friendly", db: Session = Depends(database.get_db)):
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not db_conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    history = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.timestamp.asc()).all()
    history_text = "\n".join([f"{m.sender}: {m.text}" for m in history])
    
    prompt = f"""
    Context: You are a professional customer service assistant for OmniAI CRM.
    Tone: {tone}
    Customer Name: {db_conv.customer.name}
    Chat History:
    {history_text}

    Task: Generate a helpful, concise, and polite draft reply to the latest message. 
    Return ONLY the suggested response text.
    """
    
    client = get_ai_client()
    if not client:
        return {"suggestion": "AI Configuration Missing (API Key not set)."}
        
    try:
        model = client.GenerativeModel('gemini-1.5-flash') # Updated to a more stable model name
        response = model.generate_content(prompt)
        return {"suggestion": response.text.strip()}
    except Exception as e:
        print(f"AI Error: {e}")
        return {"suggestion": "Maaf, terjadi kesalahan saat menghasilkan saran AI."}

@router.post("/analyze-intent")
async def analyze_intent(conversation_id: int, db: Session = Depends(database.get_db)):
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not db_conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).limit(10).all()
    if not messages:
        return {"tags": ["New"]}
        
    history_text = "\n".join([f"{m.sender}: {m.text}" for m in messages])
    
    prompt = f"""
    Analyze this chat history and return exactly 2-3 professional CRM tags that best describe this customer.
    Available categories to consider: VIP, Potential, Follow-up, Tech Support, High Priority, Positive Sentiment, Frustrated.
    
    Chat History:
    {history_text}
    
    Return ONLY a comma-separated list of tags. Example: VIP, Positive Sentiment
    """
    
    client = get_ai_client()
    if not client:
        return {"tags": ["New"]}

    try:
        model = client.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        tags_text = response.text.strip()
        tags = [t.strip() for t in tags_text.split(',')]
        
        # Update conversation tags
        db_conv.tags = tags
        db.commit()
        
        return {"tags": tags}
    except Exception as e:
        print(f"AI Error: {e}")
        return {"tags": ["New"]}
@router.get("/knowledge", response_model=List[schemas.KnowledgeSource])
def list_knowledge(db: Session = Depends(database.get_db)):
    return db.query(models.KnowledgeSource).order_by(models.KnowledgeSource.created_at.desc()).all()

@router.post("/knowledge", response_model=schemas.KnowledgeSource)
def create_knowledge(knowledge: schemas.KnowledgeSourceCreate, db: Session = Depends(database.get_db)):
    db_knowledge = models.KnowledgeSource(**knowledge.model_dump())
    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)
    return db_knowledge

@router.delete("/knowledge/{id}")
def delete_knowledge(id: int, db: Session = Depends(database.get_db)):
    db_knowledge = db.query(models.KnowledgeSource).filter(models.KnowledgeSource.id == id).first()
    if not db_knowledge:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    db.delete(db_knowledge)
    db.commit()
    return {"message": "Knowledge source deleted"}
