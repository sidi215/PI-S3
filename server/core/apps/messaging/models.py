from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField

class Conversation(models.Model):
    participants = models.ManyToManyField(
        'accounts.User',
        related_name='conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    product = models.ForeignKey(
        'marketplace.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    
    class Meta:
        verbose_name = _('Conversation')
        verbose_name_plural = _('Conversations')
        ordering = ['-updated_at']
    
    def __str__(self):
        participant_names = ', '.join([u.username for u in self.participants.all()[:2]])
        return f"Conversation: {participant_names}"
    
    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()

class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    
    # Message type
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Texte'),
            ('image', 'Image'),
            ('file', 'Fichier'),
            ('order_update', 'Mise à jour commande'),
            ('product_share', 'Partage produit'),
        ],
        default='text'
    )
    
    # For media messages
    media_url = models.URLField(blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    
    # Read status
    is_read = models.BooleanField(default=False)
    read_by = ArrayField(
        models.IntegerField(),  # User IDs who read the message
        default=list,
        blank=True
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username}: {self.content[:50]}"
    
    def mark_as_read(self, user_id):
        if user_id not in self.read_by:
            self.read_by.append(user_id)
            self.is_read = True
            self.save(update_fields=['read_by', 'is_read'])

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        MESSAGE = 'message', _('Message')
        ORDER = 'order', _('Commande')
        PAYMENT = 'payment', _('Paiement')
        REVIEW = 'review', _('Avis')
        SYSTEM = 'system', _('Système')
        PROMOTION = 'promotion', _('Promotion')
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='messaging_notifications'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Related object
    related_id = models.CharField(max_length=100, blank=True)
    related_type = models.CharField(max_length=50, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save(update_fields=['is_read'])