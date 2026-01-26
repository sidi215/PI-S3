# apps/analytics/views.py - Version simplifiée
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Avg
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from datetime import datetime, timedelta
import json

from .models import FarmerAnalytics
from apps.accounts.models import User
from .serializers import FarmerAnalyticsSerializer

class FarmerAnalyticsViewSet(viewsets.ViewSet):
    """Vues pour les analytics des agriculteurs (version simplifiée)"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Obtenir les analytics de l'agriculteur connecté"""
        if request.user.user_type != 'farmer':
            return Response(
                {'error': 'Only farmers can view analytics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer ou créer les analytics
        analytics, created = FarmerAnalytics.objects.get_or_create(farmer=request.user)
        
        # Si c'est nouvellement créé, initialiser avec des valeurs par défaut
        if created:
            analytics.total_sales = 0
            analytics.total_orders = 0
            analytics.average_order_value = 0
            analytics.total_customers = 0
            analytics.repeat_customer_rate = 0
            analytics.total_products = 0
            analytics.active_products = 0
            analytics.average_rating = 0
            analytics.total_reviews = 0
            analytics.save()
        
        serializer = FarmerAnalyticsSerializer(analytics)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_stats(self, request):
        """Mettre à jour manuellement les statistiques"""
        if request.user.user_type != 'farmer':
            return Response(
                {'error': 'Only farmers can update analytics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        analytics, _ = FarmerAnalytics.objects.get_or_create(farmer=request.user)
        
        # Mettre à jour avec les données fournies
        data = request.data
        if 'total_sales' in data:
            analytics.total_sales = data['total_sales']
        if 'total_orders' in data:
            analytics.total_orders = data['total_orders']
        if 'total_customers' in data:
            analytics.total_customers = data['total_customers']
        if 'total_products' in data:
            analytics.total_products = data['total_products']
        if 'active_products' in data:
            analytics.active_products = data['active_products']
        
        # Recalculer la valeur moyenne des commandes
        if analytics.total_orders > 0:
            analytics.average_order_value = analytics.total_sales / analytics.total_orders
        
        analytics.save()
        
        return Response({
            'message': 'Statistics updated successfully',
            'analytics': FarmerAnalyticsSerializer(analytics).data
        })

class DashboardViewSet(viewsets.ViewSet):
    """Vues pour le tableau de bord (version simplifiée)"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Tableau de bord personnalisé selon le type d'utilisateur"""
        user = request.user
        
        if user.user_type == 'farmer':
            return self.farmer_dashboard(user)
        elif user.user_type == 'buyer':
            return self.buyer_dashboard(user)
        else:  # admin
            return self.admin_dashboard(user)
    
    def farmer_dashboard(self, farmer):
        """Tableau de bord agriculteur simplifié"""
        analytics, _ = FarmerAnalytics.objects.get_or_create(farmer=farmer)
        
        return Response({
            'user_type': 'farmer',
            'welcome_message': f'Bienvenue, {farmer.username}!',
            'stats': {
                'total_sales': float(analytics.total_sales),
                'total_orders': analytics.total_orders,
                'total_customers': analytics.total_customers,
                'average_rating': float(analytics.average_rating),
                'active_products': analytics.active_products
            },
            'quick_actions': [
                {'action': 'add_product', 'label': 'Ajouter un produit', 'icon': 'add'},
                {'action': 'view_orders', 'label': 'Voir les commandes', 'icon': 'list'},
                {'action': 'update_profile', 'label': 'Mettre à jour le profil', 'icon': 'edit'}
            ]
        })
    
    def buyer_dashboard(self, buyer):
        """Tableau de bord acheteur simplifié"""
        return Response({
            'user_type': 'buyer',
            'welcome_message': f'Bienvenue, {buyer.username}!',
            'stats': {
                'total_orders': 0,  # À remplacer par vos données
                'pending_orders': 0,
                'completed_orders': 0
            },
            'quick_actions': [
                {'action': 'browse_products', 'label': 'Parcourir les produits', 'icon': 'search'},
                {'action': 'view_orders', 'label': 'Mes commandes', 'icon': 'list'},
                {'action': 'view_farmers', 'label': 'Agriculteurs', 'icon': 'people'}
            ]
        })
    
    def admin_dashboard(self, admin):
        """Tableau de bord administrateur simplifié"""
        total_users = User.objects.count()
        total_farmers = User.objects.filter(user_type='farmer').count()
        total_buyers = User.objects.filter(user_type='buyer').count()
        
        return Response({
            'user_type': 'admin',
            'welcome_message': f'Bienvenue administrateur {admin.username}!',
            'stats': {
                'total_users': total_users,
                'total_farmers': total_farmers,
                'total_buyers': total_buyers,
                'total_analytics': FarmerAnalytics.objects.count()
            },
            'quick_actions': [
                {'action': 'manage_users', 'label': 'Gérer les utilisateurs', 'icon': 'people'},
                {'action': 'view_analytics', 'label': 'Voir les statistiques', 'icon': 'analytics'},
                {'action': 'system_settings', 'label': 'Paramètres système', 'icon': 'settings'}
            ]
        })

class AdminAnalyticsViewSet(viewsets.ViewSet):
    """Vues pour les analytics administrateur (version simplifiée)"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Analytics globales pour l'admin"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Statistiques de base
        total_users = User.objects.count()
        total_farmers = User.objects.filter(user_type='farmer').count()
        total_buyers = User.objects.filter(user_type='buyer').count()
        
        # Données des analytics
        total_analytics = FarmerAnalytics.objects.count()
        total_sales = FarmerAnalytics.objects.aggregate(
            total=Sum('total_sales')
        )['total'] or 0
        
        # Meilleurs agriculteurs par ventes
        top_farmers = FarmerAnalytics.objects.order_by('-total_sales')[:5]
        
        return Response({
            'period': 'all_time',
            'stats': {
                'total_users': total_users,
                'total_farmers': total_farmers,
                'total_buyers': total_buyers,
                'total_analytics': total_analytics,
                'total_sales': float(total_sales)
            },
            'top_farmers': [
                {
                    'farmer_id': analytics.farmer.id,
                    'farmer_name': analytics.farmer.username,
                    'total_sales': float(analytics.total_sales),
                    'total_orders': analytics.total_orders,
                    'total_customers': analytics.total_customers
                }
                for analytics in top_farmers
            ]
        })

# Vues utilitaires
def update_farmer_analytics(request, farmer_id):
    """Mettre à jour manuellement les analytics d'un agriculteur"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin access required'}, status=403)
    
    farmer = get_object_or_404(User, id=farmer_id, user_type='farmer')
    analytics, created = FarmerAnalytics.objects.get_or_create(farmer=farmer)
    
    return JsonResponse({
        'message': f'Analytics loaded for {farmer.username}',
        'analytics': {
            'id': analytics.id,
            'farmer_id': farmer.id,
            'total_sales': float(analytics.total_sales),
            'total_orders': analytics.total_orders,
            'created': created
        }
    })

def update_all_analytics(request):
    """Mettre à jour les analytics de tous les agriculteurs"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin access required'}, status=403)
    
    farmers = User.objects.filter(user_type='farmer')
    
    results = []
    for farmer in farmers:
        analytics, created = FarmerAnalytics.objects.get_or_create(farmer=farmer)
        results.append({
            'farmer_id': farmer.id,
            'farmer_name': farmer.username,
            'analytics_id': analytics.id,
            'created': created
        })
    
    return JsonResponse({
        'message': f'Loaded analytics for {len(results)} farmers',
        'results': results
    })