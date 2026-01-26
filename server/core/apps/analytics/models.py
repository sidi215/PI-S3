from django.db import models
from django.utils.translation import gettext_lazy as _

class FarmerAnalytics(models.Model):
    farmer = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='analytics',
        limit_choices_to={'user_type': 'farmer'}
    )
    
    # Sales metrics
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.IntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Customer metrics
    total_customers = models.IntegerField(default=0)
    repeat_customer_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Product metrics
    total_products = models.IntegerField(default=0)
    active_products = models.IntegerField(default=0)
    best_selling_products = models.JSONField(default=list)
    
    # Rating metrics
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.IntegerField(default=0)
    
    # Monthly data
    monthly_sales = models.JSONField(default=dict)
    monthly_orders = models.JSONField(default=dict)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Analytics Agriculteur')
        verbose_name_plural = _('Analytics Agriculteurs')