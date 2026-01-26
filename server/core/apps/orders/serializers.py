from rest_framework import serializers
from django.utils import timezone
from decimal import Decimal

from .models import Order, OrderItem, Cart, CartItem
from apps.marketplace.models import Product  # Corrigé: apps.marketplace
from apps.marketplace.serializers import ProductSerializer
from apps.accounts.serializers import UserSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(status='active'),
        source='product',
        write_only=True
    )
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'cart', 'product', 'product_id', 'quantity',
            'unit_price', 'total_price', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'cart', 'unit_price', 'total_price',
            'created_at', 'updated_at'
        ]
    
    def validate_quantity(self, value):
        product_id = self.initial_data.get('product_id')

        if product_id:
            try:
                product_obj = Product.objects.get(id=product_id)
                if value > product_obj.available_quantity:
                    raise serializers.ValidationError(
                        f"Quantité disponible: {product_obj.available_quantity}"
                    )
            except Product.DoesNotExist:
                pass
        
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        cart = request.user.cart
        product = validated_data['product']
        quantity = validated_data.get('quantity', 1)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return cart_item


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_items', 'subtotal', 
                 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True, context={'request': None})
    farmer = UserSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'farmer', 'quantity',
                 'unit_price', 'total_price', 'item_status',
                 'created_at', 'updated_at']
        read_only_fields = ['order', 'farmer', 'unit_price', 'total_price',
                           'created_at', 'updated_at']

class OrderSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'shipping_address',
            'shipping_city', 'shipping_country', 'shipping_phone',
            'subtotal', 'shipping_fee', 'tax_amount', 'total_amount',
            'status', 'payment_status', 'ordered_at', 'confirmed_at',
            'shipped_at', 'delivered_at', 'cancelled_at', 'notes',
            'tracking_number', 'delivery_company', 'items'
        ]
        read_only_fields = [
            'order_number', 'buyer', 'subtotal', 'shipping_fee',
            'tax_amount', 'total_amount', 'ordered_at', 'confirmed_at',
            'shipped_at', 'delivered_at', 'cancelled_at', 'items'
        ]
    
    def validate_shipping_phone(self, value):
        if not value:
            raise serializers.ValidationError("Numéro de téléphone requis.")
        return value

class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(required=True, max_length=500)
    shipping_city = serializers.CharField(required=True, max_length=100)
    shipping_country = serializers.CharField(required=True, max_length=100)
    shipping_phone = serializers.CharField(required=True, max_length=17)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        request = self.context.get('request')
        
        try:
            cart = request.user.cart
            if not cart or cart.items.count() == 0:
                raise serializers.ValidationError("Votre panier est vide.")
        except Cart.DoesNotExist:
            raise serializers.ValidationError("Votre panier est vide.")
        
        for item in cart.items.all():
            if item.quantity > item.product.available_quantity:
                raise serializers.ValidationError(
                    f"Quantité insuffisante pour {item.product.name}. "
                    f"Disponible: {item.product.available_quantity}"
                )
        
        return attrs

class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.OrderStatus.choices)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    delivery_company = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        order = self.context.get('order')
        
        if not order:
            return value
        
        if order.status == 'cancelled' and value != 'cancelled':
            raise serializers.ValidationError("Une commande annulée ne peut pas être modifiée.")
        
        if order.status == 'delivered':
            raise serializers.ValidationError("Une commande livrée ne peut pas être modifiée.")
        
        return value