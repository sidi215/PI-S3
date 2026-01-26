import requests
import json
from datetime import datetime, timedelta
from django.conf import settings
import random
from django.utils import timezone


class MauritaniaWeatherService:
    """Service météo spécifique à la Mauritanie"""

    # Villes Mauritanie avec coordonnées
    MAURITANIA_CITIES = {
        "Nouakchott": {"lat": 18.0735, "lon": -15.9582},
        "Nouadhibou": {"lat": 20.9425, "lon": -17.0382},
        "Kiffa": {"lat": 16.6200, "lon": -11.4022},
        "Rosso": {"lat": 16.5128, "lon": -15.8086},
        "Zouérat": {"lat": 22.7350, "lon": -12.4789},
        "Atar": {"lat": 20.5167, "lon": -13.0500},
        "Kaédi": {"lat": 16.1500, "lon": -13.5000},
        "Aleg": {"lat": 17.0500, "lon": -13.9167},
        "Boutilimit": {"lat": 17.5333, "lon": -14.6833},
        "Selibaby": {"lat": 15.1500, "lon": -12.1833},
        "Tidjikja": {"lat": 18.5500, "lon": -11.4333},
        "Néma": {"lat": 16.6167, "lon": -7.2500},
        "Aïoun": {"lat": 16.6667, "lon": -9.6167},
    }

    # Zones climatiques
    CLIMATE_ZONES = {
        "Côtier": ["Nouakchott", "Nouadhibou"],
        "Côtier Sud": ["Rosso", "Boutilimit"],
        "Désertique Nord": ["Zouérat", "Atar"],
        "Désertique Côtier": ["Kiffa", "Aleg"],
        "Soudanien": ["Kaédi", "Selibaby"],
    }

    def __init__(self):
        self.api_key = getattr(settings, "WEATHER_API_KEY", "")
        self.base_url = getattr(
            settings, "WEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5"
        )

        # Données simulées pour tests
        self.mock_data = {
            "temperature": random.uniform(20, 40),  # Typique Mauritanie
            "humidity": random.randint(10, 80),  # Très variable
            "weather_condition": random.choice(
                ["Ensoleillé", "Partiellement nuageux", "Sableux", "Venteux", "Clair"]
            ),
            "wind_speed": random.uniform(5, 25),  # Vent fréquent
            "precipitation": random.uniform(0, 5),  # Faibles précipitations
        }

    def get_weather_for_city(self, city_name):
        """Obtenir la météo pour une ville mauritanienne"""

        # Normaliser le nom de la ville
        city_name = self._normalize_city_name(city_name)

        # Obtenir les coordonnées
        city_data = self.MAURITANIA_CITIES.get(city_name)
        if not city_data:
            # Chercher une correspondance partielle
            for city in self.MAURITANIA_CITIES.keys():
                if city_name.lower() in city.lower():
                    city_data = self.MAURITANIA_CITIES[city]
                    city_name = city
                    break

        if not city_data:
            # Défaut: Nouakchott
            city_data = self.MAURITANIA_CITIES["Nouakchott"]
            city_name = "Nouakchott"

        # Obtenir données météo
        weather_data = self._get_weather_data(
            city_data["lat"], city_data["lon"], city_name
        )

        # Ajouter recommandations agricoles
        recommendations = self._get_agricultural_recommendations(
            city_name, weather_data
        )

        weather_data["recommendations"] = recommendations
        weather_data["climate_zone"] = self._get_climate_zone(city_name)
        weather_data["city"] = city_name

        return weather_data

    def _get_weather_data(self, lat, lon, city_name):
        """Obtenir les données météo"""

        # Si pas de clé API ou mode test, utiliser données simulées
        if not self.api_key or self.api_key.startswith("test_"):
            return self._get_mock_weather(lat, lon, city_name)

        # Sinon appeler OpenWeatherMap
        try:
            url = f"{self.base_url}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric",
                "lang": "fr",
            }

            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return self._parse_api_response(response.json(), city_name)
        except Exception as e:
            print(f"Erreur API météo: {e}")

        # Fallback aux données simulées
        return self._get_mock_weather(lat, lon, city_name)

    def _get_mock_weather(self, lat, lon, city_name):
        """Données météo simulées pour tests"""
        now = timezone.now()

        return {
            "location": city_name,
            "latitude": lat,
            "longitude": lon,
            "temperature": round(self.mock_data["temperature"], 1),
            "feels_like": round(self.mock_data["temperature"] - 2, 1),
            "humidity": self.mock_data["humidity"],
            "pressure": 1013,
            "wind_speed": round(self.mock_data["wind_speed"], 1),
            "wind_direction": random.choice(
                ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
            ),
            "weather_condition": self.mock_data["weather_condition"],
            "weather_icon": "01d",
            "visibility": 10000,
            "cloudiness": random.randint(0, 100),
            "sunrise": now - timedelta(hours=6),
            "sunset": now + timedelta(hours=6),
            "recorded_at": now,
            "precipitation": round(self.mock_data["precipitation"], 1),
            "uv_index": random.randint(5, 12),  # Élevé en Mauritanie
            "hourly_forecast": [],
            "daily_forecast": [],
            "soil_moisture": round(random.uniform(10, 60), 1),
        }

    def _get_agricultural_recommendations(self, city_name, weather_data):
        """Recommandations agricoles pour la Mauritanie"""
        temp = weather_data.get("temperature", 30)
        humidity = weather_data.get("humidity", 40)
        precipitation = weather_data.get("precipitation", 0)
        wind_speed = weather_data.get("wind_speed", 10)

        recommendations = []

        # Recommandations générales
        if temp > 35:
            recommendations.append(
                "🌡️ Températures élevées : Arroser tôt le matin ou en soirée"
            )

        if temp < 15:
            recommendations.append(
                "❄️ Températures fraîches : Protéger les cultures sensibles"
            )

        if precipitation < 2 and temp > 30:
            recommendations.append(
                "💧 Faibles précipitations : Augmenter la fréquence d'irrigation"
            )

        if humidity < 20:
            recommendations.append(
                "🌵 Humidité très basse : Utiliser l'irrigation goutte-à-goutte"
            )

        if wind_speed > 20:
            recommendations.append(
                "💨 Vents forts : Sécuriser les serres et équipements"
            )

        # Recommandations par zone
        zone = self._get_climate_zone(city_name)
        if zone == "Côtier":
            recommendations.append("🌊 Zone côtière : Surveiller la salinité des sols")
        elif zone == "Désertique Nord":
            recommendations.append(
                "🏜️ Zone désertique : Privilégier les cultures résistantes à la sécheresse"
            )
        elif zone == "Soudanien":
            recommendations.append(
                "🌾 Zone soudanienne : Bonne période pour les céréales"
            )

        # Recommandations saisonnières
        month = datetime.now().month
        if 3 <= month <= 5:  # Printemps
            recommendations.append("🌱 Printemps : Plantation des dattes et légumes")
        elif 6 <= month <= 8:  # Été
            recommendations.append("☀️ Été : Culture du maïs et du riz")
        elif 9 <= month <= 11:  # Automne
            recommendations.append("🍂 Automne : Récolte des céréales")
        else:  # Hiver
            recommendations.append("❄️ Hiver : Culture du blé et des légumes d'hiver")

        return recommendations[:5]  # Limiter à 5 recommandations

    def _get_climate_zone(self, city_name):
        """Obtenir la zone climatique"""
        for zone, cities in self.CLIMATE_ZONES.items():
            if city_name in cities:
                return zone
        return "Non spécifié"

    def _normalize_city_name(self, city_name):
        """Normaliser le nom de la ville"""
        # Convertir en titre (première lettre majuscule)
        return city_name.strip().title()

    def _parse_api_response(self, api_data, city_name):
        """Parser la réponse de l'API OpenWeatherMap"""
        now = timezone.now()

        return {
            "location": city_name,
            "latitude": api_data["coord"]["lat"],
            "longitude": api_data["coord"]["lon"],
            "temperature": api_data["main"]["temp"],
            "feels_like": api_data["main"]["feels_like"],
            "humidity": api_data["main"]["humidity"],
            "pressure": api_data["main"]["pressure"],
            "wind_speed": api_data["wind"]["speed"],
            "wind_direction": api_data["wind"].get("deg", 0),
            "weather_condition": api_data["weather"][0]["description"],
            "weather_icon": api_data["weather"][0]["icon"],
            "visibility": api_data.get("visibility", 10000),
            "cloudiness": api_data["clouds"]["all"],
            "sunrise": datetime.fromtimestamp(api_data["sys"]["sunrise"]),
            "sunset": datetime.fromtimestamp(api_data["sys"]["sunset"]),
            "recorded_at": datetime.fromtimestamp(api_data["dt"]),
            "precipitation": api_data.get("rain", {}).get("1h", 0)
            or api_data.get("snow", {}).get("1h", 0),
        }

    def get_supported_cities(self):
        """Liste des villes supportées"""
        cities = []
        for city in self.MAURITANIA_CITIES.keys():
            cities.append(
                {
                    "name": city,
                    "wilaya": self._get_wilaya_for_city(city),
                    "coordinates": self.MAURITANIA_CITIES[city],
                }
            )
        return cities

    def _get_wilaya_for_city(self, city_name):
        """Obtenir la wilaya pour une ville"""
        wilaya_map = {
            "Nouakchott": "Nouakchott",
            "Nouadhibou": "Dakhlet Nouadhibou",
            "Kiffa": "Hodh Ech Chargui",
            "Rosso": "Trarza",
            "Zouérat": "Tiris Zemmour",
            "Atar": "Adrar",
            "Kaédi": "Gorgol",
            "Aleg": "Brakna",
            "Boutilimit": "Trarza",
            "Selibaby": "Guidimaka",
            "Tidjikja": "Tagant",
            "Néma": "Hodh Ech Chargui",
            "Aïoun": "Hodh El Gharbi",
        }
        return wilaya_map.get(city_name, "Non spécifiée")


