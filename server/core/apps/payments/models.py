from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone

class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        MOBILE_MONEY = 'mobile_money', _('Mobile Money')
        CREDIT_CARD = 'credit_card', _('Carte de crédit')
        BANK_TRANSFER = 'bank_transfer', _('Virement bancaire')
        CASH_ON_DELIVERY = 'cash_on_delivery', _('Paiement à la livraison')
    
    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('En attente')
        PROCESSING = 'processing', _('En traitement')
        COMPLETED = 'completed', _('Terminé')
        FAILED = 'failed', _('Échoué')
        REFUNDED = 'refunded', _('Remboursé')
        CANCELLED = 'cancelled', _('Annulé')
    
    payment_id = models.CharField(max_length=100, unique=True)
    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payment'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    # Payment details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='XOF')
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    
    # Provider details (mobile money, card, etc.)
    provider = models.CharField(max_length=50, blank=True)
    provider_transaction_id = models.CharField(max_length=100, blank=True)
    
    # Card details (if applicable, store only last 4 digits)
    card_last4 = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)
    
    # Mobile money details
    mobile_number = models.CharField(max_length=15, blank=True)
    mobile_provider = models.CharField(max_length=20, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = _('Paiement')
        verbose_name_plural = _('Paiements')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment_id']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order', 'status']),
        ]
    
    def __str__(self):
        return f"Paiement {self.payment_id}"
    
    def save(self, *args, **kwargs):
        if not self.payment_id:
            import uuid
            self.payment_id = f"PAY{str(uuid.uuid4())[:8].upper()}"
        
        super().save(*args, **kwargs)
    
    def mark_as_completed(self):
        self.status = self.PaymentStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save()
        
        # Update order payment status
        self.order.payment_status = 'paid'
        self.order.save()
    
    def mark_as_failed(self):
        self.status = self.PaymentStatus.FAILED
        self.failed_at = timezone.now()
        self.save()
        
        # Update order payment status
        self.order.payment_status = 'failed'
        self.order.save()

class Transaction(models.Model):
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=[
            ('payment', 'Paiement'),
            ('refund', 'Remboursement'),
            ('withdrawal', 'Retrait'),
        ]
    )
    status = models.CharField(
        max_length=20,
        choices=Payment.PaymentStatus.choices
    )
    
    # Provider response
    provider_response = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Transaction')
        verbose_name_plural = _('Transactions')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Transaction {self.transaction_id}"

class Payout(models.Model):
    class PayoutStatus(models.TextChoices):
        PENDING = 'pending', _('En attente')
        PROCESSING = 'processing', _('En traitement')
        COMPLETED = 'completed', _('Terminé')
        FAILED = 'failed', _('Échoué')
        CANCELLED = 'cancelled', _('Annulé')
    
    payout_id = models.CharField(max_length=100, unique=True)
    farmer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='payouts',
        limit_choices_to={'user_type': 'farmer'}
    )
    
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='XOF')
    
    # Payout method
    payout_method = models.CharField(
        max_length=20,
        choices=[
            ('bank_transfer', 'Virement bancaire'),
            ('mobile_money', 'Mobile Money'),
        ]
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING
    )
    
    # Bank details (if applicable)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_account_name = models.CharField(max_length=100, blank=True)
    
    # Mobile money details
    mobile_number = models.CharField(max_length=15, blank=True)
    mobile_provider = models.CharField(max_length=20, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Related payments
    payments = models.ManyToManyField(Payment, related_name='payouts')
    
    class Meta:
        verbose_name = _('Paiement vendeur')
        verbose_name_plural = _('Paiements vendeurs')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Paiement {self.payout_id} - {self.farmer.username}"
    
    def save(self, *args, **kwargs):
        if not self.payout_id:
            import uuid
            self.payout_id = f"PYT{str(uuid.uuid4())[:8].upper()}"
        
        super().save(*args, **kwargs)