// services/marketplace.ts
import { api } from '@/lib/api'  // Assurez-vous que api est correctement configuré

export interface Product {
  id: number
  name: string
  description: string
  category: string
  price_per_unit: string
  available_quantity: number
  unit: string
  images: string[]
  farmer: number
  status: string  // 'draft', 'active', 'inactive', 'sold_out'
  harvest_date: string
  farm_location: string
  organic: boolean
  quality_grade: string
  main_image: string
  created_at: string
  updated_at: string
}

export interface CreateProductData {
  name: string
  description: string
  category_name: string  // Ce devrait être l'ID ou le nom de la catégorie
  price_per_unit: number
  available_quantity: number
  unit: string
  harvest_date?: string  // Format: YYYY-MM-DD
  farm_location?: string
  organic?: boolean
  quality_grade?: string
  main_image?: File  // Image principale obligatoire
  images?: File[]    // Images supplémentaires
}
export const marketplaceService = {

  getAllProducts: async (params?: any) => {
    const queryParams = new URLSearchParams()

    if (params?.available_only) queryParams.append('available_only', 'true')
    if (params?.min_price) queryParams.append('min_price', params.min_price.toString())
    if (params?.max_price) queryParams.append('max_price', params.max_price.toString())
    if (params?.category) queryParams.append('category', params.category)
    if (params?.search) queryParams.append('search', params.search)

    const response = await api.get(
      `/marketplace/products/${queryParams.toString() ? `?${queryParams}` : ''}`
    )
    return response.data
  },

  getFarmerProducts: async () => {
    const response = await api.get('/marketplace/products/my-products/')
    return response.data
  },

  createProduct: async (formData: FormData) => {
    const response = await api.post('/marketplace/products/', formData)
    return response.data
  },

  updateProduct: async (id: number, formData: FormData) => {
    const response = await api.patch(`/marketplace/products/${id}/`, formData)
    return response.data
  },

  deleteProduct: async (id: number) => {
    const response = await api.delete(`/marketplace/products/${id}/`)
    return response.data
  },

  getProduct: async (id: number) => {
    const response = await api.get(`/marketplace/products/${id}/`)
    return response.data
  },

  searchProducts: async (query: string) => {
    const response = await api.get(`/marketplace/search/?search=${query}`)
    return response.data
  },

  updateStock: async (id: number, quantity: number) => {
    const response = await api.post(
      `/marketplace/products/${id}/update_stock/`,
      { quantity }
    )
    return response.data
  },

  toggleProductStatus: async (id: number) => {
    const response = await api.post(
      `/marketplace/products/${id}/toggle_status/`
    )
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/marketplace/categories/')
    return response.data
  },

  toggleWishlist: async (productId: number) => {
    const response = await api.post(
      `/marketplace/products/${productId}/toggle_wishlist/`
    )
    return response.data
  },

  getWishlist: async () => {
    const response = await api.get('/marketplace/wishlist/')
    return response.data
  }
}