class WeatherService:
    """Service météo général"""

    def __init__(self):
        self.api_key = getattr(settings, "WEATHER_API_KEY", "")

    def get_current_weather(self, lat, lon):
        """Obtenir la météo actuelle"""
        mauritania_service = MauritaniaWeatherService()

        # Trouver la ville la plus proche
        closest_city = self._find_closest_city(lat, lon)
        if closest_city:
            return mauritania_service.get_weather_for_city(closest_city)

        # Fallback aux données simulées
        return mauritania_service._get_mock_weather(lat, lon, "Localisation")

    def get_forecast(self, lat, lon):
        """Obtenir les prévisions météo"""
        # Pour le moment, retourner des données simulées
        return {"hourly": [], "daily": [], "timestamp": timezone.now().isoformat()}

    def _find_closest_city(self, lat, lon):
        """Trouver la ville la plus proche"""
        mauritania_service = MauritaniaWeatherService()
        cities = mauritania_service.MAURITANIA_CITIES

        if not cities:
            return None

        # Calcul simple de la distance (simplifié)
        closest_city = None
        min_distance = float("inf")

        for city, coords in cities.items():
            distance = abs(coords["lat"] - lat) + abs(coords["lon"] - lon)
            if distance < min_distance:
                min_distance = distance
                closest_city = city

        return closest_city

    def check_alerts(self, user, weather_data):
        """Vérifier les alertes météo"""
        alerts = []

        # Logique simplifiée pour les alertes
        temp = weather_data.get("temperature", 25)
        precipitation = weather_data.get("precipitation", 0)
        wind_speed = weather_data.get("wind_speed", 10)

        if temp > 38:
            alerts.append(
                {
                    "alert_type": "heat",
                    "severity": "high",
                    "title": "Alerte de canicule",
                    "description": f"Température élevée: {temp}°C",
                    "potential_impact": "Risque pour les cultures sensibles",
                    "recommendations": "Arroser abondamment le matin",
                }
            )

        if precipitation > 20:
            alerts.append(
                {
                    "alert_type": "rain",
                    "severity": "moderate",
                    "title": "Fortes pluies attendues",
                    "description": f"Précipitations importantes: {precipitation}mm",
                    "potential_impact": "Risque d'inondation",
                    "recommendations": "Drainer les zones basses",
                }
            )

        if wind_speed > 30:
            alerts.append(
                {
                    "alert_type": "wind",
                    "severity": "high",
                    "title": "Vents forts",
                    "description": f"Vent à {wind_speed} km/h",
                    "potential_impact": "Dommages aux cultures et équipements",
                    "recommendations": "Sécuriser les installations",
                }
            )

        return alerts


