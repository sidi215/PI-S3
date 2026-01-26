import requests
from math import radians, sin, cos, sqrt, atan2
from typing import List, Tuple, Dict
import json


class OpenStreetMapService:
    """Service de géolocalisation utilisant OpenStreetMap (gratuit)"""

    def __init__(self):
        self.nominatim_url = "https://nominatim.openstreetmap.org"
        self.overpass_url = "https://overpass-api.de/api/interpreter"

    def search_location(
        self, query: str, city: str = None, country: str = "Mauritanie"
    ):
        """Rechercher une location avec OpenStreetMap"""
        try:
            search_query = (
                f"{query}, {city}, {country}" if city else f"{query}, {country}"
            )

            params = {
                "q": search_query,
                "format": "json",
                "limit": 5,
                "countrycodes": "mr",  # Code pays Mauritanie
                "accept-language": "fr",
            }

            headers = {"User-Agent": "BetterAgri-Mauritanie/1.0"}

            response = requests.get(
                f"{self.nominatim_url}/search",
                params=params,
                headers=headers,
                timeout=10,
            )

            if response.status_code == 200:
                results = response.json()
                if results:
                    return {
                        "name": results[0].get("display_name", ""),
                        "latitude": float(results[0]["lat"]),
                        "longitude": float(results[0]["lon"]),
                        "type": results[0].get("type", ""),
                        "importance": results[0].get("importance", 0),
                    }
        except Exception as e:
            print(f"Erreur recherche OSM: {e}")

        return None

    def reverse_geocode(self, lat: float, lon: float):
        """Convertir coordonnées en adresse"""
        try:
            params = {
                "lat": lat,
                "lon": lon,
                "format": "json",
                "zoom": 16,
                "accept-language": "fr",
            }

            headers = {"User-Agent": "BetterAgri-Mauritanie/1.0"}

            response = requests.get(
                f"{self.nominatim_url}/reverse",
                params=params,
                headers=headers,
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "address": data.get("display_name", ""),
                    "road": data.get("address", {}).get("road", ""),
                    "city": data.get("address", {}).get("city", ""),
                    "state": data.get("address", {}).get("state", ""),
                    "country": data.get("address", {}).get("country", ""),
                }
        except Exception as e:
            print(f"Erreur reverse geocode: {e}")

        return None

    def calculate_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculer distance en km (formule Haversine)"""
        R = 6371  # Rayon Terre en km

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    def get_nearby_places(
        self, lat: float, lon: float, radius_km: float = 10, place_type: str = None
    ):
        """Trouver lieux à proximité"""
        try:
            # Convertir km en degrés (approximatif)
            radius_deg = radius_km / 111

            query = f"""
            [out:json];
            (
              node["shop"="supermarket"](around:{radius_km*1000},{lat},{lon});
              node["amenity"="marketplace"](around:{radius_km*1000},{lat},{lon});
              node["amenity"="bank"](around:{radius_km*1000},{lat},{lon});
              way["shop"="supermarket"](around:{radius_km*1000},{lat},{lon});
              way["amenity"="marketplace"](around:{radius_km*1000},{lat},{lon});
            );
            out center;
            """

            response = requests.post(
                self.overpass_url, data={"data": query}, timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                places = []

                for element in data.get("elements", []):
                    if "tags" in element:
                        place = {
                            "name": element["tags"].get("name", "Sans nom"),
                            "type": element["tags"].get("shop")
                            or element["tags"].get("amenity", ""),
                            "latitude": element.get("lat")
                            or (element.get("center", {}).get("lat", 0)),
                            "longitude": element.get("lon")
                            or (element.get("center", {}).get("lon", 0)),
                            "distance": self.calculate_distance(
                                lat,
                                lon,
                                element.get("lat", lat),
                                element.get("lon", lon),
                            ),
                        }
                        places.append(place)

                # Trier par distance
                places.sort(key=lambda x: x["distance"])
                return places[:20]  # Limiter à 20 résultats

        except Exception as e:
            print(f"Erreur recherche lieux: {e}")

        return []

    def get_route(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        profile: str = "driving",
    ):
        """Obtenir un itinéraire (simplifié - pour production utiliser OSRM)"""
        # Note: Pour production, utiliser OSRM (Open Source Routing Machine)
        # Ici simulation simple

        distance = self.calculate_distance(start_lat, start_lon, end_lat, end_lon)

        # Estimation temps basée sur profil
        if profile == "driving":
            speed_kmh = 60
        elif profile == "walking":
            speed_kmh = 5
        else:  # cycling
            speed_kmh = 15

        duration_hours = distance / speed_kmh
        duration_minutes = int(duration_hours * 60)

        return {
            "distance_km": round(distance, 2),
            "duration_minutes": duration_minutes,
            "profile": profile,
            "route": [
                {"lat": start_lat, "lon": start_lon},
                {"lat": end_lat, "lon": end_lon},
            ],
        }


class MauritaniaLocationService:
    """Service spécifique pour la Mauritanie"""

    # Villes principales Mauritanie avec coordonnées approximatives
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
    }

    def __init__(self):
        self.osm = OpenStreetMapService()

    def geocode_mauritanian_city(self, city_name: str):
        """Géocoder une ville mauritanienne"""
        # D'abord essayer notre base locale
        city = self.MAURITANIA_CITIES.get(city_name.title())
        if city:
            return city

        # Sinon chercher avec OSM
        result = self.osm.search_location(city_name, country="Mauritanie")
        if result:
            return {"lat": result["latitude"], "lon": result["longitude"]}

        # Défaut: Nouakchott
        return self.MAURITANIA_CITIES["Nouakchott"]

    def find_nearby_farmers(
        self, user_lat: float, user_lon: float, radius_km: float = 50
    ):
        """Trouver agriculteurs à proximité"""
        from ..accounts.models import User

        farmers = User.objects.filter(
            user_type="farmer", latitude__isnull=False, longitude__isnull=False
        ).select_related("profile")

        nearby_farmers = []

        for farmer in farmers:
            if farmer.latitude and farmer.longitude:
                distance = self.osm.calculate_distance(
                    user_lat, user_lon, float(farmer.latitude), float(farmer.longitude)
                )

                if distance <= radius_km:
                    farmer_data = {
                        "id": farmer.id,
                        "username": farmer.username,
                        "farm_name": farmer.farm_name,
                        "city": farmer.city,
                        "wilaya": farmer.wilaya,
                        "rating": float(farmer.rating),
                        "latitude": float(farmer.latitude),
                        "longitude": float(farmer.longitude),
                        "distance_km": round(distance, 2),
                        "profile_picture": (
                            farmer.profile_picture.url
                            if farmer.profile_picture
                            else None
                        ),
                    }
                    nearby_farmers.append(farmer_data)

        # Trier par distance
        nearby_farmers.sort(key=lambda x: x["distance_km"])
        return nearby_farmers

    def get_city_boundaries(self, city_name: str):
        """Obtenir les limites d'une ville (pour frontend map)"""
        try:
            query = f"""
            [out:json];
            (
              relation["name"="{city_name}"]["admin_level"="8"]["boundary"="administrative"];
            );
            out body;
            >;
            out skel qt;
            """

            response = requests.post(
                self.osm.overpass_url, data={"data": query}, timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                # Extraire les coordonnées des limites
                # (simplifié - en production, parser correctement les ways/relations)
                return data

        except Exception as e:
            print(f"Erreur limites ville: {e}")

        return None
