def get_recommendation(disease: str) -> str:
    recommendations = {

        "Tomato Healthy": (
            "Plant appears healthy. "
            "Continue regular monitoring and good agricultural practices."
        ),

        "Tomato Early Blight": (
            "Early blight detected. "
            "Remove infected leaves immediately. "
            "Apply fungicide containing chlorothalonil or copper. "
            "Avoid overhead irrigation."
        ),

        "Tomato Late Blight": (
            "Late blight detected. "
            "This disease spreads rapidly. "
            "Apply appropriate fungicide urgently and remove infected plants."
        ),

        "Tomato Septoria Leaf Spot": (
            "Septoria leaf spot detected. "
            "Remove affected leaves and improve air circulation. "
            "Apply fungicide if infection is severe."
        ),

        "Tomato Bacterial Spot": (
            "Bacterial spot detected. "
            "Avoid working with wet plants. "
            "Apply copper-based bactericide."
        ),

        "Tomato Leaf Mold": (
            "Leaf mold detected. "
            "Reduce humidity and improve ventilation. "
            "Apply appropriate fungicide if needed."
        ),

        "Tomato Target Spot": (
            "Target spot detected. "
            "Remove infected leaves and apply fungicide."
        ),

        "Tomato Spider Mites": (
            "Possible spider mite infestation. "
            "Inspect underside of leaves. "
            "Apply acaricide or neem oil. "
            "Increase humidity if possible."
        ),

        "Tomato Yellow Leaf Curl Virus": (
            "Yellow leaf curl virus detected. "
            "No chemical cure available. "
            "Remove infected plants and control whiteflies."
        ),

        "Tomato Mosaic Virus": (
            "Mosaic virus detected. "
            "Remove infected plants immediately. "
            "Disinfect tools to prevent spread."
        ),

        "Potato Healthy": (
            "Plant appears healthy. "
            "Continue regular monitoring."
        ),

        "Potato Early Blight": (
            "Early blight detected. "
            "Remove infected leaves and apply fungicide."
        ),

        "Potato Late Blight": (
            "Late blight detected. "
            "High risk disease. "
            "Apply fungicide immediately and destroy infected plants."
        ),

        "Pepper Healthy": (
            "Plant appears healthy. "
            "Maintain good field hygiene."
        ),

        "Pepper Bacterial Spot": (
            "Bacterial spot detected. "
            "Avoid overhead irrigation. "
            "Apply copper-based bactericide."
        ),
    }

    return recommendations.get(
        disease,
        "Result uncertain. Please take another clear photo of a single leaf."
    )
