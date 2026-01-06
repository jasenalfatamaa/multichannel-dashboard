import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.main import app
from app.database import Base, get_db

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to OmniAI CRM API"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_create_customer():
    response = client.post(
        "/customers/",
        json={
            "external_id": "test-customer",
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "+62811111111",
            "tags": ["Test"],
            "source": "manual"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Customer"
    assert data["external_id"] == "test-customer"

def test_get_customers():
    # First create one
    client.post(
        "/customers/",
        json={"external_id": "c1", "name": "C1", "email": "c1@e.com", "phone": "1", "tags": []}
    )
    response = client.get("/customers/")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_create_conversation():
    # Create customer first
    cust_resp = client.post(
        "/customers/",
        json={"external_id": "c2", "name": "C2", "email": "c2@e.com", "phone": "2", "tags": []}
    )
    cust_id = cust_resp.json()["id"]
    
    response = client.post(
        "/conversations/",
        json={
            "external_id": "conv-test",
            "customer_id": cust_id,
            "channel": "whatsapp",
            "status": "unread",
            "tags": ["New"]
        }
    )
    assert response.status_code == 200
    assert response.json()["external_id"] == "conv-test"

def test_create_message():
    # Setup customer and conversation
    cust_resp = client.post(
        "/customers/",
        json={"external_id": "c3", "name": "C3", "email": "c3@e.com", "phone": "3", "tags": []}
    )
    cust_id = cust_resp.json()["id"]
    conv_resp = client.post(
        "/conversations/",
        json={"external_id": "conv-3", "customer_id": cust_id, "channel": "whatsapp"}
    )
    conv_id = conv_resp.json()["id"]
    
    response = client.post(
        f"/conversations/{conv_id}/messages",
        json={"sender": "user", "text": "Hello world"}
    )
    assert response.status_code == 200
    assert response.json()["text"] == "Hello world"
    
    # Check if conversation status updated
    conv_check = client.get(f"/conversations/{conv_id}")
    assert conv_check.json()["status"] == "unread"
    assert conv_check.json()["unread_count"] == 1

def test_meta_webhook_verification():
    # Use the default token for testing
    verify_token = "your_secret_verify_token"
    challenge = "123456789"
    response = client.get(
        "/webhooks/meta",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": verify_token,
            "hub.challenge": challenge
        }
    )
    assert response.status_code == 200
    assert response.json() == 123456789

def test_auth_and_user_management():
    # 1. Register a super admin via seed
    seed_data = {
        "name": "Super Admin User",
        "email": "super_test@example.com",
        "password": "password123",
        "role": "super_admin"
    }
    response = client.post("/auth/register-seed", json=seed_data)
    assert response.status_code == 200
    
    # 2. Login
    login_data = {"username": "super_test@example.com", "password": "password123"}
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Get /me
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Super Admin User"
    user_id = response.json()["id"]
    
    # 4. Update profile (PATCH /me)
    update_data = {"name": "Updated Name", "avatar": "https://new-avatar.com/img"}
    response = client.patch("/auth/me", headers=headers, json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"
    assert response.json()["avatar"] == "https://new-avatar.com/img"
    
    # 5. List users (only for super admin)
    response = client.get("/auth/users", headers=headers)
    assert response.status_code == 200
    users = response.json()
    assert any(u["email"] == "super_test@example.com" for u in users)
    
    # 6. Delete user (restricted for default super admin)
    # But since this is a new test user, we can try to create another one and delete it
    client.post("/auth/register-seed", json={
        "name": "To Delete",
        "email": "delete@example.com",
        "password": "p",
        "role": "admin"
    })
    
    # Get user id to delete
    users = client.get("/auth/users", headers=headers).json()
    del_id = next(u["id"] for u in users if u["email"] == "delete@example.com")
    
    response = client.delete(f"/auth/users/{del_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "User deleted successfully"

def test_auth_permissions():
    # Register a regular admin
    client.post("/auth/register-seed", json={
        "name": "Regular Admin",
        "email": "admin_test@example.com",
        "password": "password",
        "role": "admin"
    })
    
    # Login as regular admin
    response = client.post("/auth/login", data={"username": "admin_test@example.com", "password": "password"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to list users (should be forbidden)
    response = client.get("/auth/users", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"
