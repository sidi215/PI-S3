import os
import django

# Set up Django environment using the same settings as manage.py
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betteragri.settings.dev")
django.setup()

from django.contrib.auth import get_user_model

def create_user():
    User = get_user_model()
    username = "testuser"
    password = "testpassword123"
    email = "test@example.com"

    # Check if user exists
    try:
        user = User.objects.get(username=username)
        print(f"ℹ️ User '{username}' already exists.")
        # Reset password to ensure test script works
        user.set_password(password)
        user.save()
        print(f"✅ User '{username}' password has been RESET to '{password}'.")
    except User.DoesNotExist:
        print(f"Creating user '{username}'...")
        User.objects.create_superuser(username, email, password)
        print(f"✅ User '{username}' created successfully.")

if __name__ == "__main__":
    create_user()
