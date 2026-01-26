from django.db import models
from django.utils.translation import gettext_lazy as _


class WeatherData(models.Model):
    location = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    # Current weather
    temperature = models.DecimalField(max_digits=5, decimal_places=2)
    feels_like = models.DecimalField(max_digits=5, decimal_places=2)
    humidity = models.IntegerField()
    pressure = models.IntegerField()
    wind_speed = models.DecimalField(max_digits=5, decimal_places=2)
    wind_direction = models.IntegerField()
    weather_condition = models.CharField(max_length=100)
    weather_icon = models.CharField(max_length=20)

    # Additional data
    visibility = models.IntegerField()
    cloudiness = models.IntegerField()
    sunrise = models.DateTimeField()
    sunset = models.DateTimeField()

    # Forecast data (stored as JSON)
    hourly_forecast = models.JSONField(default=list, blank=True)
    daily_forecast = models.JSONField(default=list, blank=True)

    # Agricultural data
    soil_moisture = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    precipitation = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    uv_index = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True
    )

    # AI predictions
    crop_suggestion = models.JSONField(default=list, blank=True)
    irrigation_recommendation = models.TextField(blank=True)
    pest_warning = models.TextField(blank=True)

    # Timestamp
    recorded_at = models.DateTimeField()
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Donnée météo")
        verbose_name_plural = _("Données météo")
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["location", "recorded_at"]),
            models.Index(fields=["latitude", "longitude", "recorded_at"]),
        ]

    def __str__(self):
        return f"{self.location} - {self.recorded_at}"


class FarmerWeatherPreference(models.Model):
    farmer = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="weather_preferences",
        limit_choices_to={"user_type": "farmer"},
    )

    # Location preferences
    default_location = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    # Alert preferences
    receive_rain_alerts = models.BooleanField(default=True)
    receive_frost_alerts = models.BooleanField(default=True)
    receive_storm_alerts = models.BooleanField(default=True)
    receive_drought_alerts = models.BooleanField(default=True)

    # Crop-specific preferences
    crop_types = models.JSONField(default=list, blank=True)
    planting_date = models.DateField(null=True, blank=True)
    harvest_date = models.DateField(null=True, blank=True)

    # Notification preferences
    alert_threshold_rain = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.0
    )
    alert_threshold_temp = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.0
    )
    alert_threshold_wind = models.DecimalField(
        max_digits=5, decimal_places=2, default=30.0
    )

    # Update frequency
    update_frequency = models.CharField(
        max_length=20,
        choices=[
            ("hourly", "Chaque heure"),
            ("3hours", "Toutes les 3 heures"),
            ("6hours", "Toutes les 6 heures"),
            ("daily", "Quotidien"),
        ],
        default="3hours",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Préférence météo agriculteur")
        verbose_name_plural = _("Préférences météo agriculteurs")

    def __str__(self):
        return f"Préférences météo de {self.farmer.username}"


class WeatherAlert(models.Model):
    class AlertType(models.TextChoices):
        RAIN = "rain", _("Pluie")
        STORM = "storm", _("Tempête")
        FROST = "frost", _("Gel")
        HEAT = "heat", _("Canicule")
        DROUGHT = "drought", _("Sécheresse")
        WIND = "wind", _("Vent fort")
        FLOOD = "flood", _("Inondation")
        OTHER = "other", _("Autre")

    class AlertSeverity(models.TextChoices):
        LOW = "low", _("Faible")
        MODERATE = "moderate", _("Modéré")
        HIGH = "high", _("Élevé")
        SEVERE = "severe", _("Sévère")

    farmer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="weather_alerts",
        limit_choices_to={"user_type": "farmer"},
    )

    alert_type = models.CharField(max_length=20, choices=AlertType.choices)
    severity = models.CharField(max_length=20, choices=AlertSeverity.choices)
    location = models.CharField(max_length=200)

    # Alert details
    title = models.CharField(max_length=200)
    description = models.TextField()
    expected_start = models.DateTimeField()
    expected_end = models.DateTimeField()

    # Impact and recommendations
    potential_impact = models.TextField()
    recommendations = models.TextField()

    # Status
    is_active = models.BooleanField(default=True)
    is_read = models.BooleanField(default=False)

    # Metadata
    source = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Alerte météo")
        verbose_name_plural = _("Alertes météo")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["farmer", "is_active", "is_read"]),
            models.Index(fields=["alert_type", "severity"]),
        ]

    def __str__(self):
        return f"{self.alert_type.upper()} - {self.title}"
