from django.apps import AppConfig


class WeatherConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.weather'

    def ready(self):
        import apps.weather.signals
