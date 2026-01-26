from rest_framework import serializers
from .models import Notification, NotificationPreference, PushSubscription
from apps.accounts.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "notification_type",
            "title",
            "message",
            "channels",
            "related_model",
            "related_id",
            "is_read",
            "is_sent",
            "send_attempts",
            "data",
            "created_at",
            "sent_at",
            "read_at",
        ]
        read_only_fields = ["user", "created_at", "sent_at", "read_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = NotificationPreference
        fields = [
            "id",
            "user",
            "email_new_order",
            "email_order_updates",
            "email_payment",
            "email_marketing",
            "push_new_message",
            "push_order_updates",
            "push_weather_alerts",
            "push_system",
            "in_app_all",
            "sms_urgent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]


class PushSubscriptionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    subscription_info = serializers.JSONField(required=True)

    class Meta:
        model = PushSubscription
        fields = [
            "id",
            "user",
            "endpoint",
            "subscription_info",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]

    def validate_subscription_info(self, value):
        """Valider les informations d'abonnement"""
        required_keys = ["endpoint", "keys"]
        if not all(key in value for key in required_keys):
            raise serializers.ValidationError(
                "Les informations d'abonnement doivent contenir 'endpoint' et 'keys'"
            )

        keys = value.get("keys", {})
        if "p256dh" not in keys or "auth" not in keys:
            raise serializers.ValidationError(
                "Les clés d'abonnement doivent contenir 'p256dh' et 'auth'"
            )

        return value


class SendNotificationSerializer(serializers.Serializer):
    """Serializer pour envoyer des notifications"""

    user_id = serializers.IntegerField(required=True)
    notification_type = serializers.CharField(required=True)
    title = serializers.CharField(required=True, max_length=200)
    message = serializers.CharField(required=True)
    data = serializers.JSONField(required=False, default=dict)
