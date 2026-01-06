from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
import os
from datetime import datetime
from .. import models, schemas, database

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Meta (WhatsApp & Instagram) Verification
@router.get("/meta")
async def verify_meta(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    verify_token = os.getenv("META_VERIFY_TOKEN", "your_secret_verify_token")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

# WhatsApp Webhook
@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, db: Session = Depends(database.get_db)):
    data = await request.json()
    # Basic validation of WhatsApp data structure
    try:
        entries = data.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                for msg in messages:
                    sender_phone = msg.get("from")
                    text = msg.get("text", {}).get("body")
                    msg_id = msg.get("id")
                    
                    if sender_phone and text:
                        await process_incoming_message(
                            db=db,
                            external_id=sender_phone,
                            text=text,
                            channel=models.ChannelType.whatsapp,
                            msg_id=f"wa-{msg_id}"
                        )
    except Exception as e:
        print(f"WhatsApp Webhook Error: {e}")
    return {"status": "success"}

# Instagram Webhook
@router.post("/instagram")
async def instagram_webhook(request: Request, db: Session = Depends(database.get_db)):
    data = await request.json()
    # Similar structure to WhatsApp but with IG specifics
    try:
        entries = data.get("entry", [])
        for entry in entries:
            for messaging in entry.get("messaging", []):
                sender_id = messaging.get("sender", {}).get("id")
                message = messaging.get("message", {})
                text = message.get("text")
                msg_id = message.get("mid")
                
                if sender_id and text:
                    await process_incoming_message(
                        db=db,
                        external_id=sender_id,
                        text=text,
                        channel=models.ChannelType.instagram,
                        msg_id=f"ig-{msg_id}"
                    )
    except Exception as e:
        print(f"Instagram Webhook Error: {e}")
    return {"status": "success"}

# Telegram Webhook
@router.post("/telegram")
async def telegram_webhook(request: Request, db: Session = Depends(database.get_db)):
    data = await request.json()
    try:
        message = data.get("message", {})
        sender_id = str(message.get("from", {}).get("id"))
        text = message.get("text")
        msg_id = str(message.get("message_id"))
        first_name = message.get("from", {}).get("first_name", "Telegram User")
        
        if sender_id and text:
            await process_incoming_message(
                db=db,
                external_id=sender_id,
                text=text,
                channel=models.ChannelType.telegram,
                msg_id=f"tg-{msg_id}",
                customer_name=first_name
            )
    except Exception as e:
        print(f"Telegram Webhook Error: {e}")
    return {"status": "success"}

# LINE Webhook
@router.post("/line")
async def line_webhook(request: Request, db: Session = Depends(database.get_db)):
    data = await request.json()
    try:
        events = data.get("events", [])
        for event in events:
            if event.get("type") == "message":
                sender_id = event.get("source", {}).get("userId")
                message = event.get("message", {})
                text = message.get("text")
                msg_id = message.get("id")
                
                if sender_id and text:
                    await process_incoming_message(
                        db=db,
                        external_id=sender_id,
                        text=text,
                        channel=models.ChannelType.line,
                        msg_id=f"line-{msg_id}"
                    )
    except Exception as e:
        print(f"LINE Webhook Error: {e}")
    return {"status": "success"}

# Helper to process incoming messages across all channels
async def process_incoming_message(db: Session, external_id: str, text: str, channel: models.ChannelType, msg_id: str, customer_name: str = None):
    # 1. Look for or create Customer
    customer = db.query(models.Customer).filter(models.Customer.external_id == external_id).first()
    if not customer:
        customer = models.Customer(
            external_id=external_id,
            name=customer_name or f"User-{external_id[:8]}",
            email=f"{external_id}@webhook.com",
            phone=external_id if channel in [models.ChannelType.whatsapp, models.ChannelType.telegram] else "",
            source="chat"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    # 2. Look for or create Conversation
    conv = db.query(models.Conversation).filter(
        models.Conversation.customer_id == customer.id,
        models.Conversation.channel == channel
    ).first()
    
    if not conv:
        conv = models.Conversation(
            external_id=f"conv-{channel}-{external_id}",
            customer_id=customer.id,
            channel=channel,
            status=models.ConversationStatus.unread
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    
    # 3. Create Message
    # Check if message already exists to avoid duplicates using external_id (msg_id)
    existing_msg = db.query(models.Message).filter(models.Message.external_id == msg_id).first()
    if not existing_msg:
        new_msg = models.Message(
            external_id=msg_id,
            conversation_id=conv.id,
            sender="user",
            text=text,
            timestamp=datetime.utcnow()
        )
        db.add(new_msg)
        
        # 4. Update Conversation status
        conv.status = models.ConversationStatus.unread
        conv.unread_count += 1
        conv.started_at = datetime.utcnow() # Update activity
        
        db.commit()
