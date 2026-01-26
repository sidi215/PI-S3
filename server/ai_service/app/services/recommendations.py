def get_recommendation(disease: str) -> dict:
    recommendations = {
        # ================= TOMATO =================
        "Tomato Healthy": {
            "recommendation": (
                "Plant appears healthy. Continue regular monitoring and good agricultural practices."
            ),
            "actions": [
                "Continuer la surveillance régulière",
                "Maintenir une bonne irrigation",
                "Éviter l’excès d’humidité",
            ],
            "treatment_duration": "—",
            "products": "Aucun",
        },
        "Tomato Early Blight": {
            "recommendation": (
                "Early blight detected. Remove infected leaves immediately. "
                "Apply fungicide containing chlorothalonil or copper."
            ),
            "actions": [
                "Supprimer les feuilles infectées",
                "Appliquer un fongicide adapté",
                "Éviter l’arrosage par aspersion",
            ],
            "treatment_duration": "7–14 jours",
            "products": "Fongicide",
        },
        "Tomato Late Blight": {
            "recommendation": (
                "Late blight detected. This disease spreads rapidly. "
                "Apply fungicide urgently and remove infected plants."
            ),
            "actions": [
                "Isoler immédiatement les plantes atteintes",
                "Détruire les plants gravement infectés",
                "Appliquer un fongicide systémique",
            ],
            "treatment_duration": "Urgent (immédiat)",
            "products": "Fongicide systémique",
        },
        "Tomato Septoria Leaf Spot": {
            "recommendation": (
                "Septoria leaf spot detected. Remove affected leaves "
                "and improve air circulation."
            ),
            "actions": [
                "Retirer les feuilles atteintes",
                "Améliorer l’aération entre les plants",
                "Appliquer un fongicide si nécessaire",
            ],
            "treatment_duration": "7–10 jours",
            "products": "Fongicide",
        },
        "Tomato Bacterial Spot": {
            "recommendation": (
                "Bacterial spot detected. Avoid working with wet plants "
                "and apply copper-based bactericide."
            ),
            "actions": [
                "Éviter de manipuler les plantes humides",
                "Appliquer un bactéricide au cuivre",
                "Désinfecter les outils",
            ],
            "treatment_duration": "7 jours",
            "products": "Bactéricide (cuivre)",
        },
        "Tomato Leaf Mold": {
            "recommendation": (
                "Leaf mold detected. Reduce humidity and improve ventilation."
            ),
            "actions": [
                "Réduire l’humidité",
                "Améliorer la ventilation",
                "Appliquer un fongicide si nécessaire",
            ],
            "treatment_duration": "7–14 jours",
            "products": "Fongicide",
        },
        "Tomato Target Spot": {
            "recommendation": (
                "Target spot detected. Remove infected leaves and apply fungicide."
            ),
            "actions": [
                "Supprimer les feuilles infectées",
                "Appliquer un fongicide",
                "Surveiller la propagation",
            ],
            "treatment_duration": "7–14 jours",
            "products": "Fongicide",
        },
        "Tomato Spider Mites": {
            "recommendation": (
                "Possible spider mite infestation. Inspect underside of leaves "
                "and apply acaricide or neem oil."
            ),
            "actions": [
                "Inspecter le dessous des feuilles",
                "Appliquer un acaricide ou huile de neem",
                "Augmenter légèrement l’humidité",
            ],
            "treatment_duration": "5–10 jours",
            "products": "Acaricide / Neem",
        },
        "Tomato Yellow Leaf Curl Virus": {
            "recommendation": (
                "Yellow leaf curl virus detected. No chemical cure available."
            ),
            "actions": [
                "Arracher les plants infectés",
                "Contrôler les aleurodes",
                "Éviter la replantation immédiate",
            ],
            "treatment_duration": "—",
            "products": "Aucun",
        },
        "Tomato Mosaic Virus": {
            "recommendation": (
                "Mosaic virus detected. Remove infected plants immediately."
            ),
            "actions": [
                "Supprimer les plants infectés",
                "Désinfecter les outils",
                "Éviter le contact entre plants",
            ],
            "treatment_duration": "—",
            "products": "Aucun",
        },
        # ================= POTATO =================
        "Potato Healthy": {
            "recommendation": "Plant appears healthy. Continue regular monitoring.",
            "actions": [
                "Surveiller régulièrement",
                "Maintenir une bonne fertilisation",
            ],
            "treatment_duration": "—",
            "products": "Aucun",
        },
        "Potato Early Blight": {
            "recommendation": "Early blight detected. Remove infected leaves and apply fungicide.",
            "actions": [
                "Retirer les feuilles infectées",
                "Appliquer un fongicide",
                "Éviter l’humidité excessive",
            ],
            "treatment_duration": "7–14 jours",
            "products": "Fongicide",
        },
        "Potato Late Blight": {
            "recommendation": (
                "Late blight detected. High risk disease. "
                "Apply fungicide immediately."
            ),
            "actions": [
                "Isoler les plants infectés",
                "Appliquer un fongicide immédiatement",
                "Surveiller les parcelles voisines",
            ],
            "treatment_duration": "Urgent",
            "products": "Fongicide",
        },
        # ================= PEPPER =================
        "Pepper Healthy": {
            "recommendation": "Plant appears healthy. Maintain good field hygiene.",
            "actions": ["Maintenir l’hygiène du champ", "Surveiller les feuilles"],
            "treatment_duration": "—",
            "products": "Aucun",
        },
        "Pepper Bacterial Spot": {
            "recommendation": (
                "Bacterial spot detected. Avoid overhead irrigation "
                "and apply copper-based bactericide."
            ),
            "actions": [
                "Éviter l’arrosage par aspersion",
                "Appliquer un bactéricide au cuivre",
                "Supprimer les feuilles infectées",
            ],
            "treatment_duration": "7 jours",
            "products": "Bactéricide (cuivre)",
        },
    }

    return recommendations.get(
        disease,
        {
            "recommendation": "Result uncertain. Please take another clear photo of a single leaf.",
            "actions": ["Reprendre une photo claire d’une seule feuille"],
            "treatment_duration": "—",
            "products": "—",
        },
    )
