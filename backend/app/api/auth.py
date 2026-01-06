from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional, List
import os
from .. import models, schemas, database

# Constants for JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def read_users_me(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.patch("/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(read_users_me), db: Session = Depends(database.get_db)):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.org is not None:
        current_user.org = user_update.org
    if user_update.timezone is not None:
        current_user.timezone = user_update.timezone
    if user_update.ai_auto_reply is not None:
        current_user.ai_auto_reply = user_update.ai_auto_reply
    if user_update.ai_tone is not None:
        current_user.ai_tone = user_update.ai_tone
    if user_update.two_factor_enabled is not None:
        current_user.two_factor_enabled = user_update.two_factor_enabled
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(data: schemas.PasswordChange, current_user: models.User = Depends(read_users_me), db: Session = Depends(database.get_db)):
    if not database.pwd_context.verify(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = database.pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

# --- INTEGRATIONS ---
@router.post("/integrations", response_model=schemas.IntegrationChannel)
def create_integration(integration: schemas.IntegrationChannelCreate, current_user: models.User = Depends(read_users_me), db: Session = Depends(database.get_db)):
    db_integration = models.IntegrationChannel(**integration.model_dump(), user_id=current_user.id)
    db.add(db_integration)
    db.commit()
    db.refresh(db_integration)
    return db_integration

@router.get("/integrations", response_model=List[schemas.IntegrationChannel])
def list_integrations(current_user: models.User = Depends(read_users_me), db: Session = Depends(database.get_db)):
    return db.query(models.IntegrationChannel).filter(models.IntegrationChannel.user_id == current_user.id).all()

@router.delete("/integrations/{integration_id}")
def delete_integration(integration_id: int, current_user: models.User = Depends(read_users_me), db: Session = Depends(database.get_db)):
    db_integration = db.query(models.IntegrationChannel).filter(
        models.IntegrationChannel.id == integration_id,
        models.IntegrationChannel.user_id == current_user.id
    ).first()
    if not db_integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(db_integration)
    db.commit()
    return {"message": "Integration deleted"}

@router.get("/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(read_users_me)):
    if current_user.role != models.UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return db.query(models.User).all()

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(read_users_me)):
    if current_user.role != models.UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete.email == "super@omniai.com":
        raise HTTPException(status_code=400, detail="Cannot delete default super admin")

    db.delete(user_to_delete)
    db.commit()
    return {"message": "User deleted successfully"}

# Helper to register first user (seed)
@router.post("/register-seed", response_model=schemas.User)
def register_seed(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        avatar=f"https://i.pravatar.cc/150?u={user.name.replace(' ', '')}"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
