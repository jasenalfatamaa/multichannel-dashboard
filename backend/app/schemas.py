from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from .models import UserRole, ChannelType, ConversationStatus

class MessageBase(BaseModel):
    sender: str
    text: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    external_id: Optional[str] = None
    conversation_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversationBase(BaseModel):
    customer_id: int
    channel: ChannelType
    status: ConversationStatus = ConversationStatus.unread
    tags: List[str] = []

class ConversationCreate(ConversationBase):
    external_id: str

class Conversation(ConversationBase):
    id: int
    external_id: str
    unread_count: int
    started_at: datetime
    resolved_at: Optional[datetime] = None
    messages: List[Message] = []
    
    # Adding customer name and avatar for the list view
    customer_name: Optional[str] = None
    customer_avatar: Optional[str] = None
    last_message: Optional[str] = None
    last_timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerBase(BaseModel):
    name: str
    email: str
    phone: str
    tags: List[str] = []
    avatar: Optional[str] = None
    source: str = "chat"

class CustomerCreate(CustomerBase):
    external_id: str

class Customer(CustomerBase):
    id: int
    external_id: str
    last_active: datetime
    model_config = ConfigDict(from_attributes=True)

class IntegrationChannelBase(BaseModel):
    name: str
    type: str
    account: str
    status: str = "Connected"

class IntegrationChannelCreate(IntegrationChannelBase):
    pass

class IntegrationChannel(IntegrationChannelBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole
    org: Optional[str] = "My Organization"
    timezone: Optional[str] = "Jakarta (GMT+7)"
    ai_auto_reply: Optional[bool] = True
    ai_tone: Optional[str] = "Friendly"
    two_factor_enabled: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    org: Optional[str] = None
    timezone: Optional[str] = None
    ai_auto_reply: Optional[bool] = None
    ai_tone: Optional[str] = None
    two_factor_enabled: Optional[bool] = None

class User(UserBase):
    id: int
    avatar: Optional[str] = None
    integrations: List[IntegrationChannel] = []
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class KnowledgeSourceBase(BaseModel):
    name: str
    size: str
    status: str = "ready"

class KnowledgeSourceCreate(KnowledgeSourceBase):
    pass

class KnowledgeSource(KnowledgeSourceBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
