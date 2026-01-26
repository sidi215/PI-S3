from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeatherViewSet, FarmerWeatherPreferenceViewSet, WeatherAlertViewSet

router = DefaultRouter()
router.register(r'preferences', FarmerWeatherPreferenceViewSet, basename='weather-preference')
router.register(r'alerts', WeatherAlertViewSet, basename='weather-alert')

urlpatterns = [
    path('', include(router.urls)),

    # 🔥 météo par ville (utilisé par frontend)
    path(
        'mauritania/',
        WeatherViewSet.as_view({'post': 'mauritania_weather'}),
        name='mauritania-weather'
    ),

    # 🔥 liste des villes
    path(
        'mauritania/cities/',
        WeatherViewSet.as_view({'get': 'get_supported_cities'}),
        name='mauritania-cities'
    ),

    # 🔥 météo actuelle (GET)
    path(
        'current/',
        WeatherViewSet.as_view({'get': 'current'}),
        name='current-weather'
    ),

    # 🔥 prévisions
    path(
        'forecast/',
        WeatherViewSet.as_view({'get': 'forecast'}),
        name='weather-forecast'
    ),

    # 🔔 alertes
    path(
        'alerts/',
        WeatherViewSet.as_view({'get': 'alerts'}),
        name='weather-alerts'
    ),

    path(
        'mark-alert-read/',
        WeatherViewSet.as_view({'post': 'mark_alert_read'}),
        name='mark-alert-read'
    ),
]
