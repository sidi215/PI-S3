from rest_framework import serializers
from .models import Category, Product, ProductReview, Wishlist
from apps.accounts.serializers import UserSerializer  


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description", "image", "parent"]


class ProductSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    main_image = serializers.SerializerMethodField()
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    is_available = serializers.BooleanField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    total_reviews = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "farmer",
            "category",
            "category_id",
            "name",
            "description",
            "price_per_unit",
            "unit",
            "available_quantity",
            "harvest_date",
            "expiry_date",
            "organic",
            "quality_grade",
            "farm_location",
            "delivery_radius",
            "status",
            "main_image",
            "images",
            "views_count",
            "orders_count",
            "is_available",
            "average_rating",
            "total_reviews",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "farmer",
            "views_count",
            "orders_count",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        # Ensure harvest_date is before expiry_date if both exist
        harvest_date = data.get("harvest_date")
        expiry_date = data.get("expiry_date")

        if expiry_date and harvest_date and expiry_date < harvest_date:
            raise serializers.ValidationError(
                {
                    "expiry_date": "La date d'expiration doit être après la date de récolte."
                }
            )

        # Ensure available_quantity is positive
        available_quantity = data.get("available_quantity")
        if available_quantity and available_quantity < 0:
            raise serializers.ValidationError(
                {
                    "available_quantity": "La quantité disponible ne peut pas être négative."
                }
            )

        return data

    def get_main_image(self, obj):
        request = self.context.get("request")
        if obj.main_image:
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "category",
            "name",
            "description",
            "price_per_unit",
            "unit",
            "available_quantity",
            "harvest_date",
            "expiry_date",
            "organic",
            "quality_grade",
            "farm_location",
            "delivery_radius",
            "main_image",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["farmer"] = request.user
        validated_data["status"] = (
            "active" if validated_data.get("available_quantity", 0) > 0 else "draft"
        )
        return super().create(validated_data)


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des produits"""

    class Meta:
        model = Product
        fields = [
            "name",
            "description",
            "price_per_unit",
            "unit",
            "available_quantity",
            "harvest_date",
            "expiry_date",
            "organic",
            "quality_grade",
            "farm_location",
            "delivery_radius",
            "main_image",
            "images",
            "status",
        ]

    def validate(self, data):
        # Ensure harvest_date is before expiry_date if both exist
        harvest_date = data.get("harvest_date")
        expiry_date = data.get("expiry_date")

        if expiry_date and harvest_date and expiry_date < harvest_date:
            raise serializers.ValidationError(
                {
                    "expiry_date": "La date d'expiration doit être après la date de récolte."
                }
            )

        # Ensure available_quantity is positive
        available_quantity = data.get("available_quantity")
        if available_quantity and available_quantity < 0:
            raise serializers.ValidationError(
                {
                    "available_quantity": "La quantité disponible ne peut pas être négative."
                }
            )

        return data

    def update(self, instance, validated_data):
        # Si la quantité devient 0, mettre le statut à "sold_out"
        if "available_quantity" in validated_data:
            if validated_data["available_quantity"] == 0:
                validated_data["status"] = "sold_out"
            elif (
                instance.status == "sold_out"
                and validated_data["available_quantity"] > 0
            ):
                validated_data["status"] = "active"

        return super().update(instance, validated_data)


class ProductReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product",
            "user",
            "rating",
            "comment",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]

    def validate(self, data):
        # Check if user has purchased the product
        request = self.context.get("request")
        product = data.get("product")

        # Verify user has ordered this product
        has_ordered = product.orders.filter(
            buyer=request.user, status="completed"
        ).exists()

        if not has_ordered:
            raise serializers.ValidationError(
                {"product": "Vous devez avoir acheté ce produit pour le noter."}
            )

        # Check if user already reviewed this product
        if ProductReview.objects.filter(product=product, user=request.user).exists():
            raise serializers.ValidationError(
                {"product": "Vous avez déjà noté ce produit."}
            )

        return data


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(status="active"),
        source="product",
        write_only=True,
    )

    class Meta:
        model = Wishlist
        fields = ["id", "user", "product", "product_id", "created_at"]
        read_only_fields = ["user", "created_at"]

    def validate(self, data):
        request = self.context.get("request")
        product = data.get("product")

        # Check if product is already in wishlist
        if Wishlist.objects.filter(user=request.user, product=product).exists():
            raise serializers.ValidationError(
                {"product": "Ce produit est déjà dans votre liste de souhaits."}
            )

        return data