class AIService:
    """Service d'IA pour les recommandations agricoles"""

    def generate_crop_suggestions(self, weather_data):
        """Générer des suggestions de cultures"""
        temp = weather_data.get("temperature", 25)
        humidity = weather_data.get("humidity", 40)

        suggestions = []

        if 20 <= temp <= 35 and humidity >= 30:
            suggestions.extend(
                [
                    {
                        "crop": "Tomates",
                        "season": "Toute l'année",
                        "notes": "Bonne résistance",
                    },
                    {
                        "crop": "Concombres",
                        "season": "Printemps-Été",
                        "notes": "Nécessite un arrosage régulier",
                    },
                    {
                        "crop": "Poivrons",
                        "season": "Printemps-Été",
                        "notes": "Sensible au froid",
                    },
                ]
            )

        if temp > 30 and humidity < 30:
            suggestions.extend(
                [
                    {
                        "crop": "Dattes",
                        "season": "Annuelle",
                        "notes": "Très résistant à la sécheresse",
                    },
                    {
                        "crop": "Melons",
                        "season": "Été",
                        "notes": "Nécessite beaucoup d'eau",
                    },
                    {
                        "crop": "Pastèques",
                        "season": "Été",
                        "notes": "Adapté aux climats chauds",
                    },
                ]
            )

        if temp < 20:
            suggestions.extend(
                [
                    {
                        "crop": "Laitue",
                        "season": "Hiver-Printemps",
                        "notes": "Culture rapide",
                    },
                    {
                        "crop": "Carottes",
                        "season": "Automne-Hiver",
                        "notes": "Sol bien drainé",
                    },
                    {
                        "crop": "Oignons",
                        "season": "Hiver",
                        "notes": "Facile à cultiver",
                    },
                ]
            )

        return suggestions

    def generate_irrigation_recommendation(self, weather_data, soil_moisture):
        """Générer des recommandations d'irrigation"""
        temp = weather_data.get("temperature", 25)
        humidity = weather_data.get("humidity", 40)
        precipitation = weather_data.get("precipitation", 0)

        if soil_moisture < 20:
            return "Irrigation urgente nécessaire - sol très sec"
        elif soil_moisture < 40:
            if temp > 30:
                return "Irrigation recommandée - 30 minutes le matin"
            else:
                return "Irrigation légère recommandée - 15 minutes"
        elif precipitation > 10:
            return "Pas d'irrigation nécessaire - pluies suffisantes"
        else:
            return "Irrigation normale - 20 minutes le matin"
