from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PayoutViewSet, PaymentWebhookView, PaymentTestView

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payouts', PayoutViewSet, basename='payout')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('test/', PaymentTestView.as_view(), name='payment-test'),
]