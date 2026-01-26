from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.http import HttpResponse, JsonResponse
from django.views.decorators.cache import cache_control
from django.utils.decorators import method_decorator

from .models import Notification, NotificationPreference, PushSubscription
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    PushSubscriptionSerializer,
)
from .services import WebPushService, ServiceWorkerService


# ==================== NOTIFICATION VIEWSET ====================
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Marquer une notification comme lue"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({"message": "Notification marquée comme lue"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Marquer toutes les notifications comme lues"""
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        count = notifications.count()
        notifications.update(is_read=True)

        return Response({"message": f"{count} notifications marquées comme lues"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Compter les notifications non lues"""
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()

        return Response({"unread_count": unread_count})

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Obtenir les notifications récentes (7 derniers jours)"""
        from django.utils import timezone
        from datetime import timedelta

        recent_date = timezone.now() - timedelta(days=7)
        notifications = Notification.objects.filter(
            user=request.user, created_at__gte=recent_date
        ).order_by("-created_at")[:50]

        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)


# ==================== NOTIFICATION PREFERENCE VIEWSET ====================
class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    def get_object(self):
        try:
            return self.request.user.notification_preferences
        except NotificationPreference.DoesNotExist:
            return None

    def create(self, request, *args, **kwargs):
        # Vérifier si les préférences existent déjà
        if hasattr(request.user, "notification_preferences"):
            return Response(
                {
                    "error": "Les préférences existent déjà. Utilisez PUT pour les mettre à jour."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if not instance:
            return Response(
                {"error": "Préférences non trouvées. Créez-les d'abord."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ==================== PUSH SUBSCRIPTION VIEWSET ====================
class PushSubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PushSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

        # Enregistrer l'abonnement dans le service Web Push
        webpush_service = WebPushService()
        webpush_service.subscribe_user(
            self.request.user, serializer.validated_data["subscription_info"]
        )

    @action(detail=False, methods=["delete"])
    def unsubscribe_all(self, request):
        """Se désabonner de toutes les notifications push"""
        PushSubscription.objects.filter(user=request.user).delete()
        return Response({"message": "Désabonné de toutes les notifications push"})


# ==================== SERVICE WORKER & MANIFEST VIEWS ====================
class ServiceWorkerView(APIView):
    """Vue pour servir le Service Worker"""

    permission_classes = []

    def get(self, request, *args, **kwargs):
        service_worker_service = ServiceWorkerService()
        sw_js = service_worker_service.generate_service_worker_js()
        return HttpResponse(
            sw_js,
            content_type="application/javascript",
            headers={
                "Service-Worker-Allowed": "/",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )


class ManifestView(APIView):
    """Vue pour servir le manifeste"""

    permission_classes = []

    def get(self, request, *args, **kwargs):
        service_worker_service = ServiceWorkerService()
        manifest = service_worker_service.generate_manifest_json()
        return JsonResponse(manifest, content_type="application/manifest+json")


class VapidPublicKeyView(APIView):
    """Vue pour servir la clé publique VAPID"""

    permission_classes = []

    def get(self, request, *args, **kwargs):
        webpush_service = WebPushService()
        return JsonResponse({"public_key": webpush_service.get_vapid_public_key()})


# ==================== TEST NOTIFICATION VIEW ====================
class TestNotificationView(generics.GenericAPIView):
    """Vue pour tester les notifications"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Envoyer une notification de test"""
        from .utils import send_test_notification

        notification_type = request.data.get("type", "test")
        title = request.data.get("title", "Notification de test")
        message = request.data.get("message", "Ceci est une notification de test")

        send_test_notification(
            user=request.user,
            notification_type=notification_type,
            title=title,
            message=message,
        )

        return Response({"success": True, "message": "Notification de test envoyée"})
