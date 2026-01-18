import requests
import io
from PIL import Image

BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "testuser"
PASSWORD = "testpassword123"

def get_token():
    """Get JWT token for the test user."""
    url = f"{BASE_URL}/auth/token/"
    response = requests.post(url, data={"username": USERNAME, "password": PASSWORD})
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"Failed to login: {response.text}")
        return None

def create_diagnosis(token):
    """Upload a dummy image for diagnosis."""
    url = f"{BASE_URL}/diagnosis/diagnoses/"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a dummy green image (100x100)
    img = Image.new('RGB', (100, 100), color='green')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    files = {'image': ('test_plant.jpg', img_byte_arr, 'image/jpeg')}
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, headers=headers, files=files)
        if response.status_code == 201:
            print("\n✅ Success! Diagnosis created.")
            print("Response:", response.json())
        else:
            print(f"\n❌ Failed. Status: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("--- Diagnosis API Tester ---")
    token = get_token()
    if token:
        create_diagnosis(token)
    else:
        print("\nNote: You might need to create a user first.")
        print(f"Run: python manage.py createsuperuser --username {USERNAME}")
