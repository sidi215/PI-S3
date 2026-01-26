from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.urls import reverse

def send_verification_email(user):
    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verification_token = f"{uid}.{token}"
    
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
    
    subject = 'Vérifiez votre email - BetterAgri'
    message = f'''
    Bonjour {user.first_name},
    
    Merci de vous être inscrit sur BetterAgri. 
    Veuillez cliquer sur le lien suivant pour vérifier votre email:
    
    {verification_url}
    
    Si vous n'avez pas créé de compte, ignorez cet email.
    
    Cordialement,
    L'équipe BetterAgri
    '''
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def send_password_reset_email(user):
    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_token = f"{uid}.{token}"
    
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
    
    subject = 'Réinitialisation de mot de passe - BetterAgri'
    message = f'''
    Bonjour {user.first_name},
    
    Vous avez demandé la réinitialisation de votre mot de passe.
    Cliquez sur le lien suivant pour créer un nouveau mot de passe:
    
    {reset_url}
    
    Ce lien expirera dans 24 heures.
    
    Si vous n'avez pas fait cette demande, ignorez cet email.
    
    Cordialement,
    L'équipe BetterAgri
    '''
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )