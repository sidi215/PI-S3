// services/wishlist.ts
import { api } from '@/lib/api';

export interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price_per_unit: string;
    unit: string;
    available_quantity: number;
    main_image: string;
    images: string[];
    farmer: {
      id: number;
      username: string;
      farm_name: string;
    };
  };
  created_at: string;
}

export const wishlistService = {
  // Récupérer la liste de souhaits
  getWishlist: async (): Promise<WishlistItem[]> => {
    try {
      const response = await api.get('/marketplace/wishlist/');
      const data = response.data;
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Erreur récupération wishlist:', error);
      return [];
    }
  },

  // Ajouter/retirer de la liste de souhaits
  toggleWishlist: async (productId: number): Promise<any> => {
    try {
      const response = await api.post(
        `/marketplace/products/${productId}/toggle_wishlist/`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur toggle wishlist:', error);
      throw error;
    }
  },

  // Vider la liste de souhaits
  clearWishlist: async (): Promise<void> => {
    try {
      await api.delete('/marketplace/wishlist/clear/');
    } catch (error) {
      console.error('Erreur clear wishlist:', error);
      throw error;
    }
  },

  // Compter les favoris
  getWishlistCount: async (): Promise<number> => {
    try {
      const response = await api.get('/marketplace/wishlist/count/');
      return response.data.count || 0;
    } catch (error) {
      console.error('Erreur count wishlist:', error);
      return 0;
    }
  },
};
