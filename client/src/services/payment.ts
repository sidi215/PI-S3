// services/payment.ts (nouveau)
import { api } from '@/lib/api'

export interface Payment {
  id: number
  order: number
  amount: string
  payment_method: 'cash_on_delivery' | 'credit_card' | 'mobile_money'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface CreatePaymentDto {
  order: number
  payment_method: 'cash_on_delivery' | 'credit_card' | 'mobile_money'
  mobile_number?: string
  mobile_provider?: string
  card_token?: string
}

export const paymentService = {
  // Créer un paiement
  createPayment: async (data: CreatePaymentDto): Promise<Payment> => {
    const response = await api.post('/payments/payments/', data)
    return response.data
  },

  // Tester un paiement
  testPayment: async (orderId: number): Promise<any> => {
    const response = await api.post('/payments/test/', { order_id: orderId })
    return response.data
  },

  // Cartes de test
  getTestCards: async (): Promise<any[]> => {
    const response = await api.get('/payments/payments/test_cards/')
    return response.data.cards || []
  },

  // Vérifier un paiement mobile money
  verifyPayment: async (paymentId: number): Promise<void> => {
    await api.post(`/payments/payments/${paymentId}/verify/`)
  }
}