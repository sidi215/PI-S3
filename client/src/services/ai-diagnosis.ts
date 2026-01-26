// services/ai-diagnosis.ts
import axios from 'axios';

const AI_SERVICE_URL = 'http://localhost:8001'; // URL de votre service FastAPI

export interface DiagnosisResult {
  model_version: string;
  disease: string;
  confidence: number;
  recommendation: string;
  treatment_duration: string;
  products: string;
  actions: string[];
}

export const aiDiagnosisService = {
  async diagnosePlant(imageFile: File): Promise<DiagnosisResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error);
      throw new Error('Échec du diagnostic. Veuillez réessayer.');
    }
  },

  async getDiseaseInfo(diseaseName: string) {
    // Vous pouvez ajouter plus d'informations sur les maladies
    const diseaseInfo: Record<
      string,
      { description: string; severity: string }
    > = {
      'Tomato Early Blight': {
        description: 'Maladie fongique qui affecte les feuilles de tomate',
        severity: 'Moyenne',
      },
      'Tomato Late Blight': {
        description: 'Maladie destructrice causée par un champignon',
        severity: 'Élevée',
      },
      // Ajoutez plus d'informations pour d'autres maladies
    };

    return (
      diseaseInfo[diseaseName] || {
        description: 'Information non disponible',
        severity: 'Inconnue',
      }
    );
  },
};
