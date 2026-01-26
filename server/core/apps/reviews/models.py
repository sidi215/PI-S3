from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


class FarmerReview(models.Model):
    farmer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="farmer_reviews",
        limit_choices_to={"user_type": "farmer"},
    )
    reviewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="given_farmer_reviews",
        limit_choices_to={"user_type": "buyer"},
    )
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="farmer_reviews"
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)

    # Rating breakdown
    communication_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    product_quality_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    delivery_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    is_verified = models.BooleanField(default=True)  # From actual order

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["farmer", "reviewer", "order"]
        ordering = ["-created_at"]
