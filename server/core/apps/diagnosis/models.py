from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Diagnosis(models.Model):
    farmer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Agriculteur"
    )

    image = models.ImageField(
        upload_to="diagnosis/",
        verbose_name="Image analysée"
    )

    disease = models.CharField(
        max_length=255,
        verbose_name="Maladie détectée"
    )

    confidence = models.FloatField(
        verbose_name="Taux de confiance (%)"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d’analyse"
    )

    class Meta:
        verbose_name = "Diagnostic"
        verbose_name_plural = "Diagnostics"
