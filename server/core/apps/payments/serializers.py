from rest_framework import serializers
from .models import Payment, Transaction, Payout
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer


# =========================
# PAYMENT SERIALIZERS
# =========================

class PaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'payment_id',
            'order',
            'user',
            'amount',
            'currency',
            'payment_method',
            'status',
            'provider',
            'provider_transaction_id',
            'card_last4',
            'card_brand',
            'mobile_number',
            'mobile_provider',
            'created_at',
            'processed_at',
            'completed_at',
            'failed_at',
            'metadata',
        ]
        read_only_fields = [
            'id',
            'payment_id',
            'user',
            'amount',
            'currency',
            'status',
            'provider',
            'provider_transaction_id',
            'card_last4',
            'card_brand',
            'created_at',
            'processed_at',
            'completed_at',
            'failed_at',
            'metadata',
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """
    Serializer UNIQUEMENT pour la création de paiement
    (ne mappe PAS directement au modèle)
    """

    order = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all()
    )
    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices
    )

    # Mobile Money
    mobile_number = serializers.CharField(required=False, allow_blank=True)
    mobile_provider = serializers.CharField(required=False, allow_blank=True)

    # Stripe / Carte bancaire
    card_token = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        method = attrs.get('payment_method')

        if method == 'credit_card':
            if not attrs.get('card_token'):
                raise serializers.ValidationError({
                    'card_token': 'Token Stripe requis pour le paiement par carte.'
                })

        elif method == 'mobile_money':
            if not attrs.get('mobile_number') or not attrs.get('mobile_provider'):
                raise serializers.ValidationError({
                    'mobile_money': 'Numéro et opérateur Mobile Money requis.'
                })

        elif method == 'cash_on_delivery':
            # Nettoyage explicite
            attrs.pop('card_token', None)
            attrs.pop('mobile_number', None)
            attrs.pop('mobile_provider', None)

        return attrs


# =========================
# WEBHOOK
# =========================

class PaymentWebhookSerializer(serializers.Serializer):
    payment_id = serializers.CharField(required=True)
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=Payment.PaymentStatus.choices
    )
    metadata = serializers.JSONField(required=False, default=dict)


# =========================
# PAYOUT SERIALIZERS
# =========================

class PayoutSerializer(serializers.ModelSerializer):
    farmer = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Payout
        fields = [
            'id',
            'payout_id',
            'farmer',
            'amount',
            'currency',
            'payout_method',
            'status',
            'bank_name',
            'bank_account_number',
            'bank_account_name',
            'mobile_number',
            'mobile_provider',
            'created_at',
            'processed_at',
            'completed_at',
        ]
        read_only_fields = [
            'id',
            'payout_id',
            'farmer',
            'status',
            'created_at',
            'processed_at',
            'completed_at',
        ]


class PayoutRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0.01
    )
    payout_method = serializers.ChoiceField(
        choices=[
            ('bank_transfer', 'Virement bancaire'),
            ('mobile_money', 'Mobile Money'),
        ]
    )

    # Bank transfer
    bank_name = serializers.CharField(required=False, allow_blank=True)
    bank_account_number = serializers.CharField(required=False, allow_blank=True)
    bank_account_name = serializers.CharField(required=False, allow_blank=True)

    # Mobile money
    mobile_number = serializers.CharField(required=False, allow_blank=True)
    mobile_provider = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get('request')
        farmer = request.user
        amount = attrs.get('amount')

        if amount > farmer.total_sales:
            raise serializers.ValidationError({
                'amount': f'Solde insuffisant. Disponible: {farmer.total_sales}'
            })

        if attrs['payout_method'] == 'bank_transfer':
            if not all([
                attrs.get('bank_name'),
                attrs.get('bank_account_number'),
                attrs.get('bank_account_name'),
            ]):
                raise serializers.ValidationError({
                    'bank_transfer': 'Informations bancaires complètes requises.'
                })

        if attrs['payout_method'] == 'mobile_money':
            if not all([
                attrs.get('mobile_number'),
                attrs.get('mobile_provider'),
            ]):
                raise serializers.ValidationError({
                    'mobile_money': 'Informations Mobile Money requises.'
                })

        return attrs
