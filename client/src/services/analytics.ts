import { api } from '@/lib/api'

export interface FarmerAnalytics {
  id: number
  farmer: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    user_type: string
    phone_number: string
    city: string
    wilaya: string
  }
  total_sales: string
  total_orders: number
  average_order_value: string
  total_customers: number
  repeat_customer_rate: string
  total_products: number
  active_products: number
  best_selling_products: any[]
  average_rating: string
  total_reviews: number
  monthly_sales: Record<string, number>
  monthly_orders: Record<string, number>
  updated_at: string
}

export interface DashboardData {
  user_type: string
  welcome_message: string
  stats: {
    total_sales: number
    total_orders: number
    total_customers: number
    average_rating: number
    active_products: number
  }
  quick_actions: Array<{
    action: string
    label: string
    icon: string
  }>
}

export const analyticsService = {
  getFarmerAnalytics: async (): Promise<FarmerAnalytics> => {
    const response = await api.get('/analytics/farmer/')
    return response.data
  },

  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/analytics/dashboard/')
    return response.data
  },
}