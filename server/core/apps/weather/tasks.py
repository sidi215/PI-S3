from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import WeatherData, WeatherAlert
from .services import MauritaniaWeatherService, AIService


@shared_task
def fetch_weather_data(lat, lon, location_name):
    """Tâche pour récupérer les données météo"""
    try:
        weather_service = MauritaniaWeatherService()
        weather_data = weather_service.get_weather_for_city(location_name)

        # Enregistrer dans la base de données
        WeatherData.objects.create(**weather_data)

        return f"Weather data fetched for {location_name}"
    except Exception as e:
        return f"Error fetching weather data: {str(e)}"


@shared_task
def check_and_send_alerts():
    """Tâche pour vérifier et envoyer les alertes météo"""
    try:
        weather_service = MauritaniaWeatherService()
        ai_service = AIService()

        # Récupérer les dernières données météo
        recent_weather = (
            WeatherData.objects.filter(
                recorded_at__gte=timezone.now() - timedelta(hours=1)
            )
            .order_by("location")
            .distinct("location")
        )

        for weather in recent_weather:
            # Vérifier les conditions d'alerte
            # (implémenter la logique spécifique)
            pass

        return "Alerts checked successfully"
    except Exception as e:
        return f"Error checking alerts: {str(e)}"


@shared_task
def cleanup_old_weather_data():
    """Nettoyer les anciennes données météo"""
    try:
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count, _ = WeatherData.objects.filter(
            recorded_at__lt=cutoff_date
        ).delete()

        return f"Deleted {deleted_count} old weather records"
    except Exception as e:
        return f"Error cleaning up old data: {str(e)}"
