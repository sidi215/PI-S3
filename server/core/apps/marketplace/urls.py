from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ProductViewSet,
    ProductReviewViewSet,
    WishlistViewSet,
    ProductSearchView,
    CategoryProductsView,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet)
router.register(r"products", ProductViewSet)
router.register(r"reviews", ProductReviewViewSet)
router.register(r"wishlist", WishlistViewSet, basename="wishlist")

urlpatterns = [
    path("", include(router.urls)),
    path("search/", ProductSearchView.as_view(), name="product-search"),
    path(
        "categories/<int:category_id>/products/",
        CategoryProductsView.as_view(),
        name="category-products",
    ),
]
