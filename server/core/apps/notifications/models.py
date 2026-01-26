from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        WELCOME = 'welcome', _('Bienvenue')
        NEW_ORDER = 'new_order', _('Nouvelle commande')
        ORDER_ACCEPTED = 'order_accepted', _('Commande acceptée')
        ORDER_SHIPPED = 'order_shipped', _('Commande expédiée')
        ORDER_DELIVERED = 'order_delivered', _('Commande livrée')
        ORDER_CANCELLED = 'order_cancelled', _('Commande annulée')
        NEW_MESSAGE = 'new_message', _('Nouveau message')
        WEATHER_ALERT = 'weather_alert', _('Alerte météo')
        LOW_STOCK = 'low_stock', _('Stock faible')
        NEW_REVIEW = 'new_review', _('Nouvel avis')
        PAYMENT_RECEIVED = 'payment_received', _('Paiement reçu')
        PAYOUT_SENT = 'payout_sent', _('Paiement envoyé')
        SYSTEM = 'system', _('Système')
    
    class NotificationChannel(models.TextChoices):
        EMAIL = 'email', _('Email')
        PUSH = 'push', _('Notification push')
        IN_APP = 'in_app', _('Dans l\'application')
        SMS = 'sms', _('SMS')
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='app_notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Channels
    channels = ArrayField(
        models.CharField(max_length=20, choices=NotificationChannel.choices),
        default=list
    )
    
    # Related object
    related_model = models.CharField(max_length=50, blank=True)
    related_id = models.CharField(max_length=100, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    send_attempts = models.IntegerField(default=0)
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_sent(self):
        self.is_sent = True
        self.sent_at = timezone.now()
        self.save(update_fields=['is_sent', 'sent_at'])

class NotificationPreference(models.Model):
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Email notifications
    email_new_order = models.BooleanField(default=True)
    email_order_updates = models.BooleanField(default=True)
    email_payment = models.BooleanField(default=True)
    email_marketing = models.BooleanField(default=False)
    
    # Push notifications
    push_new_message = models.BooleanField(default=True)
    push_order_updates = models.BooleanField(default=True)
    push_weather_alerts = models.BooleanField(default=True)
    push_system = models.BooleanField(default=True)
    
    # In-app notifications
    in_app_all = models.BooleanField(default=True)
    
    # SMS notifications
    sms_urgent = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Préférence de notification')
        verbose_name_plural = _('Préférences de notification')
    
    def __str__(self):
        return f"Préférences de {self.user.username}"

class PushSubscription(models.Model):
    """Modèle pour les abonnements aux notifications push"""
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='push_subscriptions'
    )
    endpoint = models.TextField(unique=True)
    subscription_info = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Abonnement push'
        verbose_name_plural = 'Abonnements push'
    
    def __str__(self):
        return f"Push subscription for {self.user.username}"