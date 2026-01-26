from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import datetime
import requests
import json

from .models import Notification, NotificationPreference

class NotificationService:
    def __init__(self):
        self.email_backend = self._get_email_backend()
        self.push_service = self._get_push_service()
    
    def send_notification(self, user, notification_type, title, message, 
                         related_model=None, related_id=None, data=None):
        """Send notification through appropriate channels"""
        
        # Get user preferences
        try:
            preferences = user.notification_preferences
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=user)
        
        # Determine channels
        channels = []
        
        if notification_type == 'welcome':
            channels = ['email']
        elif notification_type.startswith('order_'):
            if preferences.email_order_updates:
                channels.append('email')
            if preferences.push_order_updates:
                channels.append('push')
        elif notification_type == 'new_message':
            if preferences.push_new_message:
                channels.append('push')
        elif notification_type == 'weather_alert':
            if preferences.push_weather_alerts:
                channels.append('push')
                channels.append('in_app')
        else:
            channels = ['in_app']
        
        # Create notification record
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            channels=channels,
            related_model=related_model,
            related_id=related_id,
            data=data or {},
            is_sent=False
        )
        
        # Send through channels
        for channel in channels:
            if channel == 'email':
                self._send_email(user, notification)
            elif channel == 'push':
                self._send_push(user, notification)
            elif channel == 'in_app':
                # In-app notifications are automatically available
                pass
        
        notification.mark_as_sent()
        return notification
    
    def _send_email(self, user, notification):
        """Send email notification"""
        try:
            send_mail(
                subject=notification.title,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=self._create_html_email(notification),
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def _send_push(self, user, notification):
        """Send push notification"""
        # Integrate with Firebase Cloud Messaging or similar
        # This is a placeholder implementation
        
        if not hasattr(user, 'device_tokens'):
            return False
        
        device_tokens = user.device_tokens.all()
        if not device_tokens:
            return False
        
        try:
            # Firebase Cloud Messaging
            fcm_url = 'https://fcm.googleapis.com/fcm/send'
            headers = {
                'Authorization': f'key={settings.FCM_SERVER_KEY}',
                'Content-Type': 'application/json'
            }
            
            for device in device_tokens:
                payload = {
                    'to': device.token,
                    'notification': {
                        'title': notification.title,
                        'body': notification.message,
                        'sound': 'default'
                    },
                    'data': {
                        'notification_id': str(notification.id),
                        'type': notification.notification_type,
                        'related_model': notification.related_model,
                        'related_id': notification.related_id,
                        'click_action': 'FLUTTER_NOTIFICATION_CLICK'
                    }
                }
                
                response = requests.post(fcm_url, headers=headers, data=json.dumps(payload))
                
                if response.status_code != 200:
                    print(f"FCM error: {response.text}")
            
            return True
            
        except Exception as e:
            print(f"Failed to send push: {e}")
            return False
    
    def _create_html_email(self, notification):
        """Create HTML email template"""
        template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{notification.title}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background-color: #f9f9f9; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .button {{ background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BetterAgri</h1>
                </div>
                <div class="content">
                    <h2>{notification.title}</h2>
                    <p>{notification.message}</p>
                    
                    {self._get_email_action(notification)}
                    
                    <p>Cordialement,<br>L'équipe BetterAgri</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} BetterAgri. Tous droits réservés.</p>
                    <p><a href="{settings.FRONTEND_URL}/preferences">Gérer mes préférences de notification</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        return template
    
    def _get_email_action(self, notification):
        """Get action button for email based on notification type"""
        actions = {
            'new_order': f'<p><a href="{settings.FRONTEND_URL}/orders/{notification.related_id}" class="button">Voir la commande</a></p>',
            'order_accepted': f'<p><a href="{settings.FRONTEND_URL}/orders/{notification.related_id}" class="button">Suivre la commande</a></p>',
            'order_shipped': f'<p><a href="{settings.FRONTEND_URL}/orders/{notification.related_id}" class="button">Suivre la livraison</a></p>',
            'new_message': f'<p><a href="{settings.FRONTEND_URL}/messages" class="button">Voir les messages</a></p>',
            'weather_alert': f'<p><a href="{settings.FRONTEND_URL}/weather" class="button">Voir les prévisions</a></p>',
        }
        return actions.get(notification.notification_type, '')
    
    def _get_email_backend(self):
        """Get email backend based on settings"""
        return settings.EMAIL_BACKEND
    
    def _get_push_service(self):
        """Get push notification service"""
        # Return configured push service
        return None

# Helper functions
notification_service = NotificationService()

def send_welcome_email(user):
    """Send welcome email to new user"""
    notification_service.send_notification(
        user=user,
        notification_type='welcome',
        title='Bienvenue sur BetterAgri !',
        message=f"""
        Bonjour {user.first_name},
        
        Merci de vous être inscrit sur BetterAgri, la plateforme qui connecte 
        directement les agriculteurs et les acheteurs.
        
        Votre compte a été créé avec succès. Vous pouvez maintenant :
        
        1. Parcourir les produits frais des agriculteurs locaux
        2. Passer des commandes en toute sécurité
        3. Communiquer directement avec les agriculteurs
        4. Recevoir des alertes météo personnalisées
        
        Pour commencer, explorez notre marché : {settings.FRONTEND_URL}/marketplace
        
        Si vous avez des questions, n'hésitez pas à nous contacter.
        
        Cordialement,
        L'équipe BetterAgri
        """,
        related_model='user',
        related_id=str(user.id)
    )

def send_order_notification(order, notification_type, user):
    """Send order-related notification"""
    messages = {
        'new_order': {
            'title': 'Nouvelle commande reçue !',
            'message': f'Vous avez reçu une nouvelle commande #{order.order_number}.'
        },
        'order_accepted': {
            'title': 'Commande acceptée',
            'message': f'Votre commande #{order.order_number} a été acceptée par l\'agriculteur.'
        },
        'order_shipped': {
            'title': 'Commande expédiée',
            'message': f'Votre commande #{order.order_number} a été expédiée.'
        },
        'order_delivered': {
            'title': 'Commande livrée',
            'message': f'Votre commande #{order.order_number} a été livrée.'
        },
        'order_cancelled': {
            'title': 'Commande annulée',
            'message': f'La commande #{order.order_number} a été annulée.'
        }
    }
    
    if notification_type in messages:
        notification_service.send_notification(
            user=user,
            notification_type=notification_type,
            title=messages[notification_type]['title'],
            message=messages[notification_type]['message'],
            related_model='order',
            related_id=str(order.id),
            data={'order_number': order.order_number}
        )

def send_product_notification(product, notification_type, user):
    """Send product-related notification"""
    if notification_type == 'new_product':
        notification_service.send_notification(
            user=user,  # Admin user
            notification_type='new_product',
            title='Nouveau produit ajouté',
            message=f'Un nouveau produit "{product.name}" a été ajouté par {user.username}.',
            related_model='product',
            related_id=str(product.id)
        )
    elif notification_type == 'low_stock':
        notification_service.send_notification(
            user=user,
            notification_type='low_stock',
            title='Stock faible',
            message=f'Le stock de "{product.name}" est faible ({product.available_quantity} {product.unit}).',
            related_model='product',
            related_id=str(product.id)
        )

def send_message_notification(sender, receiver, message):
    """Send message notification"""
    notification_service.send_notification(
        user=receiver,
        notification_type='new_message',
        title='Nouveau message',
        message=f'Vous avez reçu un nouveau message de {sender.username}.',
        related_model='message',
        related_id=str(message.id),
        data={'sender_id': sender.id, 'sender_name': sender.username}
    )

def send_test_notification(user, notification_type='test', title='Test', message='Notification de test'):
    """Envoyer une notification de test"""
    from .models import Notification
    
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        channels=['in_app'],
        related_model='test',
        related_id=str(user.id),
        data={'test': True}
    )
    
    return notification