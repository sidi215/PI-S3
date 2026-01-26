# apps/analytics/serializers.py - Version simplifiée
from rest_framework import serializers
from .models import FarmerAnalytics
from apps.accounts.serializers import UserSerializer


class FarmerAnalyticsSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)

    class Meta:
        model = FarmerAnalytics
        fields = [
            "id",
            "farmer",
            "total_sales",
            "total_orders",
            "average_order_value",
            "total_customers",
            "repeat_customer_rate",
            "total_products",
            "active_products",
            "best_selling_products",
            "average_rating",
            "total_reviews",
            "monthly_sales",
            "monthly_orders",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class DashboardSerializer(serializers.Serializer):
    """Serializer pour le tableau de bord simplifié"""

    user_type = serializers.CharField()
    welcome_message = serializers.CharField()
    stats = serializers.DictField()
    quick_actions = serializers.ListField()


class AdminAnalyticsSerializer(serializers.Serializer):
    """Serializer pour les analytics admin simplifié"""

    period = serializers.CharField()
    stats = serializers.DictField()
    top_farmers = serializers.ListField()
