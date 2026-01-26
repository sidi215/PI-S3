# messaging/middleware.py
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

User = get_user_model()

class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = None
        
        # Extraire le token de la query string
        if 'token=' in query_string:
            token = query_string.split('token=')[1].split('&')[0]
        
        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                scope['user'] = await self.get_user(user_id)
            except (TokenError, KeyError):
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()
        
        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()