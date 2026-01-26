from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta

from .models import Category, Product, ProductReview, Wishlist
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductCreateSerializer,
    ProductReviewSerializer,
    WishlistSerializer,
    ProductUpdateSerializer,
)
from .permissions import IsFarmerOrReadOnly, IsProductOwner
from apps.notifications.utils import send_product_notification


# ==================== CATEGORY VIEWSET ====================
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour les catégories de produits.
    Lecture seule pour tous les utilisateurs.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrer par parent (catégories principales)
        parent_id = self.request.query_params.get("parent_id")
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)

        # Catégories principales seulement
        main_categories_only = (
            self.request.query_params.get("main_only", "false").lower() == "true"
        )
        if main_categories_only:
            queryset = queryset.filter(parent__isnull=True)

        return queryset

    @action(detail=True, methods=["get"])
    def products(self, request, pk=None):
        """Obtenir tous les produits d'une catégorie"""
        category = self.get_object()
        products = (
            Product.objects.filter(
                category=category, status="active", available_quantity__gt=0
            )
            .select_related("farmer")
            .prefetch_related("reviews")
        )

        # Appliquer les filtres
        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")
        organic = request.query_params.get("organic")

        if min_price:
            products = products.filter(price_per_unit__gte=min_price)
        if max_price:
            products = products.filter(price_per_unit__lte=max_price)
        if organic and organic.lower() == "true":
            products = products.filter(organic=True)

        # Pagination
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = ProductSerializer(
            products, many=True, context={"request": request}
        )
        return Response(serializer.data)


