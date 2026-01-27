import stripe
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum

from .models import Payment, Transaction, Payout
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentWebhookSerializer,
    PayoutSerializer,
    PayoutRequestSerializer,
)
from apps.orders.models import Order
from apps.notifications.utils import send_order_notification

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return PaymentCreateSerializer
        return PaymentSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.validated_data["order"]
        payment_method = serializer.validated_data["payment_method"]

        # Vérifier si la commande existe déjà un paiement
        if hasattr(order, "payment"):
            return Response(
                {"error": "Cette commande a déjà un paiement."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Créer l'enregistrement de paiement
        payment = Payment.objects.create(
            order=order,
            user=request.user,
            amount=order.total_amount,
            payment_method=payment_method,
            status="pending",
            mobile_number=serializer.validated_data.get("mobile_number", ""),
            mobile_provider=serializer.validated_data.get("mobile_provider", ""),
        )

        # Traiter le paiement selon la méthode
        if payment_method == "credit_card":
            return self._process_card_payment(payment, serializer.validated_data)
        elif payment_method == "mobile_money":
            return self._process_mobile_money_payment(payment)
        elif payment_method == "cash_on_delivery":
            # Paiement à la livraison - marquer comme accepté
            payment.status = "completed"
            payment.save()
            payment.mark_as_completed()

            return Response(
                {
                    "payment": PaymentSerializer(payment).data,
                    "redirect_url": f"{settings.FRONTEND_URL}/order/{order.id}/success?payment=cash",
                }
            )

        return Response(
            {"error": "Méthode de paiement non supportée."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _process_card_payment(self, payment, data):
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),
                currency="eur",
                payment_method="pm_card_visa",
                confirm=True,
                metadata={
                    "order_id": payment.order.id,
                    "payment_id": payment.payment_id,
                },
            )

            if intent.status == "succeeded":
                payment.provider = "stripe"
                payment.provider_transaction_id = intent.id
                payment.card_last4 = "4242"
                payment.card_brand = "visa"
                payment.mark_as_completed()

            Transaction.objects.create(
                payment=payment,
                transaction_id=intent.id,
                amount=payment.amount,
                transaction_type="payment",
                status="completed",
                provider_response=intent.to_dict(),
            )

            return Response(
                {
                    "payment": PaymentSerializer(payment).data,
                    "redirect_url": f"{settings.FRONTEND_URL}/order/{payment.order.id}/success",
                }
            )

            payment.mark_as_failed()
            return Response({"error": "Paiement échoué"}, status=400)

        except stripe.error.StripeError as e:
            payment.mark_as_failed()
            return Response({"error": "Erreur Stripe", "details": str(e)}, status=400)

    def _process_mobile_money_payment(self, payment):
        """Simuler paiement Mobile Money pour tests"""
        payment.provider = "mobile_money_simulator"
        payment.provider_transaction_id = f"MM_TEST_{payment.payment_id}"
        payment.status = "completed"
        payment.save()

        payment.mark_as_completed()

        Transaction.objects.create(
            payment=payment,
            transaction_id=payment.provider_transaction_id,
            amount=payment.amount,
            transaction_type="payment",
            status="completed",
            provider_response={"simulated": True, "test": True},
        )

        return Response(
            {
                "payment": PaymentSerializer(payment).data,
                "redirect_url": f"{settings.FRONTEND_URL}/order/{payment.order.id}/success?payment=mobile",
                "test_mode": True,
                "message": "Paiement Mobile Money simulé réussi!",
            }
        )

    def _get_test_card_token(self):
        """Get test card token for Stripe"""
        # Tokens test Stripe
        test_tokens = {
            "success": "tok_visa",  # Visa - succès
            "fail": "tok_chargeDeclined",  # Échec
            "3d_secure": "tok_threeDSecure2Required",  # 3D Secure
        }

        return test_tokens["success"]

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Verify payment (for mobile money simulation)"""
        payment = self.get_object()

        # Pour la simulation, marquer comme vérifié
        if payment.status == "pending":
            payment.mark_as_completed()

            return Response(
                {
                    "message": "Paiement vérifié et complété.",
                    "redirect_url": f"{settings.FRONTEND_URL}/order/{payment.order.id}/success",
                }
            )

        return Response({"message": f"Paiement déjà {payment.get_status_display()}"})

    @action(detail=False, methods=["get"])
    def test_cards(self, request):
        """List test cards for development"""
        test_cards = [
            {
                "number": "4242424242424242",
                "exp_month": "12",
                "exp_year": "34",
                "cvc": "123",
                "description": "Visa - Success",
            },
            {
                "number": "4000000000000002",
                "exp_month": "12",
                "exp_year": "34",
                "cvc": "123",
                "description": "Visa - Decline",
            },
            {
                "number": "5555555555554444",
                "exp_month": "12",
                "exp_year": "34",
                "cvc": "123",
                "description": "MasterCard - Success",
            },
        ]

        return Response(
            {
                "test_mode": True,
                "cards": test_cards,
                "note": "Utilisez ces cartes pour les tests de paiement",
            }
        )


class PaymentTestView(generics.GenericAPIView):
    """View pour tester les paiements sans frontend"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Créer un paiement test"""
        order_id = request.data.get("order_id")

        try:
            order = Order.objects.get(id=order_id, buyer=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Commande non trouvée"}, status=status.HTTP_404_NOT_FOUND
            )

        # Créer paiement test
        payment = Payment.objects.create(
            order=order,
            user=request.user,
            amount=order.total_amount,
            payment_method="credit_card",
            status="completed",
            provider="stripe_test",
            provider_transaction_id=f"TEST_{order.order_number}",
            card_last4="4242",
            card_brand="visa",
        )

        payment.mark_as_completed()

        return Response(
            {
                "success": True,
                "message": "Paiement test créé avec succès",
                "payment_id": payment.payment_id,
                "order_status": order.status,
                "payment_status": payment.status,
            }
        )


# PAYOUT VIEWSET
class PayoutViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les paiements aux agriculteurs.
    Seuls les agriculteurs peuvent demander et voir leurs paiements.
    """

    serializer_class = PayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Seuls les agriculteurs peuvent voir leurs paiements
        if self.request.user.user_type == "farmer":
            return Payout.objects.filter(farmer=self.request.user)
        # Les admins peuvent voir tous les paiements
        elif self.request.user.user_type == "admin":
            return Payout.objects.all()
        return Payout.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return PayoutRequestSerializer
        return PayoutSerializer

    def create(self, request, *args, **kwargs):
        """Créer une demande de paiement"""
        # Vérifier que l'utilisateur est un agriculteur
        if request.user.user_type != "farmer":
            return Response(
                {"error": "Seuls les agriculteurs peuvent demander des paiements"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Créer la demande de paiement
        payout = Payout.objects.create(
            farmer=request.user,
            amount=serializer.validated_data["amount"],
            payout_method=serializer.validated_data["payout_method"],
            bank_name=serializer.validated_data.get("bank_name", ""),
            bank_account_number=serializer.validated_data.get(
                "bank_account_number", ""
            ),
            bank_account_name=serializer.validated_data.get("bank_account_name", ""),
            mobile_number=serializer.validated_data.get("mobile_number", ""),
            mobile_provider=serializer.validated_data.get("mobile_provider", ""),
            status="pending",
        )

        # TODO: Initier le paiement réel via le fournisseur de paiement

        return Response(PayoutSerializer(payout).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def balance(self, request):
        """Obtenir le solde disponible de l'agriculteur"""
        if request.user.user_type != "farmer":
            return Response(
                {"error": "Seuls les agriculteurs peuvent voir leur solde"},
                status=status.HTTP_403_FORBIDDEN,
            )

        farmer = request.user
        total_sales = farmer.total_sales

        # Calculer les paiements en attente
        pending_payouts = (
            Payout.objects.filter(
                farmer=farmer, status__in=["pending", "processing"]
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        available_balance = total_sales - pending_payouts

        return Response(
            {
                "total_sales": float(total_sales),
                "pending_payouts": float(pending_payouts),
                "available_balance": float(available_balance),
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approuver un paiement (admin seulement)"""
        if request.user.user_type != "admin":
            return Response(
                {"error": "Seuls les administrateurs peuvent approuver les paiements"},
                status=status.HTTP_403_FORBIDDEN,
            )

        payout = self.get_object()

        if payout.status != "pending":
            return Response(
                {"error": f"Le paiement est déjà {payout.get_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payout.status = "processing"
        payout.save()

        # TODO: Initier le paiement réel

        return Response(
            {
                "message": "Paiement approuvé et en cours de traitement",
                "status": payout.status,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """Compléter un paiement (admin seulement)"""
        if request.user.user_type != "admin":
            return Response(
                {"error": "Seuls les administrateurs peuvent compléter les paiements"},
                status=status.HTTP_403_FORBIDDEN,
            )

        payout = self.get_object()

        if payout.status != "processing":
            return Response(
                {"error": "Le paiement doit être en cours de traitement"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payout.status = "completed"
        payout.completed_at = timezone.now()
        payout.save()

        return Response(
            {"message": "Paiement complété avec succès", "status": payout.status}
        )


class PaymentWebhookView(generics.GenericAPIView):
    """View pour recevoir les webhooks de paiement"""

    permission_classes = []  # Pas besoin d'authentification pour les webhooks

    def post(self, request):
        serializer = PaymentWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        payment_id = data["payment_id"]

        try:
            payment = Payment.objects.get(payment_id=payment_id)

            if data["status"] == "completed":
                payment.mark_as_completed()
            elif data["status"] == "failed":
                payment.mark_as_failed()

            # Créer un enregistrement de transaction
            Transaction.objects.create(
                payment=payment,
                transaction_id=data.get("transaction_id", payment_id),
                amount=payment.amount,
                transaction_type="payment",
                status=payment.status,
                provider_response=data.get("metadata", {}),
            )

            return Response({"status": "success"})

        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND
            )
