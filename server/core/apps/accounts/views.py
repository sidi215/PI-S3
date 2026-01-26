from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from .models import User, UserProfile
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer,
    UserSerializer, UserProfileSerializer,
    ChangePasswordSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .utils import send_verification_email, send_password_reset_email

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send verification email
        send_verification_email(user)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Compte créé avec succès. Vérifiez votre email.'
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": ["Mot de passe incorrect."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Mot de passe modifié avec succès."})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        send_password_reset_email(user)
        
        return Response({
            "message": "Email de réinitialisation envoyé."
        })

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        
        # Verify token (simplified - in production use a proper token verification)
        try:
            uid = force_str(urlsafe_base64_decode(token.split('.')[0]))
            user = User.objects.get(pk=uid)
            
            if PasswordResetTokenGenerator().check_token(user, token.split('.')[1]):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({"message": "Mot de passe réinitialisé avec succès."})
            else:
                return Response(
                    {"error": "Token invalide ou expiré."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (User.DoesNotExist, ValueError, IndexError):
            return Response(
                {"error": "Token invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, token):
        try:
            uid = force_str(urlsafe_base64_decode(token.split('.')[0]))
            user = User.objects.get(pk=uid)
            
            if PasswordResetTokenGenerator().check_token(user, token.split('.')[1]):
                user.is_verified = True
                user.save()
                return Response({"message": "Email vérifié avec succès."})
            else:
                return Response(
                    {"error": "Token invalide ou expiré."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (User.DoesNotExist, ValueError, IndexError):
            return Response(
                {"error": "Token invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )