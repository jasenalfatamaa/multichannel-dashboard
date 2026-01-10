from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from . import models, schemas, database
from .api import customers, conversations, ai, auth, webhooks
from .database import engine, get_db

app = FastAPI(title="OmniAI MultiChannel Dashboard API")

@app.on_event("startup")
async def startup_event():
    import time
    from sqlalchemy.exc import OperationalError
    
    max_retries = 5
    retry_delay = 5
    
    for i in range(max_retries):
        try:
            print(f"Connecting to database (attempt {i+1}/{max_retries})...")
            models.Base.metadata.create_all(bind=engine)
            print("Database connected and tables created.")
            break
        except OperationalError as e:
            if i == max_retries - 1:
                print("Could not connect to database after several attempts.")
                raise e
            print(f"Database not ready, retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)

    # Create default super admin if not exists
    db = database.SessionLocal()
    try:
        admin_email = "super@omniai.com"
        db_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not db_user:
            print("Creating default super admin...")
            from .api.auth import get_password_hash
            hashed_password = get_password_hash("password123")
            new_admin = models.User(
                name="Super Admin Utama",
                email=admin_email,
                hashed_password=hashed_password,
                role=models.UserRole.super_admin,
                avatar="https://i.pravatar.cc/150?u=super"
            )
            db.add(new_admin)
            db.commit()
            print(f"DONE: Default admin created with email: {admin_email}")
        else:
            print(f"Admin user already exists: {admin_email}")
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(conversations.router)
app.include_router(ai.router)
app.include_router(webhooks.router)

@app.get("/")
async def root():
    return {"message": "Welcome to OmniAI CRM API"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Initial endpoint to seed some data if empty
@app.post("/seed")
async def seed_data(db: Session = Depends(get_db)):
    # Check if data exists
    if db.query(models.Customer).first():
        return {"message": "Data already seeded"}
    
    # Mock some data for testing
    customer = models.Customer(
        external_id="ahmad-kurniawan",
        name="Ahmad Kurniawan",
        email="ahmad.kurniawan@example.com",
        phone="+6281234567890",
        tags=["VIP"],
        source="chat"
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    conv = models.Conversation(
        external_id="conv-0",
        customer_id=customer.id,
        channel=models.ChannelType.whatsapp,
        status=models.ConversationStatus.active,
        tags=["VIP"]
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    
    msg = models.Message(
        conversation_id=conv.id,
        sender="user",
        text="Halo, saya tertarik dengan layanannya.",
    )
    db.add(msg)
    db.commit()
    
    return {"message": "Seed data created successfully"}
