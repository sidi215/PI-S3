from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"farmer", views.FarmerAnalyticsViewSet, basename="farmer-analytics")
router.register(r"dashboard", views.DashboardViewSet, basename="dashboard")
router.register(r"admin", views.AdminAnalyticsViewSet, basename="admin-analytics")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "update-farmer/<int:farmer_id>/",
        views.update_farmer_analytics,
        name="update-farmer-analytics",
    ),
    path("update-all/", views.update_all_analytics, name="update-all-analytics"),
]
