'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cloud, Sun, CloudRain, Wind, Thermometer } from 'lucide-react'

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  condition: 'sunny' | 'cloudy' | 'rainy'
  location: string
}

interface WeatherCardProps {
  data: WeatherData
}

export function WeatherCard({ data }: WeatherCardProps) {
  const getWeatherIcon = () => {
    switch (data.condition) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />
      case 'rainy':
        return <CloudRain className="h-8 w-8 text-blue-500" />
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />
    }
  }

  const getConditionText = () => {
    switch (data.condition) {
      case 'sunny':
        return 'Ensoleillé'
      case 'cloudy':
        return 'Nuageux'
      case 'rainy':
        return 'Pluvieux'
      default:
        return 'Clair'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Météo</CardTitle>
            <CardDescription>{data.location}</CardDescription>
          </div>
          {getWeatherIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Température</span>
            </div>
            <span className="text-2xl font-bold">{data.temperature}°C</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Humidité</span>
            </div>
            <span className="font-medium">{data.humidity}%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Vent</span>
            </div>
            <span className="font-medium">{data.windSpeed} km/h</span>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Condition</span>
              <span className="font-medium">{getConditionText()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}