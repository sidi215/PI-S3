import logging
import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Diagnosis
from .serializers import DiagnosisSerializer

logger = logging.getLogger(__name__)

class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.all()
    serializer_class = DiagnosisSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        self.diagnose_plant(instance)

    def diagnose_plant(self, instance):
        """
        Send image to AI service and update the instance with results.
        """
        ai_service_url = getattr(settings, 'AI_SERVICE_URL', 'http://localhost:8001')
        predict_url = f"{ai_service_url}/api/v1/predict"

        try:
            # Prepare file for upload
            # We open the file from the storage. 
            # Note: storage might be local or S3. Open() should handle local.
            with instance.image.open('rb') as img_file:
                files = {'file': (instance.image.name, img_file, 'image/jpeg')}
                
                logger.info(f"Sending diagnosis request to {predict_url}")
                response = requests.post(predict_url, files=files, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    instance.result_json = result
                    instance.disease_name = result.get('disease')
                    instance.confidence = result.get('confidence')
                    instance.recommendation = result.get('recommendation')
                    instance.save()
                    logger.info(f"Diagnosis successful: {instance.disease_name}")
                else:
                    logger.error(f"AI Service failed: {response.text}")
                    # Optionally handle error appropriately, maybe save error state
        
        except Exception as e:
            logger.error(f"Error connecting to AI service: {str(e)}")
            # Keep the record but maybe mark as failed or just leave partial?
            pass
