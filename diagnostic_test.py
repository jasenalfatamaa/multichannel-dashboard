import requests
import json

url = "http://localhost:8000/customers/"
payload = {
    "external_id": "diag-test",
    "name": "Diag Test",
    "email": "diag@test.com",
    "phone": "+62812345678",
    "tags": ["Diagnostic"],
    "source": "manual",
    "id": "temp-id-123", # Extra field like frontend
    "lastActive": "2026-01-07T00:00:00.000Z" # Extra field like frontend
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
