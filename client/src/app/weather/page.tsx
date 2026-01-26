'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { WeatherCard } from '@/components/weather/weather-card'
import { WeatherForecast } from '@/components/weather/weather-forecast'
import { WeatherAlerts } from '@/components/weather/weather-alerts'
import { AgriculturalRecommendations } from '@/components/weather/agricultural-recommendations'
import { MapWidget } from '@/components/weather/map-widget'
import { Search, MapPin, Cloud, Sun, CloudRain, Wind } from 'lucide-react'

const cities = [
  { id: 1, name: 'Nouakchott', wilaya: 'Nouakchott', lat: 18.0735, lon: -15.9582 },
  { id: 2, name: 'Nouadhibou', wilaya: 'Dakhlet Nouadhibou', lat: 20.9425, lon: -17.0382 },
  { id: 3, name: 'Kiffa', wilaya: 'Hodh Ech Chargui', lat: 16.6200, lon: -11.4022 },
  { id: 4, name: 'Rosso', wilaya: 'Trarza', lat: 16.5128, lon: -15.8086 },
  { id: 5, name: 'Zouérat', wilaya: 'Tiris Zemmour', lat: 22.7350, lon: -12.4789 },
  { id: 6, name: 'Atar', wilaya: 'Adrar', lat: 20.5167, lon: -13.0500 },
]

const currentWeather = {
  location: 'Nouakchott',
  temperature: 32,
  feels_like: 35,
  humidity: 65,
  pressure: 1013,
  wind_speed: 15,
  wind_direction: 'NE',
  weather_condition: 'Ensoleillé',
  weather_icon: '01d',
  sunrise: '06:45',
  sunset: '19:20',
  precipitation: 0,
  uv_index: 11,
  recommendations: [
    '🌡️ Températures élevées : Arroser tôt le matin ou en soirée',
    '💧 Humidité modérée : Bonne pour les cultures',
    '💨 Vent modéré : Sécuriser les installations légères',
  ]
}

export default function WeatherPage() {
  const [selectedCity, setSelectedCity] = useState(cities[0])

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Météo Agricole</h1>
        <p className="text-muted-foreground">
          Prévisions météo et recommandations agricoles pour la Mauritanie
        </p>
      </div>

      {/* City Selector */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Sélectionner une ville :</span>
          </div>
          <Select
            value={selectedCity.id.toString()}
            onValueChange={(value) => {
              const city = cities.find(c => c.id === parseInt(value))
              if (city) setSelectedCity(city)
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Choisir une ville" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id.toString()}>
                  {city.name} ({city.wilaya})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Cloud className="h-3 w-3" />
            Mis à jour il y a 10 min
          </Badge>
          <Button variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
        </div>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="current">Actuel</TabsTrigger>
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
        </TabsList>

        {/* Current Weather */}
        <TabsContent value="current" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Weather Card */}
            <div className="lg:col-span-2">
              <WeatherCard weather={currentWeather} />
            </div>

            {/* Map */}
            <div>
              <MapWidget city={selectedCity} />
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Humidité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{currentWeather.humidity}%</div>
                  <CloudRain className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div 
                    className="h-full rounded-full bg-blue-500" 
                    style={{ width: `${currentWeather.humidity}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{currentWeather.wind_speed} km/h</div>
                  <Wind className="h-8 w-8 text-green-500" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Direction: {currentWeather.wind_direction}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  UV Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{currentWeather.uv_index}</div>
                  <Sun className="h-8 w-8 text-yellow-500" />
                </div>
                <Badge 
                  className="mt-2"
                  variant={currentWeather.uv_index > 8 ? "destructive" : "default"}
                >
                  {currentWeather.uv_index > 8 ? "Élevé" : "Modéré"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lever/Coucher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lever</span>
                    <span className="font-medium">{currentWeather.sunrise}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Coucher</span>
                    <span className="font-medium">{currentWeather.sunset}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecast */}
        <TabsContent value="forecast">
          <WeatherForecast city={selectedCity} />
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <WeatherAlerts />
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations">
          <AgriculturalRecommendations weather={currentWeather} />
        </TabsContent>
      </Tabs>
    </div>
  )
}