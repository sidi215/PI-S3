from django.db import models
from django.conf import settings
import uuid

class Diagnosis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diagnoses')
    image = models.ImageField(upload_to='diagnoses/%Y/%m/%d/')
    disease_name = models.CharField(max_length=255, blank=True, null=True)
    confidence = models.FloatField(blank=True, null=True)
    recommendation = models.TextField(blank=True, null=True)
    result_json = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Diagnoses"

    def __str__(self):
        return f"{self.disease_name} ({self.confidence:.2f}%)" if self.disease_name and self.confidence else f"Diagnosis {self.id}"
