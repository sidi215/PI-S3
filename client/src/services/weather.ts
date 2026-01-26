import { api } from '@/lib/api';

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_condition: string;
  recommendations: string[];
}

export interface MauritaniaCity {
  name: string;
  wilaya: string;
  latitude: number;
  longitude: number;
}
export const weatherService = {
  getWeather: async (city: string) => {
    const response = await api.post('/weather/mauritania/', { city });
    return response.data;
  },

  getCities: async () => {
    const response = await api.get('/weather/mauritania/cities/');
    return response.data;
  },

  getCurrentWeather: async (lat: number, lon: number) => {
    const response = await api.get('/weather/current/', {
      params: { lat, lon },
    });
    return response.data;
  },

  getForecast: async (lat: number, lon: number) => {
    const response = await api.get('/weather/forecast/', {
      params: { lat, lon },
    });
    return response.data;
  },
};
