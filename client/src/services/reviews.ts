// services/reviews.ts (nouveau)
import { api } from '@/lib/api'

export interface FarmerReview {
  id: number
  farmer: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    farm_name?: string
    city?: string
    phone_number?: string
    rating?: number
  }
  reviewer: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  order: number
  order_number: string
  rating: number
  comment: string
  communication_rating: number
  product_quality_rating: number
  delivery_rating: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface CreateReviewDto {
  farmer: number
  order: number
  rating: number
  communication_rating: number
  product_quality_rating: number
  delivery_rating: number
  comment: string
}

export interface FarmerStats {
  farmer_id: number
  farmer_name: string
  stats: {
    avg_rating: number
    avg_communication: number
    avg_quality: number
    avg_delivery: number
    total_reviews: number
  }
  rating_distribution: Array<{
    rating: number
    count: number
  }>
  verified_reviews: number
}

export const reviewService = {
  // Obtenir mes avis
 async getMyReviews(): Promise<FarmerReview[]> {
  const response = await api.get('/reviews/farmer-reviews/')
  return response.data.results || response.data
}
,

  // Créer un avis
  async createReview(data: CreateReviewDto): Promise<FarmerReview> {
  const response = await api.post(
    '/reviews/farmer-reviews/',
    data
  )
  return response.data
}
,

  // Obtenir les stats d'un agriculteur
async getFarmerStats(farmerId: number): Promise<FarmerStats> {
  const response = await api.get(
    `/reviews/farmer-reviews/farmer_stats/?farmer_id=${farmerId}`
  )
  return response.data
},

  // Obtenir les avis d'un agriculteur
async getFarmerReviews(farmerId: number): Promise<FarmerReview[]> {
  const response = await api.get(
    `/reviews/farmer-reviews/by-farmer/${farmerId}/`
  )
  return response.data.results || response.data
},


  // Obtenir l'avis pour une commande
async getOrderReview(orderId: number): Promise<FarmerReview | null> {
  try {
    const response = await api.get(
      `/reviews/farmer-reviews/by-order/${orderId}/`
    )
    return response.data
  } catch {
    return null
  }
},

  // Mettre à jour un avis
async updateReview(reviewId: number, data: Partial<CreateReviewDto>) {
  const response = await api.patch(
    `/reviews/farmer-reviews/${reviewId}/`,
    data
  )
  return response.data
}, 
// Supprimer un avis
async deleteReview(reviewId: number) {
  await api.delete(`/reviews/farmer-reviews/${reviewId}/`)
}, 


  // Obtenir les avis récents (pour la page d'accueil)
  async getRecentReviews(): Promise<FarmerReview[]> {
    const response = await api.get('/reviews/recent/')
    return response.data.results || response.data
  }
}