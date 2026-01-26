from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nom")
    description = models.TextField(blank=True, verbose_name="Description")
    image = models.ImageField(
        upload_to="categories/", blank=True, null=True, verbose_name="Image"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
        verbose_name="Catégorie parente",
    )

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    class ProductStatus(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        ACTIVE = "active", "Actif"
        INACTIVE = "inactive", "Inactif"
        SOLD_OUT = "sold_out", "Épuisé"

    farmer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="products",
        limit_choices_to={"user_type": "farmer"},
        verbose_name="Agriculteur",
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products",
        verbose_name="Catégorie",
    )

    name = models.CharField(max_length=200, verbose_name="Nom")
    description = models.TextField(verbose_name="Description")

    # Prix et unité
    price_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name="Prix par unité",
    )

    unit = models.CharField(max_length=50, default="kg", verbose_name="Unité")

    available_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="Quantité disponible",
    )

    # Détails du produit
    harvest_date = models.DateField(verbose_name="Date de récolte")
    expiry_date = models.DateField(
        null=True, blank=True, verbose_name="Date d'expiration"
    )
    organic = models.BooleanField(default=False, verbose_name="Biologique")

    quality_grade = models.CharField(
        max_length=20,
        choices=[
            ("premium", "Premium"),
            ("standard", "Standard"),
            ("economy", "Économique"),
        ],
        default="standard",
        verbose_name="Qualité",
    )

    # Localisation
    farm_location = models.CharField(
        max_length=200, verbose_name="Localisation de la ferme"
    )
    delivery_radius = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        verbose_name="Rayon de livraison (km)",
    )

    # Statut
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.DRAFT,
        verbose_name="Statut",
    )

    # Images
    main_image = models.ImageField(
        upload_to="products/main/", verbose_name="Image principale"
    )
    images = models.JSONField(
        default=list, blank=True, verbose_name="Images supplémentaires"
    )

    # Statistiques
    views_count = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")
    orders_count = models.PositiveIntegerField(
        default=0, verbose_name="Nombre de commandes"
    )

    # Horodatage
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Dernière modification"
    )

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.farmer.username}"

    @property
    def is_available(self):
        return self.status == self.ProductStatus.ACTIVE and self.available_quantity > 0

    def reserve_quantity(self, quantity: Decimal) -> bool:
        if self.available_quantity < quantity:
            return False

        self.available_quantity -= quantity
        self.save(update_fields=["available_quantity"])
        return True

    def release_quantity(self, quantity: Decimal):
        self.available_quantity += quantity
        self.save(update_fields=["available_quantity"])


class ProductReview(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Produit",
    )

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="product_reviews",
        verbose_name="Utilisateur",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Note"
    )

    comment = models.TextField(verbose_name="Commentaire")
    images = models.JSONField(default=list, blank=True, verbose_name="Images")

    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Dernière modification"
    )

    class Meta:
        verbose_name = "Avis produit"
        verbose_name_plural = "Avis produits"
        unique_together = ["product", "user"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} - {self.user.username} ({self.rating}★)"


class Wishlist(models.Model):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
        verbose_name="Utilisateur",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
        verbose_name="Produit",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'ajout")

    class Meta:
        verbose_name = "Liste de souhaits"
        verbose_name_plural = "Listes de souhaits"
        unique_together = ["user", "product"]

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
