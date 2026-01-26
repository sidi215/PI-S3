from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'pending', _('En attente')
        CONFIRMED = 'confirmed', _('Confirmé')
        PROCESSING = 'processing', _('En traitement')
        SHIPPED = 'shipped', _('Expédié')
        DELIVERED = 'delivered', _('Livré')
        CANCELLED = 'cancelled', _('Annulé')
        RETURNED = 'returned', _('Retourné')
    
    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('En attente')
        PAID = 'paid', _('Payé')
        FAILED = 'failed', _('Échoué')
        REFUNDED = 'refunded', _('Remboursé')
    
    order_number = models.CharField(max_length=20, unique=True)
    buyer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='orders',
        limit_choices_to={'user_type': 'buyer'}
    )
    
    # Shipping information
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100)
    shipping_phone = models.CharField(max_length=17)
    
    # Order details
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    shipping_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )
    tax_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    
    # Timestamps
    ordered_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    notes = models.TextField(blank=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    delivery_company = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        verbose_name = _('Commande')
        verbose_name_plural = _('Commandes')
        ordering = ['-ordered_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['order_number']),
            models.Index(fields=['status', 'payment_status']),
        ]
    
    def __str__(self):
        return f"Commande {self.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number
            import random
            import string
            prefix = 'ORD'
            date_str = timezone.now().strftime('%Y%m%d')
            random_str = ''.join(random.choices(string.digits, k=6))
            self.order_number = f"{prefix}{date_str}{random_str}"
        
        # Calculate total if not set
        if not self.total_amount:
            self.total_amount = self.subtotal + self.shipping_fee + self.tax_amount
        
        super().save(*args, **kwargs)
    
    def cancel(self):
        if self.status not in ['delivered', 'cancelled']:
            self.status = 'cancelled'
            self.cancelled_at = timezone.now()
            self.save()
            
            # Release product quantities
            for item in self.items.all():
                item.product.release_quantity(item.quantity)
    
    def mark_as_delivered(self):
        if self.status == 'shipped':
            self.status = 'delivered'
            self.delivered_at = timezone.now()
            self.save()

class OrderItemStatus(models.TextChoices):
    PENDING = 'pending', 'En attente'
    CONFIRMED = 'confirmed', 'Accepté'
    CANCELLED = 'cancelled', 'Refusé'
    SHIPPED = 'shipped', 'Expédié'
    DELIVERED = 'delivered', 'Livré'

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'marketplace.Product',
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    farmer = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Status tracking per item
    item_status = models.CharField(
        max_length=20,
        choices=OrderItemStatus.choices,
        default=OrderItemStatus.PENDING
    )

    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Article de commande')
        verbose_name_plural = _('Articles de commande')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Calculate total price
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        
        # Set farmer from product
        if not self.farmer_id:
            self.farmer = self.product.farmer
        
        super().save(*args, **kwargs)


class Cart(models.Model):
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Panier')
        verbose_name_plural = _('Paniers')
    
    def __str__(self):
        return f"Panier de {self.user.username}"
    
    @property
    def total_items(self):
        return self.items.count()
    
    @property
    def subtotal(self):
        return sum(
        (item.total_price for item in self.items.all()),
        Decimal('0.00')
    )

class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'marketplace.Product',
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        default=1
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Article de panier')
        verbose_name_plural = _('Articles de panier')
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Get current price from product
        if not self.unit_price:
            self.unit_price = self.product.price_per_unit
        
        # Calculate total price
        self.total_price = self.quantity * self.unit_price
        
        super().save(*args, **kwargs)