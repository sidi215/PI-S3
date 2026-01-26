from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count

from .models import FarmerReview
from .serializers import FarmerReviewSerializer, CreateFarmerReviewSerializer
from apps.orders.models import Order

class FarmerReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateFarmerReviewSerializer
        return FarmerReviewSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'farmer':
            # Un agriculteur voit les avis sur lui
            return FarmerReview.objects.filter(farmer=user).select_related('reviewer', 'order')
        else:
            # Un acheteur voit les avis qu'il a donnés
            return FarmerReview.objects.filter(reviewer=user).select_related('farmer', 'order')
    
    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
    
    @action(detail=False, methods=['get'])
    def farmer_stats(self, request):
        """Obtenir les statistiques d'un agriculteur"""
        farmer_id = request.query_params.get('farmer_id')
        
        if not farmer_id:
            return Response(
                {'error': 'farmer_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.accounts.models import User
        farmer = get_object_or_404(User, id=farmer_id, user_type='farmer')
        
        # Calculer les moyennes
        stats = FarmerReview.objects.filter(farmer=farmer).aggregate(
            avg_rating=Avg('rating'),
            avg_communication=Avg('communication_rating'),
            avg_quality=Avg('product_quality_rating'),
            avg_delivery=Avg('delivery_rating'),
            total_reviews=Count('id')
        )
        
        # Détails des avis
        rating_distribution = FarmerReview.objects.filter(farmer=farmer).values(
            'rating'
        ).annotate(count=Count('id')).order_by('rating')
        
        return Response({
            'farmer_id': farmer.id,
            'farmer_name': farmer.username,
            'stats': stats,
            'rating_distribution': list(rating_distribution),
            'verified_reviews': FarmerReview.objects.filter(farmer=farmer, is_verified=True).count()
        })
    
    @action(detail=False, methods=['get'], url_path='by-farmer/(?P<farmer_id>[^/.]+)')
    def by_farmer(self, request, farmer_id=None):
        """Obtenir tous les avis pour un agriculteur spécifique"""
        from apps.accounts.models import User
        farmer = get_object_or_404(User, id=farmer_id, user_type='farmer')
        
        reviews = FarmerReview.objects.filter(farmer=farmer).select_related('reviewer', 'order')
        serializer = self.get_serializer(reviews, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-order/(?P<order_id>[^/.]+)')
    def by_order(self, request, order_id=None):
        """Obtenir l'avis pour une commande spécifique"""
        order = get_object_or_404(Order, id=order_id)
        
        try:
            review = FarmerReview.objects.get(order=order)
            serializer = self.get_serializer(review)
            return Response(serializer.data)
        except FarmerReview.DoesNotExist:
            return Response(
                {'detail': 'No review for this order yet'},
                status=status.HTTP_404_NOT_FOUND
            )

class RecentReviewsView(generics.ListAPIView):
    """Avis récents pour la page d'accueil"""
    serializer_class = FarmerReviewSerializer
    permission_classes = []
    
    def get_queryset(self):
        return FarmerReview.objects.filter(
            is_verified=True
        ).select_related('farmer', 'reviewer').order_by('-created_at')[:10]