// app/dashboard/farmer/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Eye,
  MoreVertical,
  Phone,
  AlertCircle,
  ThermometerSun,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Calendar,
  MapPin,
  CloudSun,
  Thermometer,
  Umbrella,
  Activity,
  RefreshCw,
  Bell,
  BellOff,
  Trash2,
  MoreHorizontal,
  X,
  DollarSign,
  Camera,
  Upload,
  AlertTriangle,
  Shield,
  Info,
  Download,
  FileText,
  Star,
  LogOut,
} from 'lucide-react';

import {
  aiDiagnosisService,
  type DiagnosisResult,
} from '@/services/ai-diagnosis';

import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { analyticsService } from '@/services/analytics';
import { marketplaceService } from '@/services/marketplace';
import { ordersService, Order } from '@/services/orders';
import {
  weatherService,
  type WeatherData,
  type MauritaniaCity,
} from '@/services/weather';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  average_rating: number;
  active_products: number;
}

// Interface pour un item de commande
interface OrderItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price_per_unit: string;
    unit: string;
    farmer?: {
      id: number;
      farm_name: string;
    };
  };
  total_price: string;
  farmer?: {
    id: number;
  };
}

// Interface pour une commande avec des items typés
interface FarmerOrder extends Order {
  items?: OrderItem[];
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    total_sales: 0,
    total_orders: 0,
    total_customers: 0,
    average_rating: 0,
    active_products: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<FarmerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour la météo
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [mauritaniaCities, setMauritaniaCities] = useState<MauritaniaCity[]>(
    []
  );
  const [selectedCity, setSelectedCity] = useState('');
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  // États pour les notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // États pour les modals
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FarmerOrder | null>(null);
  const [actionType, setActionType] = useState<
    'accept' | 'reject' | 'ship' | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisImage, setDiagnosisImage] = useState<File | null>(null);
  const [diagnosisResult, setDiagnosisResult] =
    useState<DiagnosisResult | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisHistory, setDiagnosisHistory] = useState<
    Array<{
      id: number;
      date: string;
      disease: string;
      confidence: number;
      imageUrl: string;
    }>
  >([]);
  const [showDiagnosisHistory, setShowDiagnosisHistory] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<
    'tomato' | 'potato' | 'pepper'
  >('tomato');
  const [farmerStats, setFarmerStats] = useState<any>(null);

  useEffect(() => {
    if (!user || user.user_type !== 'farmer') {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
    loadWeatherData();
    loadMauritaniaCities();
    // loadNotifications() // Fonction à implémenter si nécessaire
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [dashboardData, farmerProducts, allOrders] = await Promise.all([
        analyticsService.getDashboard(),
        marketplaceService.getFarmerProducts(),
        ordersService.getOrders(),
      ]);

      setStats(dashboardData.stats);
      setProducts(
        Array.isArray(farmerProducts)
          ? farmerProducts
          : (farmerProducts?.results ?? [])
      );

      // Filtrer les commandes pour ne garder que celles qui concernent cet agriculteur
      const ordersArray = Array.isArray(allOrders)
        ? allOrders
        : (allOrders?.results ?? []);

      const filteredOrders = ordersArray.filter((order: FarmerOrder) => {
        // Vérifier si l'agriculteur a des articles dans cette commande
        return order.items?.some(
          (item: OrderItem) =>
            item.farmer?.id === user?.id ||
            item.product?.farmer?.id === user?.id
        );
      });

      setOrders(filteredOrders);
      setFarmerOrders(filteredOrders); // Commandes spécifiques à l'agriculteur
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir les items d'une commande qui concernent cet agriculteur
  const getFarmerItems = (order: FarmerOrder): OrderItem[] => {
    if (!order.items) return [];

    return order.items.filter(
      (item: OrderItem) =>
        item.farmer?.id === user?.id || item.product?.farmer?.id === user?.id
    );
  };

  // Fonction pour calculer le total d'une commande pour cet agriculteur
  const calculateFarmerTotal = (order: FarmerOrder): number => {
    const farmerItems = getFarmerItems(order);
    return farmerItems.reduce((total, item) => {
      return total + parseFloat(item.total_price || '0');
    }, 0);
  };

  // Fonction pour compter les commandes en attente pour cet agriculteur
  const countPendingOrders = (): number => {
    return farmerOrders.filter((order) => order.status === 'pending').length;
  };

  // Fonction pour calculer les ventes totales pour cet agriculteur
  const calculateFarmerTotalSales = (): number => {
    return farmerOrders.reduce((total, order) => {
      return total + calculateFarmerTotal(order);
    }, 0);
  };

  const loadWeatherData = async (city?: string) => {
    try {
      setWeatherLoading(true);

      if (city) {
        const weather = await weatherService.getWeather(city);
        setWeatherData(weather);
        setSelectedCity(city);
      } else {
        // Par défaut, utiliser la météo actuelle ou Nouakchott
        try {
          const currentWeather = await weatherService.getCurrentWeather();
          setWeatherData(currentWeather);
          setSelectedCity(currentWeather.city || 'Nouakchott');
        } catch (error) {
          console.error('Erreur météo actuelle:', error);
          // Fallback à Nouakchott
          const nouakchottWeather =
            await weatherService.getWeather('Nouakchott');
          setWeatherData(nouakchottWeather);
          setSelectedCity('Nouakchott');
        }
      }
    } catch (error) {
      console.error('Erreur chargement météo:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadMauritaniaCities = async () => {
    try {
      const cities = await weatherService.getCities();
      setMauritaniaCities(cities);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  const handleCityChange = async (city: string) => {
    await loadWeatherData(city);
  };

  // Fonction pour gérer l'acceptation/rejet des commandes
  const handleOrderAction = async (
    orderId: number,
    action: 'accept' | 'reject' | 'ship'
  ) => {
    try {
      setProcessingAction(true);

      let response;
      let endpoint = '';

      switch (action) {
        case 'accept':
          endpoint = 'accept';
          break;
        case 'reject':
          endpoint = 'reject';
          break;
        case 'ship':
          endpoint = 'mark_shipped';
          break;
      }

      response = await fetch(
        `http://localhost:8000/api/orders/orders/${orderId}/${endpoint}/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body:
            action === 'reject'
              ? JSON.stringify({ reason: rejectionReason })
              : undefined,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du traitement');
      }

      alert(
        `Commande ${
          action === 'accept'
            ? 'acceptée'
            : action === 'reject'
              ? 'rejetée'
              : 'marquée comme expédiée'
        } avec succès!`
      );

      // Recharger les données
      await loadDashboardData();

      // Fermer les modals
      setShowActionDialog(false);
      setShowOrderDetail(false);
      setSelectedOrder(null);
      setActionType(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Erreur traitement commande:', error);
      alert(`Erreur: ${error.message || 'Impossible de traiter la commande'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Fonction pour ouvrir le dialog d'action
  const handleOpenActionDialog = (
    order: FarmerOrder,
    type: 'accept' | 'reject' | 'ship'
  ) => {
    setSelectedOrder(order);
    setActionType(type);
    setRejectionReason('');
    setShowActionDialog(true);
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />;
      case 'processing':
        return <AlertCircle className="h-3 w-3" />;
      case 'shipped':
        return <Truck className="h-3 w-3" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Fonction pour traduire le statut
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Acceptée',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return translations[status] || status;
  };

  // Fonction pour obtenir les actions disponibles selon le statut
  const getAvailableActions = (order: FarmerOrder) => {
    const actions = [];

    // Vérifier si l'agriculteur a des articles dans cette commande
    const hasFarmerItems = getFarmerItems(order).length > 0;

    if (!hasFarmerItems) return actions;

    switch (order.status) {
      case 'pending':
        actions.push({
          type: 'accept' as const,
          label: 'Accepter',
          icon: CheckCircle,
          variant: 'default' as const,
        });
        actions.push({
          type: 'reject' as const,
          label: 'Refuser',
          icon: XCircle,
          variant: 'destructive' as const,
        });
        break;

      case 'confirmed':
        actions.push({
          type: 'ship' as const,
          label: 'Marquer comme expédié',
          icon: Truck,
          variant: 'default' as const,
        });
        break;

      case 'processing':
        actions.push({
          type: 'ship' as const,
          label: 'Marquer comme expédié',
          icon: Truck,
          variant: 'default' as const,
        });
        break;
    }

    return actions;
  };

  // Fonction pour obtenir l'icône météo
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();

    if (
      lowerCondition.includes('ensoleillé') ||
      lowerCondition.includes('clair')
    ) {
      return <Sun className="h-5 w-5 text-yellow-500" />;
    } else if (lowerCondition.includes('nuageux')) {
      return <Cloud className="h-5 w-5 text-gray-500" />;
    } else if (lowerCondition.includes('partiellement')) {
      return <CloudSun className="h-5 w-5 text-blue-400" />;
    } else if (
      lowerCondition.includes('pluie') ||
      lowerCondition.includes('précipitation')
    ) {
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    } else if (
      lowerCondition.includes('vent') ||
      lowerCondition.includes('sableux')
    ) {
      return <Wind className="h-5 w-5 text-gray-400" />;
    } else {
      return <Cloud className="h-5 w-5 text-gray-400" />;
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await ordersService.getFarmerStats();
        setFarmerStats(data);
      } catch (error) {
        console.error('Erreur stats agriculteur', error);
      }
    };

    loadStats();
  }, []);

  // Fonction pour obtenir l'icône de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case 'review':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDiagnosisImage(file);
      setShowDiagnosisModal(true);
    }
  };

  const handleDiagnose = async () => {
    if (!diagnosisImage) return;

    try {
      setDiagnosisLoading(true);
      const result = await aiDiagnosisService.diagnosePlant(
        diagnosisImage,
        selectedPlant
      );
      setDiagnosisResult(result);

      // Ajouter à l'historique
      const newDiagnosis = {
        id: Date.now(),
        date: new Date().toISOString(),
        disease: result.disease,
        confidence: result.confidence,
        imageUrl: URL.createObjectURL(diagnosisImage),
      };

      setDiagnosisHistory((prev) => [newDiagnosis, ...prev]);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      alert('Erreur lors du diagnostic. Veuillez réessayer.');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const handleRetakeImage = () => {
    setDiagnosisImage(null);
    setDiagnosisResult(null);
  };

  const handleCloseDiagnosisModal = () => {
    setShowDiagnosisModal(false);
    setDiagnosisImage(null);
    setDiagnosisResult(null);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container py-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-muted-foreground">
                Bienvenue de retour, {user?.first_name}. Voici un aperçu de
                votre activité.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() => router.push('/dashboard/farmer/products/new')}
              >
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
              {/* Bouton Déconnexion */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/auth/logout')}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Grid avec Météo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Carte Météo */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                    <p className="font-semibold">Météo agricole</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWeatherModal(true)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Détails
                  </Button>
                </div>

                {weatherLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : weatherData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          {Math.round(weatherData.temperature)}°C
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {weatherData.city || weatherData.location || '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {getWeatherIcon(weatherData.weather_condition)}
                          <p className="font-medium">
                            {weatherData.weather_condition}
                          </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Droplets className="h-3 w-3 text-blue-500" />
                            <span className="text-xs">
                              {weatherData.humidity}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wind className="h-3 w-3 text-gray-500" />
                            <span className="text-xs">
                              {Math.round(weatherData.wind_speed)} km/h
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommandations */}
                    {weatherData.recommendations &&
                      weatherData.recommendations.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-2">
                            Recommandations:
                          </p>
                          <ul className="space-y-1">
                            {weatherData.recommendations
                              .slice(0, 2)
                              .map((rec, index) => (
                                <li
                                  key={index}
                                  className="text-xs text-muted-foreground flex items-start gap-1"
                                >
                                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Données météo non disponibles
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadWeatherData()}
                      className="mt-2 gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Rafraîchir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Autres stats - MODIFIÉES pour l'agriculteur */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ventes totales
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculateFarmerTotalSales())}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Commandes en attente
                    </p>
                    <p className="text-2xl font-bold">{countPendingOrders()}</p>
                  </div>
                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Produits actifs
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.active_products}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Ajout de l'onglet Météo */}
          <Tabs defaultValue="products" className="space-y-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="products">Mes produits</TabsTrigger>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnostic</TabsTrigger>
              <TabsTrigger value="weather">Météo</TabsTrigger>
            </TabsList>

            {/* Tab: Météo */}
            <TabsContent value="weather" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Carte Météo principale */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Météo agricole</CardTitle>
                        <CardDescription>
                          Informations météorologiques pour votre région
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadWeatherData()}
                        className="gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Actualiser
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {weatherLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    ) : weatherData ? (
                      <div className="space-y-6">
                        {/* En-tête météo */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              {getWeatherIcon(weatherData.weather_condition)}
                              <h3 className="text-3xl font-bold">
                                {Math.round(weatherData.temperature)}°C
                              </h3>
                            </div>
                            <p className="text-xl font-medium">
                              {weatherData.weather_condition}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4" />
                              <span>{weatherData.city}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Dernière mise à jour
                            </p>
                            <p className="font-medium">
                              {new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Statistiques météo */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                              <p className="text-sm text-muted-foreground">
                                Température
                              </p>
                            </div>
                            <p className="text-2xl font-bold">
                              {Math.round(weatherData.temperature)}°C
                            </p>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <p className="text-sm text-muted-foreground">
                                Humidité
                              </p>
                            </div>
                            <p className="text-2xl font-bold">
                              {weatherData.humidity}%
                            </p>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Wind className="h-4 w-4 text-gray-500" />
                              <p className="text-sm text-muted-foreground">
                                Vent
                              </p>
                            </div>
                            <p className="text-2xl font-bold">
                              {Math.round(weatherData.wind_speed)} km/h
                            </p>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="h-4 w-4 text-green-500" />
                              <p className="text-sm text-muted-foreground">
                                Conditions
                              </p>
                            </div>
                            <p className="text-lg font-medium">
                              {weatherData.weather_condition}
                            </p>
                          </div>
                        </div>

                        {/* Recommandations agricoles */}
                        {weatherData.recommendations &&
                          weatherData.recommendations.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-3">
                                Recommandations agricoles
                              </h4>
                              <ul className="space-y-3">
                                {weatherData.recommendations.map(
                                  (rec, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                                    >
                                      <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                        {index + 1}
                                      </div>
                                      <p>{rec}</p>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowWeatherModal(true)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Vue détaillée
                          </Button>
                          <Button
                            onClick={() => loadWeatherData()}
                            className="flex-1"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualiser
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Données météo non disponibles
                        </p>
                        <Button
                          onClick={() => loadWeatherData()}
                          className="mt-4 gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Charger les données météo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sélection de ville et prévisions */}
                <div className="space-y-4">
                  {/* Sélection de ville */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Changer de ville
                      </CardTitle>
                      <CardDescription>
                        Sélectionnez une ville mauritanienne
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {mauritaniaCities.map((city) => (
                          <Button
                            key={city.name}
                            variant={
                              selectedCity === city.name ? 'default' : 'outline'
                            }
                            className="w-full justify-start"
                            onClick={() => handleCityChange(city.name)}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            {city.name}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {city.wilaya}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prévisions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Prévisions</CardTitle>
                      <CardDescription>À venir prochainement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Les prévisions météo seront disponibles bientôt
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Commandes - MODIFIÉ pour afficher seulement les commandes de l'agriculteur */}
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mes commandes</CardTitle>
                  <CardDescription>
                    Gérez les commandes qui contiennent vos produits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {farmerOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Aucune commande contenant vos produits
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {farmerOrders.map((order) => {
                        const availableActions = getAvailableActions(order);
                        const farmerItems = getFarmerItems(order);
                        const farmerTotal = calculateFarmerTotal(order);

                        return (
                          <Card key={order.id} className="overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      Commande #{order.order_number}
                                    </h3>
                                    <Badge
                                      className={getStatusColor(order.status)}
                                    >
                                      <span className="flex items-center gap-1">
                                        {getStatusIcon(order.status)}
                                        {translateStatus(order.status)}
                                      </span>
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Passée le{' '}
                                    {order.ordered_at
                                      ? formatDate(order.ordered_at)
                                      : order.created_at
                                        ? formatDate(order.created_at)
                                        : 'Date inconnue'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <p className="text-xl font-bold">
                                      {formatCurrency(farmerTotal)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {farmerItems.length} article
                                      {farmerItems.length > 1 ? 's' : ''} de
                                      votre ferme
                                    </p>
                                  </div>

                                  {availableActions.length > 0 && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedOrder(order);
                                            setShowOrderDetail(true);
                                          }}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          Voir les détails
                                        </DropdownMenuItem>

                                        {availableActions.map((action) => (
                                          <DropdownMenuItem
                                            key={action.type}
                                            onClick={() =>
                                              handleOpenActionDialog(
                                                order,
                                                action.type
                                              )
                                            }
                                            className={
                                              action.variant === 'destructive'
                                                ? 'text-red-600'
                                                : ''
                                            }
                                          >
                                            <action.icon className="h-4 w-4 mr-2" />
                                            {action.label}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>

                              {/* Liste des produits du fermier */}
                              {farmerItems.length > 0 && (
                                <div className="border rounded-lg divide-y mb-4">
                                  {farmerItems.map((item, index) => (
                                    <div
                                      key={`${item.id}-${index}`}
                                      className="p-3 flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                                          {item.product?.main_image ? (
                                            <img
                                              src={item.product.main_image}
                                              alt={item.product.name}
                                              className="h-full w-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.style.display =
                                                  'none';
                                              }}
                                            />
                                          ) : (
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                          )}
                                        </div>

                                        <div>
                                          <p className="font-medium">
                                            {item.product?.name || 'Produit'}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.quantity} ×{' '}
                                            {formatCurrency(
                                              parseFloat(
                                                item.product?.price_per_unit ||
                                                  '0'
                                              )
                                            )}
                                            /{item.product?.unit || 'unité'}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="font-medium">
                                        {formatCurrency(
                                          parseFloat(item.total_price || '0')
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Informations client */}
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                                <div>
                                  <p className="font-medium">
                                    {order.buyer?.first_name || 'Client'}{' '}
                                    {order.buyer?.last_name || ''}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.shipping_city ||
                                      'Localisation inconnue'}
                                  </p>
                                </div>
                              </div>

                              {/* Actions rapides */}
                              {availableActions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                  {availableActions.map((action) => (
                                    <Button
                                      key={action.type}
                                      variant={
                                        action.variant === 'destructive'
                                          ? 'destructive'
                                          : 'default'
                                      }
                                      size="sm"
                                      onClick={() =>
                                        handleOpenActionDialog(
                                          order,
                                          action.type
                                        )
                                      }
                                      className="gap-2"
                                    >
                                      <action.icon className="h-4 w-4" />
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Produits */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mes produits</CardTitle>
                  <CardDescription>
                    Gérez votre inventaire de produits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Aucun produit
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Commencez par ajouter vos produits agricoles
                      </p>
                      <Button
                        onClick={() =>
                          router.push('/dashboard/farmer/products/new')
                        }
                      >
                        Ajouter mon premier produit
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.available_quantity} {product.unit}{' '}
                              disponible(s) •{' '}
                              {formatCurrency(
                                parseFloat(product.price_per_unit)
                              )}
                              /{product.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/farmer/products/${product.id}/edit`
                                )
                              }
                            >
                              Modifier
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ajoutez le TabContent pour Diagnostic */}
            <TabsContent value="diagnosis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic des maladies des plantes</CardTitle>
                  <CardDescription>
                    Diagnostiquez les maladies de vos plantes avec l'IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Zone de téléchargement */}
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            Diagnostiquer une plante
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Téléchargez une photo de la feuille de votre plante
                            pour diagnostiquer
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="file"
                            id="plant-image"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <label htmlFor="plant-image">
                            <Button asChild>
                              <div className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Télécharger une image
                              </div>
                            </Button>
                          </label>
                          {diagnosisHistory.length > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => setShowDiagnosisHistory(true)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Voir l'historique ({diagnosisHistory.length})
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Formats supportés: JPG, PNG, JPEG • Max: 5MB
                        </p>
                      </div>
                    </div>

                    {/* Instructions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="h-5 w-5" />
                          Comment prendre une bonne photo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                              1
                            </div>
                            <div>
                              <p className="font-medium">Bonne lumière</p>
                              <p className="text-sm text-muted-foreground">
                                Prenez la photo en pleine lumière naturelle
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <div>
                              <p className="font-medium">
                                Focus sur la feuille
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Centrez la feuille malade dans le cadre
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                              3
                            </div>
                            <div>
                              <p className="font-medium">Pas de flou</p>
                              <p className="text-sm text-muted-foreground">
                                Assurez-vous que la photo est nette et claire
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Plantes supportées */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Plantes supportées
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                              🍅
                            </div>
                            <p className="font-medium">Tomate</p>
                            <p className="text-xs text-muted-foreground">
                              10 maladies
                            </p>
                          </div>
                          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2">
                              🥔
                            </div>
                            <p className="font-medium">Pomme de terre</p>
                            <p className="text-xs text-muted-foreground">
                              3 maladies
                            </p>
                          </div>
                          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                              🌶️
                            </div>
                            <p className="font-medium">Poivron</p>
                            <p className="text-xs text-muted-foreground">
                              2 maladies
                            </p>
                          </div>
                          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                              🔄
                            </div>
                            <p className="font-medium">Plus à venir</p>
                            <p className="text-xs text-muted-foreground">
                              Mise à jour régulière
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Analytics - MODIFIÉ pour afficher les statistiques de l'agriculteur */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mes statistiques</CardTitle>
                  <CardDescription>
                    Analysez vos performances de vente
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {!farmerStats ? (
                    <p className="text-muted-foreground">
                      Chargement des statistiques...
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 📦 STATISTIQUES DE VENTE */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Statistiques de vente
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Ventes totales
                              </span>
                              <span className="font-bold">
                                {formatCurrency(farmerStats.total_revenue || 0)}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Commandes totales
                              </span>
                              <span className="font-bold">
                                {farmerStats.total_orders}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Commandes en attente
                              </span>
                              <span className="font-bold">
                                {farmerStats.pending_orders}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Commandes livrées
                              </span>
                              <span className="font-bold">
                                {farmerStats.delivered_orders}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ⭐ ÉVALUATION */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Évaluation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold">
                              {(farmerStats.average_rating ?? 0).toFixed(1)}
                            </div>

                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-yellow-500">
                                  {star <=
                                  Math.round(farmerStats.average_rating ?? 0)
                                    ? '★'
                                    : '☆'}
                                </span>
                              ))}
                            </div>

                            <p className="text-lg font-semibold">
                              {farmerStats.active_products ?? 0}
                            </p>
                          </div>

                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Produits actifs
                            </p>
                            <p className="text-lg font-semibold">
                              {farmerStats?.active_products ?? 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal Météo Complète */}
      <Dialog open={showWeatherModal} onOpenChange={setShowWeatherModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Météo agricole complète</DialogTitle>
            <DialogDescription>
              Informations détaillées sur les conditions météorologiques
            </DialogDescription>
          </DialogHeader>

          {weatherData ? (
            <div className="space-y-6">
              {/* En-tête */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getWeatherIcon(weatherData.weather_condition)}
                      <h2 className="text-3xl font-bold">
                        {Math.round(weatherData.temperature)}°C
                      </h2>
                    </div>
                    <h3 className="text-xl font-semibold">
                      {weatherData.weather_condition}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{weatherData.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Dernière mise à jour
                    </p>
                    <p className="font-medium">
                      {new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <Button
                      onClick={() => loadWeatherData()}
                      size="sm"
                      variant="outline"
                      className="mt-2 gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Actualiser
                    </Button>
                  </div>
                </div>
              </div>

              {/* Conditions principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium">Température</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(weatherData.temperature)}°C
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">Humidité</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {weatherData.humidity}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">Vent</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(weatherData.wind_speed)} km/h
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">Conditions</span>
                    </div>
                    <p className="text-lg font-medium">
                      {weatherData.weather_condition}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommandations agricoles */}
              {weatherData.recommendations &&
                weatherData.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Recommandations agricoles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {weatherData.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </div>
                            <p>{rec}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* Villes disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Autres villes mauritaniennes
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez une ville pour voir sa météo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mauritaniaCities.map((city) => (
                      <Button
                        key={city.name}
                        variant={
                          selectedCity === city.name ? 'default' : 'outline'
                        }
                        onClick={() => {
                          handleCityChange(city.name);
                          setShowWeatherModal(false);
                        }}
                        className="justify-start"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Données météo non disponibles
              </p>
              <Button onClick={() => loadWeatherData()} className="mt-4">
                Charger les données
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowWeatherModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de diagnostic */}
      <Dialog
        open={showDiagnosisModal}
        onOpenChange={handleCloseDiagnosisModal}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Diagnostic des maladies</DialogTitle>
            <DialogDescription>
              Analyse de l'image pour détecter les maladies
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image preview */}
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {diagnosisImage ? (
                  <img
                    src={URL.createObjectURL(diagnosisImage)}
                    alt="Image à diagnostiquer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRetakeImage}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Changer d'image
                </Button>
                <Button
                  onClick={handleDiagnose}
                  disabled={!diagnosisImage || diagnosisLoading}
                  className="flex-1"
                >
                  {diagnosisLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Diagnostiquer
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Résultats */}
            <div className="space-y-4">
              {diagnosisResult ? (
                <>
                  <div
                    className={`p-4 rounded-lg ${
                      diagnosisResult.disease.includes('Healthy')
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {diagnosisResult.disease.includes('Healthy') ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <h3 className="font-semibold text-lg">
                        {diagnosisResult.disease.includes('Healthy')
                          ? 'Plante en bonne santé'
                          : 'Maladie détectée'}
                      </h3>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Diagnostic:</span>{' '}
                      {diagnosisResult.disease}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm">Confiance:</span>
                      <Badge
                        className={
                          diagnosisResult.confidence > 80
                            ? 'bg-green-500'
                            : diagnosisResult.confidence > 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }
                      >
                        {diagnosisResult.confidence.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>

                  {!diagnosisResult.disease.includes('Healthy') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Recommandations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Texte principal */}
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">
                              {diagnosisResult.recommendation}
                            </p>
                          </div>

                          {/* Infos traitement */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Traitement
                                </p>
                                <p className="text-sm font-medium">
                                  {diagnosisResult.treatment_duration}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
                              <Droplets className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Produits
                                </p>
                                <p className="text-sm font-medium">
                                  {diagnosisResult.products}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions dynamiques */}
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">
                              Actions recommandées:
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {diagnosisResult.actions?.map(
                                (action: string, index: number) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    {action}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {diagnosisImage
                      ? 'Cliquez sur "Diagnostiquer" pour analyser l\'image'
                      : 'Téléchargez une image pour commencer le diagnostic'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDiagnosisModal}>
              Fermer
            </Button>
            {diagnosisResult && (
              <Button
                onClick={() => {
                  // Fonction pour enregistrer le diagnostic
                  alert("Diagnostic enregistré dans l'historique");
                  handleCloseDiagnosisModal();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Enregistrer le diagnostic
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal historique des diagnostics */}
      <Dialog
        open={showDiagnosisHistory}
        onOpenChange={setShowDiagnosisHistory}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historique des diagnostics</DialogTitle>
            <DialogDescription>Vos diagnostics précédents</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {diagnosisHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun diagnostic dans l'historique
                </p>
              </div>
            ) : (
              diagnosisHistory.map((diagnosis) => (
                <Card key={diagnosis.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={diagnosis.imageUrl}
                          alt="Diagnostic"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{diagnosis.disease}</h4>
                          <Badge
                            className={
                              diagnosis.disease.includes('Healthy')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {diagnosis.disease.includes('Healthy')
                              ? 'Sain'
                              : 'Malade'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(diagnosis.date).toLocaleDateString()} •
                          Confiance: {diagnosis.confidence.toFixed(2)}%
                        </p>
                        <Button size="sm" variant="outline">
                          Voir les détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDiagnosisHistory(false)}
            >
              Fermer
            </Button>
            {diagnosisHistory.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Vider tout l'historique ?")) {
                    setDiagnosisHistory([]);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Vider l'historique
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals existants pour les commandes */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept'
                ? 'Accepter la commande'
                : actionType === 'reject'
                  ? 'Refuser la commande'
                  : 'Marquer comme expédié'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept'
                ? 'Êtes-vous sûr de vouloir accepter cette commande ?'
                : actionType === 'reject'
                  ? 'Veuillez indiquer la raison du refus :'
                  : "Confirmez-vous l'expédition de cette commande ?"}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Raison du refus *</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Stock insuffisant, produit indisponible..."
                  rows={4}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Le client sera notifié du refus avec cette raison.</p>
              </div>
            </div>
          )}

          {selectedOrder && actionType !== 'reject' && (
            <div className="p-4 border rounded-lg">
              <p className="font-medium mb-2">Récapitulatif:</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Commande #{selectedOrder.id}</p>
                <p>
                  Montant pour vos produits:{' '}
                  {formatCurrency(calculateFarmerTotal(selectedOrder))}
                </p>
                <p>Client: {selectedOrder.buyer?.first_name || 'Client'}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false);
                setActionType(null);
                setRejectionReason('');
              }}
              disabled={processingAction}
            >
              Annuler
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={() => handleOrderAction(selectedOrder!.id, actionType!)}
              disabled={
                processingAction ||
                (actionType === 'reject' && !rejectionReason.trim())
              }
            >
              {processingAction
                ? 'Traitement...'
                : actionType === 'accept'
                  ? 'Accepter'
                  : actionType === 'reject'
                    ? 'Refuser'
                    : 'Marquer comme expédié'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
