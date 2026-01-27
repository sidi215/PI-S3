import asyncio
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from .services import MauritaniaWeatherService
from .models import WeatherData, FarmerWeatherPreference, WeatherAlert
from .serializers import (
    WeatherDataSerializer,
    FarmerWeatherPreferenceSerializer,
    WeatherAlertSerializer,
    WeatherRequestSerializer,
)
from .services import WeatherService, AIService
from .tasks import fetch_weather_data


class WeatherViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # MAURITANIE – météo par ville
    @action(detail=False, methods=["post"])
    def mauritania_weather(self, request):
        city = request.data.get("city")
        if not city:
            return Response(
                {"error": "city is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        service = MauritaniaWeatherService()
        data = service.get_weather_for_city(city)
        return Response(data)

    # villes supportées
    @action(detail=False, methods=["get"])
    def get_supported_cities(self, request):
        service = MauritaniaWeatherService()
        return Response(service.get_supported_cities())

    # météo actuelle (GET)
    @action(detail=False, methods=["get"])
    def current(self, request):
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")

        if not lat or not lon:
            if request.user.user_type == "farmer":
                try:
                    prefs = request.user.weather_preferences
                    lat = prefs.latitude
                    lon = prefs.longitude
                except FarmerWeatherPreference.DoesNotExist:
                    return Response(
                        {"error": "Location not provided"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"error": "lat and lon are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        lat, lon = float(lat), float(lon)

        # cache 1h
        weather = WeatherData.objects.filter(
            latitude=lat,
            longitude=lon,
            recorded_at__gte=timezone.now() - timedelta(hours=1),
        ).first()

        if not weather:
            service = WeatherService()
            data = service.get_current_weather(lat, lon)

            if not data:
                return Response(
                    {"error": "Unable to fetch weather"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            ai = AIService()
            data["crop_suggestion"] = ai.generate_crop_suggestions(data)
            data["irrigation_recommendation"] = ai.generate_irrigation_recommendation(
                data, data.get("soil_moisture", 40)
            )

            weather = WeatherData.objects.create(**data)

        return Response(WeatherDataSerializer(weather).data)

    # prévisions
    @action(detail=False, methods=["get"])
    def forecast(self, request):
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")

        if not lat or not lon:
            return Response(
                {"error": "lat and lon are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = WeatherService()
        return Response(service.get_forecast(float(lat), float(lon)))

    # alertes agriculteur
    @action(detail=False, methods=["get"])
    def alerts(self, request):
        if request.user.user_type != "farmer":
            return Response(
                {"error": "Only farmers can access alerts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        alerts = WeatherAlert.objects.filter(
            farmer=request.user, is_active=True
        ).order_by("-created_at")

        return Response(WeatherAlertSerializer(alerts, many=True).data)

    # marquer alerte lue
    @action(detail=False, methods=["post"])
    def mark_alert_read(self, request):
        alert_id = request.data.get("alert_id")

        try:
            alert = WeatherAlert.objects.get(id=alert_id, farmer=request.user)
            alert.is_read = True
            alert.save()
            return Response({"status": "success"})
        except WeatherAlert.DoesNotExist:
            return Response(
                {"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND
            )


class FarmerWeatherPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = FarmerWeatherPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FarmerWeatherPreference.objects.filter(farmer=self.request.user)

    def get_object(self):
        try:
            return self.request.user.weather_preferences
        except FarmerWeatherPreference.DoesNotExist:
            return None

    def create(self, request, *args, **kwargs):
        # Ensure user is a farmer
        if request.user.user_type != "farmer":
            return Response(
                {"error": "Only farmers can set weather preferences"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(farmer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if not instance:
            return Response(
                {"error": "Preferences not found. Create them first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class WeatherAlertViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WeatherAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == "farmer":
            return WeatherAlert.objects.filter(farmer=self.request.user)
        return WeatherAlert.objects.none()

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({"status": "success"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        alerts = self.get_queryset().filter(is_read=False)
        alerts.update(is_read=True)
        return Response({"status": "success", "marked": alerts.count()})
