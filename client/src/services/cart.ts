import { api } from '@/lib/api';

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price_per_unit: string;
    unit: string;
    main_image?: string;
    farmer: {
      id: number;
      farm_name: string;
    };
  };
  quantity: number;
  total_price: string;
}

export interface Cart {
  id: number;
  user: number;
  items: CartItem[];
  total_price: string;
  item_count: number;
}

export const cartService = {
  // Récupérer le panier
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/orders/cart/');
    return response.data;
  },

  // Ajouter au panier
  addToCart: async (productId: number, quantity: number): Promise<CartItem> => {
    const response = await api.post('/orders/cart-items/', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  // Mettre à jour la quantité
  updateCartItem: async (
    itemId: number,
    quantity: number
  ): Promise<CartItem> => {
    const response = await api.patch(`/orders/cart-items/${itemId}/`, {
      quantity,
    });
    return response.data;
  },

  // Retirer du panier
  removeCartItem: async (itemId: number): Promise<void> => {
    await api.delete(`/orders/cart-items/${itemId}/`);
  },

  // Vider le panier
  clearCart: async (): Promise<void> => {
    await api.delete('/orders/cart/clear/');
  },

  // Calculer le total
  calculateTotal: (items: CartItem[]): number => {
    return items.reduce(
      (total, item) => total + parseFloat(item.total_price),
      0
    );
  },
};
