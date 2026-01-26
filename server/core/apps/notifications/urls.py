from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet,
    NotificationPreferenceViewSet,
    PushSubscriptionViewSet,
    ServiceWorkerView,
    ManifestView,
    VapidPublicKeyView,
)

router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(
    r"preferences", NotificationPreferenceViewSet, basename="notification-preference"
)
router.register(
    r"push-subscriptions", PushSubscriptionViewSet, basename="push-subscription"
)

urlpatterns = [
    path("", include(router.urls)),
    path("service-worker.js", ServiceWorkerView.as_view(), name="service-worker"),
    path("manifest.json", ManifestView.as_view(), name="manifest"),
    path("vapid-public-key/", VapidPublicKeyView.as_view(), name="vapid-public-key"),
]
