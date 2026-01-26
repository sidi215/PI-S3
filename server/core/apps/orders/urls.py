from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CartViewSet, CartItemViewSet,
    OrderViewSet, FarmerOrderViewSet
)

router = DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'cart-items', CartItemViewSet, basename='cartitem')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'farmer-orders', FarmerOrderViewSet, basename='farmer-order')

urlpatterns = [
    path('', include(router.urls)),
]