from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.db.models import Q

from .models import Conversation, Message, Notification
from .serializers import (
    ConversationSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
    NotificationSerializer,
)
from apps.accounts.models import User
from apps.notifications.utils import send_message_notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync



# =====================================================
# CONVERSATIONS
# =====================================================
class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Conversation.objects.filter(participants=self.request.user)

        role = self.request.query_params.get("role")

        if role == "farmer":
            qs = qs.filter(participants__user_type="buyer")

        elif role == "buyer":
            qs = qs.filter(participants__user_type="farmer")

        return qs.distinct().order_by("-updated_at")

    def get_serializer_class(self):
        if self.action == "create":
            return ConversationCreateSerializer
        return ConversationSerializer

    def create(self, request, *args, **kwargs):
        """
        🔒 ÉVITER LES CONVERSATIONS EN DOUBLE
        - 1 farmer ↔ 1 buyer = 1 conversation unique
        """
        participant_ids = request.data.get("participant_ids", [])

        if not participant_ids or len(participant_ids) != 1:
            return Response(
                {"error": "Une conversation doit avoir exactement un autre participant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        other_user_id = participant_ids[0]

        # Chercher une conversation existante
        existing_conversation = (
            Conversation.objects
            .filter(participants=request.user)
            .filter(participants__id=other_user_id)
            .distinct()
            .first()
        )

        if existing_conversation:
            serializer = ConversationSerializer(existing_conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Sinon → créer une nouvelle conversation
        serializer = ConversationCreateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()

        # Ajouter les participants
        conversation.participants.add(request.user)
        try:
            other_user = User.objects.get(id=other_user_id)
            conversation.participants.add(other_user)
        except User.DoesNotExist:
            pass

        response_serializer = ConversationSerializer(conversation)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        conversation = self.get_object()

        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {"error": "Accès non autorisé à cette conversation"},
                status=status.HTTP_403_FORBIDDEN,
            )

        messages = conversation.messages.all().order_by("created_at")

        # Marquer comme lus
        messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


# =====================================================
# MESSAGES
# =====================================================
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = MessageSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save(sender=request.user)

        conversation = message.conversation


        channel_layer = get_channel_layer()

        message_payload = {
            "id": message.id,
            "conversation": conversation.id,
            "sender": {
                "id": message.sender.id,
                "username": message.sender.username,
                "first_name": message.sender.first_name,
                "last_name": message.sender.last_name,
            },
            "content": message.content,
            "message_type": message.message_type,
            "created_at": message.created_at.isoformat(),
            "metadata": message.metadata,
            "is_read": False,
        }

        for participant in conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    "type": "chat_message",
                    "message": message_payload,
                }
            )


        for participant in conversation.participants.all():
            if participant != request.user:
                send_message_notification(
                    sender=request.user,
                    receiver=participant,
                    message=message,
                )

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        message.mark_as_read(request.user.id)
        return Response({"message": "Message marqué comme lu"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False,
        ).exclude(sender=request.user).count()

        return Response({"unread_count": count})


# =====================================================
# NOTIFICATIONS
# =====================================================
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({"message": "Notification marquée comme lue"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        qs = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        count = qs.count()
        qs.update(is_read=True)
        return Response({"message": f"{count} notifications marquées comme lues"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({"unread_count": count})
