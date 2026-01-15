from .base import *

DEBUG = False

ALLOWED_HOSTS = ["betteragri.com", "api.betteragri.com"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB"),
        "USER": os.getenv("POSTGRES_USER"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
        "HOST": "postgres",
        "PORT": 5432,
    }
}

CORS_ALLOWED_ORIGINS = [
    "https://betteragri.com",
    "https://www.betteragri.com",
]
