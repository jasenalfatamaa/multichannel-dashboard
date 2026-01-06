from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"

class ChannelType(str, enum.Enum):
    whatsapp = "whatsapp"
    instagram = "instagram"
    telegram = "telegram"
    line = "line"

class ConversationStatus(str, enum.Enum):
    unread = "unread"
    resolved = "resolved"
    active = "active"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.admin)
    avatar = Column(String, nullable=True)
    org = Column(String, default="My Organization")
    timezone = Column(String, default="Jakarta (GMT+7)")
    ai_auto_reply = Column(Boolean, default=True)
    ai_tone = Column(String, default="Friendly")
    two_factor_enabled = Column(Boolean, default=False)

    integrations = relationship("IntegrationChannel", back_populates="user")

class IntegrationChannel(Base):
    __tablename__ = "integration_channels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    type = Column(String) # whatsapp, instagram, etc.
    account = Column(String)
    status = Column(String, default="Connected")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="integrations")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True) # e.g. ahmad-kurniawan
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    tags = Column(JSON, default=[])
    last_active = Column(DateTime, default=datetime.utcnow)
    avatar = Column(String, nullable=True)
    source = Column(String, default="chat")

    conversations = relationship("Conversation", back_populates="customer")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True) # e.g. conv-0
    customer_id = Column(Integer, ForeignKey("customers.id"))
    channel = Column(Enum(ChannelType))
    status = Column(Enum(ConversationStatus), default=ConversationStatus.unread)
    unread_count = Column(Integer, default=0)
    tags = Column(JSON, default=[])
    started_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    customer = relationship("Customer", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender = Column(String) # 'user', 'admin', 'ai'
    text = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    size = Column(String)
    status = Column(String, default="ready")
    created_at = Column(DateTime, default=datetime.utcnow)
