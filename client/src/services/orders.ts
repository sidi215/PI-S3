import { api } from '@/lib/api'

export interface CartItem {
  id: number
  product: {
    id: number
    name: string
    price_per_unit: string
    unit: string
  }
  quantity: number
  total_price: string
}

export interface Cart {
  id: number
  user: number
  items: CartItem[]
  total_price: string
  item_count: number
}

export interface Order {
  id: number
  user: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_price: string
  shipping_address: string
  shipping_city: string
  shipping_country: string
  shipping_phone: string
  notes: string
  created_at: string
  items: Array<{
    product: Product
    quantity: number
    price_at_purchase: string
  }>
}

export interface CreateOrderDto {
  shipping_address: string
  shipping_city: string
  shipping_country: string
  shipping_phone: string
  notes?: string
}

export const ordersService = {
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/orders/cart/')
    return response.data
  },
  
  addToCart: async (productId: number, quantity: number): Promise<CartItem> => {
    const response = await api.post('/orders/cart-items/', {
      product_id: productId,
      quantity
    })
    return response.data
  },

  updateCartItem: async (itemId: number, quantity: number): Promise<CartItem> => {
    const response = await api.patch(`/orders/cart-items/${itemId}/`, { quantity })
    return response.data
  },

  removeCartItem: async (itemId: number): Promise<void> => {
    await api.delete(`/orders/cart-items/${itemId}/`)
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/orders/cart/clear/')
  },

  createOrder: async (data: CreateOrderDto): Promise<Order> => {
    const response = await api.post('/orders/orders/', data)
    return response.data
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders/orders/')
    return response.data
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/orders/${id}/`)
    return response.data
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const response = await api.post(`/orders/orders/${id}/cancel/`)
    return response.data
  },
  // Accepter une commande
  acceptOrder: async (orderId: number): Promise<Order> => {
    const response = await api.post(`/orders/orders/${orderId}/accept/`)
    return response.data
  },

  // Refuser une commande
  rejectOrder: async (orderId: number, reason?: string): Promise<Order> => {
    const response = await api.post(`/orders/orders/${orderId}/reject/`, { reason })
    return response.data
  },

  // Marquer comme en préparation
  markAsPreparing: async (orderId: number): Promise<Order> => {
    const response = await api.post(`/orders/orders/${orderId}/mark_preparing/`)
    return response.data
  },

  // Marquer comme expédié
  markAsShipped: async (orderId: number, trackingNumber?: string): Promise<Order> => {
    const response = await api.post(`/orders/orders/${orderId}/mark_shipped/`, { tracking_number: trackingNumber })
    return response.data
  },

  // Marquer comme livré
  markAsDelivered: async (orderId: number): Promise<Order> => {
    const response = await api.post(`/orders/orders/${orderId}/mark_delivered/`)
    return response.data
  },

  // Obtenir les commandes pour un agriculteur
  getFarmerOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders/orders/farmer/')
    return response.data
  },

  // Statistiques agriculteur
getFarmerStats: async () => {
  const response = await api.get('/orders/farmer-orders/farmer_stats/')
  return response.data
},


}