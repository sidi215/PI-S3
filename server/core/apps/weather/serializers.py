from rest_framework import serializers
from .models import WeatherData, FarmerWeatherPreference, WeatherAlert
from apps.accounts.serializers import UserSerializer

class WeatherDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherData
        fields = [
            'id', 'location', 'latitude', 'longitude',
            'temperature', 'feels_like', 'humidity', 'pressure',
            'wind_speed', 'wind_direction', 'weather_condition',
            'weather_icon', 'visibility', 'cloudiness', 'sunrise',
            'sunset', 'hourly_forecast', 'daily_forecast', 'soil_moisture',
            'precipitation', 'uv_index', 'crop_suggestion',
            'irrigation_recommendation', 'pest_warning',
            'recorded_at', 'fetched_at'
        ]
        read_only_fields = ['fetched_at']

class FarmerWeatherPreferenceSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)
    
    class Meta:
        model = FarmerWeatherPreference
        fields = [
            'id', 'farmer', 'default_location', 'latitude', 'longitude',
            'receive_rain_alerts', 'receive_frost_alerts',
            'receive_storm_alerts', 'receive_drought_alerts',
            'crop_types', 'planting_date', 'harvest_date',
            'alert_threshold_rain', 'alert_threshold_temp',
            'alert_threshold_wind', 'update_frequency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Valider que l'utilisateur est un agriculteur
        if self.context['request'].user.user_type != 'farmer':
            raise serializers.ValidationError(
                "Seuls les agriculteurs peuvent configurer des préférences météo"
            )
        return data

class WeatherAlertSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)
    
    class Meta:
        model = WeatherAlert
        fields = [
            'id', 'farmer', 'alert_type', 'severity', 'location',
            'title', 'description', 'expected_start', 'expected_end',
            'potential_impact', 'recommendations', 'is_active',
            'is_read', 'source', 'external_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'created_at', 'updated_at']

class WeatherRequestSerializer(serializers.Serializer):
    """Serializer pour les requêtes météo"""
    latitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        required=True,
        help_text="Latitude du lieu"
    )
    longitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        required=True,
        help_text="Longitude du lieu"
    )
    city_name = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Nom de la ville (facultatif si coordonnées fournies)"
    )
    
    def validate(self, data):
        # Validation des coordonnées
        lat = data.get('latitude')
        lon = data.get('longitude')
        
        if lat is not None and lon is not None:
            if not (-90 <= float(lat) <= 90):
                raise serializers.ValidationError({
                    'latitude': 'La latitude doit être entre -90 et 90 degrés'
                })
            if not (-180 <= float(lon) <= 180):
                raise serializers.ValidationError({
                    'longitude': 'La longitude doit être entre -180 et 180 degrés'
                })
        
        return data

class CitySearchSerializer(serializers.Serializer):
    """Serializer pour la recherche de villes"""
    query = serializers.CharField(
        max_length=100,
        required=True,
        help_text="Terme de recherche pour trouver une ville"
    )

class AlertNotificationSerializer(serializers.Serializer):
    """Serializer pour les notifications d'alertes"""
    alert_id = serializers.IntegerField(required=True)
    action = serializers.ChoiceField(
        choices=['mark_read', 'dismiss', 'snooze'],
        default='mark_read'
    )
    snooze_hours = serializers.IntegerField(
        min_value=1,
        max_value=24,
        default=4,
        required=False
    )