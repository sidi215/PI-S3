import { api } from '@/lib/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  user_type: 'farmer' | 'buyer' | 'admin';
  phone_number: string;
  first_name: string;
  last_name: string;
  wilaya?: string;
  city?: string;
  farm_name?: string;
  farm_size_hectares?: string;
  crop_types?: string[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  phone_number: string;
  wilaya: string;
  city: string;
  farm_name?: string;
  farm_size_hectares?: number;
  rating: string;
  total_sales: string;
  is_verified: boolean;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/profile/');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>('/auth/profile/', data);
    return response.data;
  },
};
