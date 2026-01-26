from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmerReviewViewSet, RecentReviewsView

router = DefaultRouter()
router.register(r'farmer-reviews', FarmerReviewViewSet, basename='farmer-review')

urlpatterns = [
    path('', include(router.urls)),
    path('recent/', RecentReviewsView.as_view(), name='recent-reviews'),
    path('stats/', FarmerReviewViewSet.as_view({'get': 'farmer_stats'}), name='farmer-review-stats'),
]