# ==================== PRODUCT VIEWSET ====================
class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les produits.
    Les agriculteurs peuvent créer/modifier, tout le monde peut lire.
    """

    queryset = Product.objects.select_related("farmer", "category").prefetch_related(
        "reviews"
    )
    permission_classes = [IsAuthenticatedOrReadOnly, IsFarmerOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "farmer", "organic", "quality_grade", "status"]
    search_fields = ["name", "description", "farm_location"]
    ordering_fields = ["price_per_unit", "created_at", "views_count", "orders_count"]
    ordering = ["-created_at"]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="my-products",
    )
    def my_products(self, request):
        products = self.queryset.filter(farmer=request.user)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    def get_serializer_class(self):
        if self.action == "create":
            return ProductCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return ProductUpdateSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrer par disponibilité
        available_only = (
            self.request.query_params.get("available_only", "false").lower() == "true"
        )
        if available_only:
            queryset = queryset.filter(status="active", available_quantity__gt=0)

        # Filtrer par prix
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(price_per_unit__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_unit__lte=max_price)

        # Filtrer par localisation
        location = self.request.query_params.get("location")
        if location:
            queryset = queryset.filter(farm_location__icontains=location)

        # Filtrer par wilaya (Mauritanie)
        wilaya = self.request.query_params.get("wilaya")
        if wilaya:
            queryset = queryset.filter(farmer__wilaya=wilaya)

        # Filtrer par ville (Mauritanie)
        city = self.request.query_params.get("city")
        if city:
            queryset = queryset.filter(farmer__city=city)

        # Annoter avec la note moyenne
        queryset = queryset.annotate(
            average_rating=Avg("reviews__rating"), total_reviews=Count("reviews")
        )

        return queryset

    def perform_create(self, serializer):
        product = serializer.save(farmer=self.request.user)

        # Envoyer une notification
        send_product_notification(
            product=product, notification_type="new_product", user=self.request.user
        )

    def perform_update(self, serializer):
        product = serializer.save()

        # Envoyer une notification si stock faible
        if product.available_quantity <= 10:
            send_product_notification(
                product=product, notification_type="low_stock", user=self.request.user
            )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=["views_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_wishlist(self, request, pk=None):
        """Ajouter/retirer un produit de la liste de souhaits"""
        product = self.get_object()
        wishlist_item = Wishlist.objects.filter(user=request.user, product=product)

        if wishlist_item.exists():
            wishlist_item.delete()
            return Response({"status": "removed"})
        else:
            Wishlist.objects.create(user=request.user, product=product)
            return Response({"status": "added"})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def farmer_products(self, request):
        """Obtenir tous les produits d'un agriculteur"""
        if request.user.user_type != "farmer":
            return Response(
                {
                    "error": "Seuls les agriculteurs peuvent accéder à cette fonctionnalité"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        products = Product.objects.filter(farmer=request.user)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsProductOwner])
    def update_stock(self, request, pk=None):
        """Mettre à jour le stock d'un produit"""
        product = self.get_object()
        quantity = request.data.get("quantity")

        if not quantity:
            return Response(
                {"error": "Quantité requise"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = float(quantity)
            if quantity < 0:
                return Response(
                    {"error": "La quantité ne peut pas être négative"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            product.available_quantity = quantity
            if quantity == 0:
                product.status = "sold_out"
            elif product.status == "sold_out":
                product.status = "active"
            product.save()

            return Response(
                {
                    "message": "Stock mis à jour avec succès",
                    "available_quantity": product.available_quantity,
                    "status": product.status,
                }
            )

        except ValueError:
            return Response(
                {"error": "Quantité invalide"}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["post"], permission_classes=[IsProductOwner])
    def toggle_status(self, request, pk=None):
        """Activer/désactiver un produit"""
        product = self.get_object()

        if product.status == "active":
            product.status = "inactive"
        elif product.status == "inactive":
            product.status = "active"
        elif product.status == "draft":
            product.status = "active"
        elif product.status == "sold_out":
            if product.available_quantity > 0:
                product.status = "active"

        product.save()

        return Response(
            {
                "message": f"Produit {product.get_status_display()}",
                "status": product.status,
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def nearby_products(self, request):
        """Obtenir les produits près de l'utilisateur"""
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")
        radius = request.query_params.get("radius", 50)  # km

        if not lat or not lon:
            return Response(
                {"error": "Coordonnées GPS requises"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pour le moment, retourner les produits avec rayon de livraison
        products = (
            Product.objects.filter(
                status="active", available_quantity__gt=0, delivery_radius__gte=0
            )
            .annotate(average_rating=Avg("reviews__rating"))
            .order_by("?")[:20]
        )  # Échantillon aléatoire pour la démo

        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def featured_products(self, request):
        """Produits en vedette (les plus vendus/vus)"""
        products = (
            Product.objects.filter(status="active", available_quantity__gt=0)
            .annotate(average_rating=Avg("reviews__rating"))
            .order_by("-orders_count", "-views_count")[:10]
        )

        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


# ==================== PRODUCT REVIEW VIEWSET ====================
class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les avis sur les produits.
    Seuls les acheteurs ayant commandé le produit peuvent laisser un avis.
    """

    queryset = ProductReview.objects.select_related("user", "product")
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["product", "user", "rating"]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrer par produit spécifique
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Filtrer par utilisateur
        user_id = self.request.query_params.get("user_id")
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Ordonner par date
        ordering = self.request.query_params.get("ordering", "-created_at")
        if ordering in ["created_at", "-created_at", "updated_at", "-updated_at"]:
            queryset = queryset.order_by(ordering)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def report(self, request, pk=None):
        """Signaler un avis inapproprié"""
        review = self.get_object()

        # Vérifier que l'utilisateur n'est pas le propriétaire de l'avis
        if review.user == request.user:
            return Response(
                {"error": "Vous ne pouvez pas signaler votre propre avis"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enregistrer le signalement (simplifié)
        # Dans une version réelle, vous auriez un modèle Report
        return Response(
            {
                "message": "Avis signalé avec succès",
                "review_id": review.id,
                "reported_by": request.user.id,
            }
        )


# ==================== WISHLIST VIEWSET ====================
class WishlistViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la liste de souhaits des utilisateurs.
    Chaque utilisateur ne peut voir que sa propre liste de souhaits.
    """

    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related("product")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["delete"])
    def clear(self, request):
        """Vider toute la liste de souhaits"""
        Wishlist.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def count(self, request):
        """Compter les articles dans la liste de souhaits"""
        count = Wishlist.objects.filter(user=request.user).count()
        return Response({"count": count})


# ==================== VIEWS ADDITIONNELLES ====================
class ProductSearchView(generics.ListAPIView):
    """
    Vue de recherche avancée pour les produits.
    """

    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name", "description", "farm_location"]
    filterset_fields = ["category", "organic", "quality_grade"]

    def get_queryset(self):
        queryset = (
            Product.objects.filter(status="active", available_quantity__gt=0)
            .select_related("farmer", "category")
            .prefetch_related("reviews")
        )

        # Filtrer par prix
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")

        if min_price:
            queryset = queryset.filter(price_per_unit__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_unit__lte=max_price)

        # Filtrer par wilaya/ville
        wilaya = self.request.query_params.get("wilaya")
        city = self.request.query_params.get("city")

        if wilaya:
            queryset = queryset.filter(farmer__wilaya=wilaya)
        if city:
            queryset = queryset.filter(farmer__city=city)

        # Annoter avec la note moyenne
        queryset = queryset.annotate(
            average_rating=Avg("reviews__rating"), total_reviews=Count("reviews")
        )

        return queryset


class CategoryProductsView(generics.ListAPIView):
    """
    Vue pour obtenir tous les produits d'une catégorie.
    """

    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        category_id = self.kwargs.get("category_id")

        queryset = (
            Product.objects.filter(
                category_id=category_id, status="active", available_quantity__gt=0
            )
            .select_related("farmer", "category")
            .prefetch_related("reviews")
        )

        # Annoter avec la note moyenne
        queryset = queryset.annotate(
            average_rating=Avg("reviews__rating"), total_reviews=Count("reviews")
        )

        return queryset
