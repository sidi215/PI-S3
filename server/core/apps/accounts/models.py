from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """Manager personnalisé pour le modèle User"""
    
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'adresse email est obligatoire')
        if not username:
            raise ValueError('Le nom d\'utilisateur est obligatoire')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Le superuser doit avoir is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Le superuser doit avoir is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    """Modèle utilisateur personnalisé pour BetterAgri Mauritanie"""
    
    class UserType(models.TextChoices):
        FARMER = 'farmer', 'Agriculteur'
        BUYER = 'buyer', 'Acheteur'
        ADMIN = 'admin', 'Administrateur'
    
    # Wilayas de Mauritanie
    WILAYAS = [
        ('Nouakchott', 'Nouakchott'),
        ('Nouakchott Ouest', 'Nouakchott Ouest'),
        ('Nouakchott Nord', 'Nouakchott Nord'),
        ('Nouakchott Sud', 'Nouakchott Sud'),
        ('Brakna', 'Brakna'),
        ('Hodh El Gharbi', 'Hodh El Gharbi'),
        ('Hodh Ech Chargui', 'Hodh Ech Chargui'),
        ('Assaba', 'Assaba'),
        ('Gorgol', 'Gorgol'),
        ('Guidimaka', 'Guidimaka'),
        ('Adrar', 'Adrar'),
        ('Dakhlet Nouadhibou', 'Dakhlet Nouadhibou'),
        ('Tagant', 'Tagant'),
        ('Tiris Zemmour', 'Tiris Zemmour'),
        ('Inchiri', 'Inchiri'),
        ('Trarza', 'Trarza'),
    ]
    
    # Villes principales de Mauritanie
    CITIES = [
        ('Nouakchott', 'Nouakchott'),
        ('Nouadhibou', 'Nouadhibou'),
        ('Kiffa', 'Kiffa'),
        ('Rosso', 'Rosso'),
        ('Zouérat', 'Zouérat'),
        ('Atar', 'Atar'),
        ('Kaédi', 'Kaédi'),
        ('Aleg', 'Aleg'),
        ('Boutilimit', 'Boutilimit'),
        ('Selibaby', 'Selibaby'),
        ('Tidjikja', 'Tidjikja'),
        ('Néma', 'Néma'),
        ('Aïoun', 'Aïoun'),
        ('Sélibabi', 'Sélibabi'),
        ('Bogue', 'Bogue'),
        ('Mâl', 'Mâl'),
        ('Mbout', 'Mbout'),
        ('Timbedra', 'Timbedra'),
    ]
    
    # Types de cultures en Mauritanie
    CROP_TYPES = [
        ('dattes', 'Dattes'),
        ('maïs', 'Maïs'),
        ('riz', 'Riz'),
        ('blé', 'Blé'),
        ('mil', 'Mil'),
        ('sorgho', 'Sorgho'),
        ('légumes', 'Légumes'),
        ('tomates', 'Tomates'),
        ('oignons', 'Oignons'),
        ('pommes de terre', 'Pommes de terre'),
        ('carottes', 'Carottes'),
        ('fruits', 'Fruits'),
        ('mangues', 'Mangues'),
        ('oranges', 'Oranges'),
        ('bananes', 'Bananes'),
        ('fourrage', 'Fourrage'),
        ('coton', 'Coton'),
        ('arachides', 'Arachides'),
    ]
    
    # Validation du numéro de téléphone mauritanien
    phone_regex = RegexValidator(
        regex=r'^(\+222|00222)?[0-9]{8}$',
        message="Numéro de téléphone invalide. Format: +222XXXXXXXX ou 00222XXXXXXXX (8 chiffres)"
    )
    
    # === Champs de base ===============================================
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.BUYER,
        verbose_name='Type d\'utilisateur'
    )
    
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=15,
        blank=True,
        verbose_name='Numéro de téléphone'
    )
    
    # === Localisation =================================================
    wilaya = models.CharField(
        max_length=50,
        choices=WILAYAS,
        blank=True,
        verbose_name='Wilaya'
    )
    
    city = models.CharField(
        max_length=100,
        choices=CITIES,
        blank=True,
        verbose_name='Ville'
    )
    
    address = models.TextField(
        blank=True,
        verbose_name='Adresse complète'
    )
    
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name='Latitude'
    )
    
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name='Longitude'
    )
    
    # === Profil utilisateur ===========================================
    profile_picture = models.ImageField(
        upload_to='profile_pictures/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Photo de profil'
    )
    
    bio = models.TextField(
        blank=True,
        verbose_name='Biographie'
    )
    
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date de naissance'
    )
    
    gender = models.CharField(
        max_length=10,
        choices=[
            ('male', 'Homme'),
            ('female', 'Femme'),
            ('other', 'Autre'),
        ],
        blank=True,
        verbose_name='Genre'
    )
    
    # === Champs spécifiques aux agriculteurs ==========================
    farm_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nom de la ferme/exploitation'
    )
    
    farm_size_hectares = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Superficie (hectares)'
    )
    
    farm_location = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Localisation de la ferme'
    )
    
    crop_types = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Types de cultures'
    )
    
    farming_experience = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Années d\'expérience'
    )
    
    irrigation_system = models.CharField(
        max_length=50,
        choices=[
            ('goutte_a_goutte', 'Goutte-à-goutte'),
            ('aspersion', 'Aspersion'),
            ('gravitaire', 'Gravitaire'),
            ('manuelle', 'Manuelle'),
            ('aucun', 'Aucun système'),
        ],
        blank=True,
        verbose_name='Système d\'irrigation'
    )
    
    # === Vérification et statut =======================================
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Compte vérifié'
    )
    
    verification_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de vérification'
    )
    
    is_active_farmer = models.BooleanField(
        default=True,
        verbose_name='Agriculteur actif'
    )
    
    # === Statistiques et notations ====================================
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        verbose_name='Note moyenne'
    )
    
    total_sales = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name='Chiffre d\'affaires total'
    )
    
    total_orders = models.IntegerField(
        default=0,
        verbose_name='Nombre total de commandes'
    )
    
    completed_orders = models.IntegerField(
        default=0,
        verbose_name='Commandes complétées'
    )
    
    # === Préférences ==================================================
    language = models.CharField(
        max_length=10,
        choices=[
            ('fr', 'Français'),
            ('ar', 'Arabe'),
        ],
        default='fr',
        verbose_name='Langue préférée'
    )
    
    currency = models.CharField(
        max_length=3,
        default='MRU',
        verbose_name='Devise préférée'
    )
    
    receive_email_notifications = models.BooleanField(
        default=True,
        verbose_name='Recevoir les notifications par email'
    )
    
    receive_sms_notifications = models.BooleanField(
        default=True,
        verbose_name='Recevoir les notifications par SMS'
    )
    
    # === Métadonnées ==================================================
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    # === Manager ======================================================
    objects = UserManager()
    
    # === Configuration ================================================
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['user_type']),
            models.Index(fields=['wilaya', 'city']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
    
    # === Méthodes =====================================================
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    def get_full_name(self):
        """Retourne le nom complet de l'utilisateur"""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip() if full_name.strip() else self.username
    
    def is_farmer(self):
        """Vérifie si l'utilisateur est un agriculteur"""
        return self.user_type == self.UserType.FARMER
    
    def is_buyer(self):
        """Vérifie si l'utilisateur est un acheteur"""
        return self.user_type == self.UserType.BUYER
    
    def get_location_display(self):
        """Retourne la localisation formatée"""
        if self.city and self.wilaya:
            return f"{self.city}, {self.wilaya}"
        elif self.city:
            return self.city
        elif self.wilaya:
            return self.wilaya
        return "Non spécifié"
    
    def update_rating(self):
        """Met à jour la note moyenne de l'utilisateur"""
        from core.apps.reviews.models import FarmerReview
        if self.is_farmer():
            reviews = FarmerReview.objects.filter(farmer=self)
            if reviews.exists():
                avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
                self.rating = round(avg_rating, 2) if avg_rating else 0.00
                self.save(update_fields=['rating'])
    
    def get_crop_types_display(self):
        """Retourne les types de cultures formatés"""
        if not self.crop_types:
            return "Non spécifié"
        
        # Traduire les codes en noms complets
        crop_names = []
        for crop_code in self.crop_types:
            for code, name in self.CROP_TYPES:
                if crop_code == code:
                    crop_names.append(name)
                    break
        
        return ", ".join(crop_names) if crop_names else "Non spécifié"


class UserProfile(models.Model):
    """Profil étendu pour les utilisateurs"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='user_profile',
        verbose_name='Utilisateur'
    )
    
    # Informations de contact supplémentaires
    secondary_email = models.EmailField(
        blank=True,
        verbose_name='Email secondaire'
    )
    
    secondary_phone = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Téléphone secondaire'
    )
    
    # Informations professionnelles
    profession = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Profession'
    )
    
    company_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nom de l\'entreprise'
    )
    
    # Pour les agriculteurs
    farm_registration_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Numéro d\'enregistrement de la ferme'
    )
    
    farm_certifications = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Certifications de la ferme'
    )
    
    # Pour les acheteurs
    buyer_type = models.CharField(
        max_length=50,
        choices=[
            ('individual', 'Particulier'),
            ('restaurant', 'Restaurant'),
            ('hotel', 'Hôtel'),
            ('supermarket', 'Supermarché'),
            ('wholesaler', 'Grossiste'),
            ('other', 'Autre'),
        ],
        default='individual',
        verbose_name='Type d\'acheteur'
    )
    
    # Préférences d'achat
    preferred_product_categories = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Catégories de produits préférées'
    )
    
    preferred_delivery_time = models.CharField(
        max_length=50,
        choices=[
            ('morning', 'Matin (8h-12h)'),
            ('afternoon', 'Après-midi (14h-18h)'),
            ('evening', 'Soir (18h-22h)'),
            ('anytime', 'À tout moment'),
        ],
        default='anytime',
        verbose_name='Heure de livraison préférée'
    )
    
    # Statistiques
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dernière IP de connexion'
    )
    
    login_count = models.IntegerField(
        default=0,
        verbose_name='Nombre de connexions'
    )
    
    last_activity = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Dernière activité'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    class Meta:
        verbose_name = 'Profil utilisateur'
        verbose_name_plural = 'Profils utilisateurs'
    
    def __str__(self):
        return f"Profil de {self.user.username}"
    
    def get_buyer_type_display(self):
        """Retourne le type d'acheteur formaté"""
        return dict(self._meta.get_field('buyer_type').choices).get(
            self.buyer_type, self.buyer_type
        )


class UserVerification(models.Model):
    """Vérification des utilisateurs"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='verification',
        verbose_name='Utilisateur'
    )
    
    # Documents d'identité
    id_card_front = models.ImageField(
        upload_to='verification/id_cards/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Recto de la carte d\'identité'
    )
    
    id_card_back = models.ImageField(
        upload_to='verification/id_cards/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Verso de la carte d\'identité'
    )
    
    # Pour les agriculteurs
    farm_registration_document = models.FileField(
        upload_to='verification/farm_docs/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Document d\'enregistrement de la ferme'
    )
    
    land_title_document = models.FileField(
        upload_to='verification/land_docs/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Titre de propriété'
    )
    
    # Statut de vérification
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'En attente'),
            ('under_review', 'En cours d\'examen'),
            ('verified', 'Vérifié'),
            ('rejected', 'Rejeté'),
            ('suspended', 'Suspendu'),
        ],
        default='pending',
        verbose_name='Statut de vérification'
    )
    
    verification_notes = models.TextField(
        blank=True,
        verbose_name='Notes de vérification'
    )
    
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_users',
        verbose_name='Vérifié par'
    )
    
    verification_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de vérification'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    class Meta:
        verbose_name = 'Vérification utilisateur'
        verbose_name_plural = 'Vérifications utilisateurs'
    
    def __str__(self):
        return f"Vérification de {self.user.username} - {self.get_status_display()}"
    
    def mark_as_verified(self, verified_by_user):
        """Marquer l'utilisateur comme vérifié"""
        self.status = 'verified'
        self.verified_by = verified_by_user
        self.verification_date = timezone.now()
        self.save()
        
        # Mettre à jour l'utilisateur
        self.user.is_verified = True
        self.user.verification_date = self.verification_date
        self.user.save()


class UserDevice(models.Model):
    """Appareils utilisés par les utilisateurs pour les notifications push"""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='devices',
        verbose_name='Utilisateur'
    )
    
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('android', 'Android'),
            ('ios', 'iOS'),
            ('web', 'Web'),
        ],
        verbose_name='Type d\'appareil'
    )
    
    device_token = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Token de l\'appareil'
    )
    
    device_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='ID de l\'appareil'
    )
    
    app_version = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Version de l\'application'
    )
    
    os_version = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Version du système d\'exploitation'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Appareil actif'
    )
    
    last_used = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière utilisation'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    class Meta:
        verbose_name = 'Appareil utilisateur'
        verbose_name_plural = 'Appareils utilisateurs'
        unique_together = ['user', 'device_token']
    
    def __str__(self):
        return f"{self.device_type} - {self.user.username}"