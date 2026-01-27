from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum
from decimal import Decimal

from .models import Order, OrderItem, Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
)
from apps.marketplace.models import Product
from apps.notifications.utils import send_order_notification
from django.db.models import Avg, Count
from apps.reviews.models import FarmerReview
from apps.marketplace.models import Product, ProductReview


# CART VIEWSET
class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Chaque utilisateur ne peut voir que son propre panier
        return Cart.objects.filter(user=self.request.user)

    def get_object(self):
        # Obtenir ou créer le panier de l'utilisateur
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

    @action(detail=False, methods=["post"])
    def clear(self, request):
        """Vider le panier"""
        cart = self.get_object()
        cart.items.all().delete()
        return Response({"message": "Panier vidé."})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Obtenir un résumé du panier"""
        cart = self.get_object()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def checkout_preview(self, request):
        """Aperçu avant paiement avec calcul des frais"""
        cart = self.get_object()

        if cart.items.count() == 0:
            return Response(
                {"error": "Votre panier est vide."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Calculer les frais
        subtotal = cart.subtotal
        shipping_fee = 10.00  # Frais fixes pour la démo
        tax_amount = subtotal * 0.18  # TVA 18%
        total_amount = subtotal + shipping_fee + tax_amount

        return Response(
            {
                "subtotal": float(subtotal),
                "shipping_fee": shipping_fee,
                "tax_amount": float(tax_amount),
                "total_amount": float(total_amount),
                "items_count": cart.items.count(),
            }
        )


# CART ITEM VIEWSET
class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Obtenir le panier de l'utilisateur
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def perform_create(self, serializer):
        # Associer automatiquement au panier de l'utilisateur
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        serializer.save(cart=cart)

    def perform_update(self, serializer):
        instance = serializer.save()
        # Si la quantité devient 0, supprimer l'article
        if instance.quantity == 0:
            instance.delete()

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """Mettre à jour plusieurs articles du panier en une seule requête"""
        cart, created = Cart.objects.get_or_create(user=request.user)
        items_data = request.data.get("items", [])

        updated_items = []
        errors = []

        for item_data in items_data:
            item_id = item_data.get("id")
            quantity = item_data.get("quantity")

            if not item_id or quantity is None:
                errors.append(f"Article invalide: {item_data}")
                continue

            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)

                if quantity <= 0:
                    cart_item.delete()
                else:
                    cart_item.quantity = quantity
                    cart_item.save()
                    updated_items.append(cart_item.id)

            except CartItem.DoesNotExist:
                errors.append(f"Article {item_id} non trouvé dans le panier")
            except Exception as e:
                errors.append(f"Erreur avec l'article {item_id}: {str(e)}")

        return Response(
            {
                "updated_items": updated_items,
                "errors": errors if errors else None,
                "message": f"{len(updated_items)} articles mis à jour",
            }
        )


# ORDER VIEWSET
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.user_type == "farmer":
            return (
                Order.objects.filter(items__product__farmer=user)
                .distinct()
                .order_by("-ordered_at")
            )

        return Order.objects.filter(buyer=user).order_by("-ordered_at")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Obtenir le panier de l'utilisateur
        cart, created = Cart.objects.get_or_create(user=request.user)

        if cart.items.count() == 0:
            return Response(
                {"error": "Votre panier est vide."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Calculer les frais
        subtotal = cart.subtotal
        shipping_fee = self._calculate_shipping_fee(serializer.validated_data)
        tax_amount = self._calculate_tax(subtotal)
        total_amount = subtotal + shipping_fee + tax_amount

        # Créer la commande
        order = Order.objects.create(
            buyer=request.user,
            shipping_address=serializer.validated_data["shipping_address"],
            shipping_city=serializer.validated_data["shipping_city"],
            shipping_country=serializer.validated_data["shipping_country"],
            shipping_phone=serializer.validated_data["shipping_phone"],
            notes=serializer.validated_data.get("notes", ""),
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status="pending",
        )

        # Créer les articles de commande et mettre à jour les quantités
        farmers_involved = set()

        for cart_item in cart.items.all():
            # Réserver la quantité du produit
            if not cart_item.product.reserve_quantity(cart_item.quantity):
                order.delete()
                return Response(
                    {"error": f"Quantité insuffisante pour {cart_item.product.name}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Créer l'article de commande
            order_item = OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                farmer=cart_item.product.farmer,
                quantity=cart_item.quantity,
                unit_price=cart_item.unit_price,
                total_price=cart_item.total_price,
            )
            farmers_involved.add(cart_item.product.farmer)

        # Vider le panier
        cart.items.all().delete()

        # Envoyer des notifications
        send_order_notification(
            order=order, notification_type="new_order", user=request.user
        )

        # Notifier les agriculteurs
        for farmer in farmers_involved:
            send_order_notification(
                order=order, notification_type="farmer_new_order", user=farmer
            )

        # Retourner la commande créée
        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def _calculate_shipping_fee(self, data):
        """Calculer les frais de livraison"""
        # Pour la démo: frais fixes
        return Decimal("10.00")

    def _calculate_tax(self, amount):
        """Calculer la TVA"""
        # 18% de TVA pour la Mauritanie
        return amount * Decimal("0.18")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Annuler une commande"""
        order = self.get_object()

        if order.status == "cancelled":
            return Response(
                {"error": "Cette commande est déjà annulée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == "delivered":
            return Response(
                {"error": "Impossible d'annuler une commande livrée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user == order.buyer or request.user.user_type == "admin":
            order.cancel()

            # Envoyer une notification
            send_order_notification(
                order=order, notification_type="order_cancelled", user=request.user
            )

            return Response({"message": "Commande annulée avec succès."})

        return Response(
            {"error": "Vous n'avez pas la permission d'annuler cette commande."},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        """Agriculteur accepte une commande"""
        order = self.get_object()

        if request.user.user_type != "farmer":
            return Response(
                {"error": "Seuls les agriculteurs peuvent accepter des commandes"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Vérifier si l'agriculteur a des articles dans cette commande
        farmer_items = order.items.filter(farmer=request.user)
        if not farmer_items.exists():
            return Response(
                {"error": "Aucun produit de votre ferme dans cette commande"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status not in ["pending", "confirmed"]:
            return Response(
                {"error": "Impossible d'accepter cette commande"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mettre à jour le statut de la commande
        order.status = "processing"
        order.confirmed_at = timezone.now()
        order.save()

        # Mettre à jour les articles de l'agriculteur
        farmer_items.update(item_status="confirmed")

        # Envoyer une notification à l'acheteur
        send_order_notification(
            order=order, notification_type="order_accepted", user=order.buyer
        )

        return Response(
            {"message": "Commande acceptée avec succès", "status": order.status}
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Agriculteur rejette une commande"""
        order = self.get_object()

        if request.user.user_type != "farmer":
            return Response(
                {"error": "Seuls les agriculteurs peuvent rejeter des commandes"},
                status=status.HTTP_403_FORBIDDEN,
            )

        farmer_items = order.items.filter(farmer=request.user)
        if not farmer_items.exists():
            return Response(
                {"error": "Aucun produit de votre ferme dans cette commande"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Libérer les quantités et mettre à jour le statut
        for item in farmer_items:
            item.product.release_quantity(item.quantity)
            item.item_status = "cancelled"
            item.save()

        # Vérifier si tous les agriculteurs ont rejeté
        all_rejected = not order.items.exclude(item_status="cancelled").exists()

        if all_rejected:
            order.status = "cancelled"
            order.rejection_reason = request.data.get("reason", "")
            order.cancelled_at = timezone.now()
            order.save()

        # Envoyer une notification
        send_order_notification(
            order=order, notification_type="order_rejected", user=order.buyer
        )

        return Response({"message": "Commande rejetée", "order_status": order.status})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_shipped(self, request, pk=None):
        """Agriculteur marque la commande comme expédiée"""
        order = self.get_object()

        if request.user.user_type != "farmer":
            return Response(
                {"error": "Seuls les agriculteurs peuvent marquer comme expédié"},
                status=status.HTTP_403_FORBIDDEN,
            )

        farmer_items = order.items.filter(farmer=request.user)
        if not farmer_items.exists():
            return Response(
                {"error": "Aucun produit de votre ferme dans cette commande"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tracking_number = request.data.get("tracking_number")
        delivery_company = request.data.get("delivery_company")

        # Mettre à jour les articles de l'agriculteur
        farmer_items.update(item_status="shipped")

        # Mettre à jour la commande si tous les articles sont expédiés
        all_shipped = not order.items.filter(
            ~Q(item_status="shipped") & ~Q(item_status="cancelled")
        ).exists()

        if all_shipped:
            order.status = "shipped"
            order.shipped_at = timezone.now()
            order.tracking_number = tracking_number
            order.delivery_company = delivery_company
            order.save()

        # Envoyer une notification
        send_order_notification(
            order=order, notification_type="order_shipped", user=order.buyer
        )

        return Response(
            {"message": "Commande marquée comme expédiée", "order_status": order.status}
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_delivered(self, request, pk=None):
        """Acheteur marque la commande comme livrée"""
        order = self.get_object()

        if request.user != order.buyer:
            return Response(
                {"error": "Seul l'acheteur peut marquer comme livré"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status != "shipped":
            return Response(
                {
                    "error": "La commande doit être expédiée avant d'être marquée comme livrée"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = "delivered"
        order.delivered_at = timezone.now()
        order.save()

        order.items.update(item_status="delivered")

        for item in order.items.all():
            item.farmer.total_sales += item.total_price
            item.farmer.save()

        farmers = set(item.farmer for item in order.items.all())
        for farmer in farmers:
            send_order_notification(
                order=order, notification_type="order_delivered", user=farmer
            )

        return Response(
            {"message": "Commande marquée comme livrée", "status": order.status}
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Statistiques des commandes pour l'utilisateur"""
        user = request.user

        if user.user_type == "farmer":
            orders = Order.objects.filter(items__product__farmer=user).distinct()
        else:
            orders = Order.objects.filter(buyer=user)

        stats = {
            "total_orders": orders.count(),
            "pending_orders": orders.filter(status="pending").count(),
            "confirmed_orders": orders.filter(status="confirmed").count(),
            "processing_orders": orders.filter(status="processing").count(),
            "shipped_orders": orders.filter(status="shipped").count(),
            "delivered_orders": orders.filter(status="delivered").count(),
            "cancelled_orders": orders.filter(status="cancelled").count(),
            "total_spent": orders.filter(status="delivered").aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0,
        }

        return Response(stats)


# FARMER ORDER VIEWSET
class FarmerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vue spécifique pour les agriculteurs pour gérer leurs commandes.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Retourner uniquement les commandes contenant des produits de l'agriculteur
        user = self.request.user

        # Acheteur -> ses commandes
        if user.user_type == "buyer":
            return Order.objects.filter(buyer=user).order_by("-ordered_at")

        # Agriculteur -> commandes qui contiennent SES produits
        if user.user_type == "farmer":
            return (
                Order.objects.filter(items__product__farmer=user)
                .distinct()
                .order_by("-ordered_at")
            )

        # Admin (optionnel)
        if user.is_staff:
            return Order.objects.all().order_by("-ordered_at")

        return Order.objects.none()

    @action(detail=False, methods=["get"])
    def farmer_stats(self, request):
        farmer = request.user

        orders = Order.objects.filter(items__product__farmer=farmer).distinct()

        # Produits actifs
        active_products = Product.objects.filter(farmer=farmer, status="active").count()

        # Avis sur les produits du fermier
        reviews = ProductReview.objects.filter(product__farmer=farmer)

        average_rating = reviews.aggregate(avg=Avg("rating"))["avg"] or 0

        stats = {
            "total_orders": orders.count(),
            "pending_orders": orders.filter(status="pending").count(),
            "confirmed_orders": orders.filter(status="confirmed").count(),
            "processing_orders": orders.filter(status="processing").count(),
            "shipped_orders": orders.filter(status="shipped").count(),
            "delivered_orders": orders.filter(status="delivered").count(),
            "total_revenue": orders.filter(status="delivered").aggregate(
                total=Sum("items__total_price")
            )["total"]
            or 0,
            # NOUVEAUX CHAMPS
            "average_rating": round(average_rating, 2),
            "active_products": active_products,
        }

        return Response(stats)

    def _get_monthly_revenue(self, farmer):
        """Obtenir les revenus mensuels de l'agriculteur"""
        from django.db.models.functions import TruncMonth

        monthly_stats = (
            OrderItem.objects.filter(
                farmer=farmer,
                item_status="delivered",
                created_at__year=timezone.now().year,
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Sum("total_price"))
            .order_by("month")
        )

        return list(monthly_stats)

    @action(detail=True, methods=["get"])
    def farmer_items(self, request, pk=None):
        """Obtenir uniquement les articles de l'agriculteur dans une commande"""
        order = self.get_object()
        farmer_items = order.items.filter(farmer=request.user)

        serializer = OrderItemSerializer(farmer_items, many=True)
        return Response(serializer.data)
