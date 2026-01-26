from rest_framework import serializers
from .models import Conversation, Message, Notification
from apps.accounts.serializers import UserSerializer


class MessageSummarySerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'content', 'created_at', 'sender']

    def get_sender(self, obj):
        return {
            'id': obj.sender.id,
            'username': obj.sender.username,
            'first_name': obj.sender.first_name,
            'last_name': obj.sender.last_name,
        }


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'order', 'product',
            'last_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return MessageSummarySerializer(last_message).data
        return None


class ConversationCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    
    class Meta:
        model = Conversation
        fields = ['id', 'participant_ids', 'order', 'product']
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        conversation = Conversation.objects.create(**validated_data)
        
        # Ajouter le créateur de la conversation
        request = self.context.get('request')
        if request and request.user:
            conversation.participants.add(request.user)
        
        # Ajouter les autres participants
        for participant_id in participant_ids:
            conversation.participants.add(participant_id)
        
        return conversation

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    conversation = serializers.PrimaryKeyRelatedField(read_only=True)
    conversation_id = serializers.PrimaryKeyRelatedField(
        queryset=Conversation.objects.all(),
        source='conversation',
        write_only=True
    )
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'conversation_id', 'sender',
            'content', 'message_type', 'media_url', 'file_name',
            'file_size', 'is_read', 'read_by', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'sender', 'is_read', 'read_by', 'created_at', 'updated_at'
        ]
    
    def validate_conversation_id(self, value):
        # Vérifier que l'utilisateur fait partie de la conversation
        request = self.context.get('request')
        if request and request.user not in value.participants.all():
            raise serializers.ValidationError(
                "Vous n'êtes pas autorisé à envoyer des messages dans cette conversation."
            )
        return value

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'related_model', 'related_id', 'is_read', 'data',
            'created_at'
        ]
        read_only_fields = ['user', 'created_at']

