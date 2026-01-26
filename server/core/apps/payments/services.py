import stripe
from django.conf import settings
from datetime import datetime
import random

class StripeTestService:
    """Service Stripe en mode test"""
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.test_mode = True
        
        # Cartes de test Stripe
        self.test_cards = {
            'success_visa': {
                'number': '4242424242424242',
                'exp_month': '12',
                'exp_year': '34',
                'cvc': '123',
                'description': 'Visa - Paiement réussi'
            },
            'decline_visa': {
                'number': '4000000000000002',
                'exp_month': '12',
                'exp_year': '34',
                'cvc': '123',
                'description': 'Visa - Refusé'
            },
            'success_mastercard': {
                'number': '5555555555554444',
                'exp_month': '12',
                'exp_year': '34',
                'cvc': '123',
                'description': 'MasterCard - Réussi'
            },
            'requires_3d_secure': {
                'number': '4000002760003184',
                'exp_month': '12',
                'exp_year': '34',
                'cvc': '123',
                'description': 'Visa - 3D Secure requis'
            }
        }
    
    def create_payment_intent(self, amount, currency='mru', metadata=None):
        """Créer une intention de paiement test"""
        try:
            # Convertir MRU en centimes (Stripe utilise les centimes)
            amount_in_cents = int(amount * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=currency,
                metadata=metadata or {},
                payment_method_types=['card'],
                description=f"Test payment - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            )
            
            return {
                'success': True,
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': amount,
                'currency': currency,
                'test_mode': True
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
                'test_mode': True
            }
    
    def simulate_mobile_money_payment(self, amount, phone_number, provider='mauritel'):
        """Simuler un paiement Mobile Money"""
        # Simulation pour tests
        transaction_id = f"MM_{random.randint(100000, 999999)}"
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'amount': amount,
            'phone_number': phone_number,
            'provider': provider,
            'status': 'pending',  # En attente de validation
            'simulated': True,
            'message': 'Paiement Mobile Money simulé. En attente de validation.'
        }
    
    def verify_mobile_money_payment(self, transaction_id, otp_code=None):
        """Vérifier un paiement Mobile Money simulé"""
        # Simulation - toujours réussie en mode test
        return {
            'success': True,
            'transaction_id': transaction_id,
            'status': 'completed',
            'verified_at': datetime.now().isoformat(),
            'simulated': True
        }
    
    def create_test_checkout_session(self, order_id, amount, success_url, cancel_url):
        """Créer une session de paiement test"""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'mru',
                        'product_data': {
                            'name': f'Commande #{order_id}',
                            'description': 'BetterAgri Mauritanie'
                        },
                        'unit_amount': int(amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'order_id': order_id,
                    'test_mode': True
                }
            )
            
            return {
                'success': True,
                'session_id': session.id,
                'url': session.url,
                'test_mode': True
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
                'test_mode': True
            }
    
    def get_test_cards(self):
        """Obtenir la liste des cartes de test"""
        return self.test_cards
    
    def process_cash_on_delivery(self, order_id, amount):
        """Traiter le paiement à la livraison"""
        return {
            'success': True,
            'payment_method': 'cash_on_delivery',
            'order_id': order_id,
            'amount': amount,
            'status': 'pending_payment',  # En attente de paiement
            'message': 'Paiement à la livraison configuré. Le paiement sera effectué à la réception.',
            'instructions': 'Préparer le montant exact en espèces pour le livreur.'
        }