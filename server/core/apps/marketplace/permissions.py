from rest_framework import permissions


class IsFarmerOrReadOnly(permissions.BasePermission):
    """
    Permission qui permet uniquement aux agriculteurs de créer/modifier,
    mais permet à tout le monde de lire.
    """

    def has_permission(self, request, view):
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True

        # Écriture seulement pour les agriculteurs
        return request.user.is_authenticated and request.user.user_type == "farmer"

    def has_object_permission(self, request, view, obj):
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True

        # Écriture seulement pour le propriétaire (agriculteur)
        return obj.farmer == request.user


class IsProductOwner(permissions.BasePermission):
    """
    Permission qui permet uniquement au propriétaire du produit d'effectuer des actions.
    """

    def has_object_permission(self, request, view, obj):
        # Vérifie si l'utilisateur est le propriétaire du produit
        return obj.farmer == request.user
