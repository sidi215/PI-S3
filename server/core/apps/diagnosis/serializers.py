from rest_framework import serializers
from .models import Diagnosis

class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = ['id', 'image', 'disease_name', 'confidence', 'recommendation', 'created_at']
        read_only_fields = ['id', 'disease_name', 'confidence', 'recommendation', 'created_at']
