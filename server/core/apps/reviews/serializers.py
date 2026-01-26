from rest_framework import serializers
from .models import FarmerReview
from apps.accounts.serializers import UserSerializer

class FarmerReviewSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)
    reviewer = UserSerializer(read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = FarmerReview
        fields = [
            'id', 'farmer', 'reviewer', 'order', 'order_number',
            'rating', 'comment', 'communication_rating',
            'product_quality_rating', 'delivery_rating',
            'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'reviewer', 'is_verified', 'created_at', 'updated_at']

class CreateFarmerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerReview
        fields = [
            'farmer', 'order', 'rating', 'comment',
            'communication_rating', 'product_quality_rating',
            'delivery_rating'
        ]
    
    def validate(self, data):
        # Vérifier que le reviewer est un acheteur
        if self.context['request'].user.user_type != 'buyer':
            raise serializers.ValidationError(
                "Only buyers can submit reviews"
            )
        
        # Vérifier que le farmer est bien un agriculteur
        if data['farmer'].user_type != 'farmer':
            raise serializers.ValidationError(
                "You can only review farmers"
            )
        
        # Vérifier que la commande appartient au reviewer
        order = data['order']
        if order.buyer != self.context['request'].user:
            raise serializers.ValidationError(
                "You can only review orders you placed"
            )
        
        # Vérifier que la commande est livrée
        if order.status != 'delivered':
            raise serializers.ValidationError(
                "You can only review delivered orders"
            )
        
        # Vérifier qu'il n'y a pas déjà un avis pour cette commande
        if FarmerReview.objects.filter(
            farmer=data['farmer'],
            reviewer=self.context['request'].user,
            order=order
        ).exists():
            raise serializers.ValidationError(
                "You have already reviewed this order"
            )
        
        return data
    
    def create(self, validated_data):
        # Ajouter automatiquement le reviewer
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)