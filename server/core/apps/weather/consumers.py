import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_group = f"user_{self.scope['user'].id}"

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def notify(self, event):
        await self.send(
            text_data=json.dumps({"title": event["title"], "message": event["message"]})
        )
