from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def notify_new_message(receiver_id, sender_name):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"user_{receiver_id}",
        {
            "type": "notify",
            "title": "📩 Nouveau message",
            "message": f"Nouveau message de {sender_name}",
        },
    )
