// app/dashboard/buyer/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, Package, Heart, History, Star, 
  Search, Filter, MapPin, Truck, CheckCircle, 
  XCircle, Clock, Eye, ShoppingBag, TrendingUp,
  CreditCard, Phone, User,
  Plus, Minus, Trash2, DollarSign, Shield, 
  Calendar, MessageSquare, Users, ThumbsUp, Award, LogOut, 
} from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { marketplaceService, Product, Category } from '@/services/marketplace'
import { ordersService, Order, CreateOrderDto } from '@/services/orders'
import { cartService, Cart, CartItem } from '@/services/cart'
import { wishlistService, WishlistItem } from '@/services/wishlist'
import { paymentService, CreatePaymentDto } from '@/services/payment'
import { reviewService, CreateReviewDto, FarmerReview } from '@/services/reviews'

interface SearchFilters {
  search: string
  category: string
  min_price: string
  max_price: string
  organic: boolean | null
  city: string
  wilaya: string
  ordering: string
}

export default function BuyerDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [myReviews, setMyReviews] = useState<FarmerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null)
const [quantity, setQuantity] = useState(1)
  // Filtres et recherche
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: 'all',
    min_price: '',
    max_price: '',
    organic: null,
    city: 'all',
    wilaya: 'all',
    ordering: '-created_at'
  })

  // États pour les modals
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showReviewDetail, setShowReviewDetail] = useState(false)
  
  // Données des modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedReview, setSelectedReview] = useState<FarmerReview | null>(null)
  const [reviewData, setReviewData] = useState<CreateReviewDto>({
    farmer: 0,
    order: 0,
    rating: 5,
    communication_rating: 5,
    product_quality_rating: 5,
    delivery_rating: 5,
    comment: ''
  })
  const [paymentData, setPaymentData] = useState<CreatePaymentDto>({
    order: 0,
    payment_method: 'cash_on_delivery',
    mobile_number: '',
    mobile_provider: 'maura',
    card_token: ''
  })
  const [shippingData, setShippingData] = useState({
    address: '',
    city: '',
    wilaya: '',
    phone: '',
    notes: ''
  })

  
  // Villes et wilayas Mauritanie
  const MAURITANIA_CITIES = [
    'Nouakchott', 'Nouadhibou', 'Kiffa', 'Rosso', 'Zouérat',
    'Atar', 'Kaédi', 'Aleg', 'Boutilimit', 'Selibaby', 'Tidjikja', 'Néma', 'Aïoun'
  ]

  const MAURITANIA_WILAYAS = [
    'Nouakchott', 'Dakhlet Nouadhibou', 'Tagant', 'Trarza', 'Hodh Ech Chargui',
    'Hodh El Gharbi', 'Assaba', 'Gorgol', 'Brakna', 'Guidimaka', 'Adrar', 'Inchiri'
  ]

  const MOBILE_PROVIDERS = [
    { id: 'maura', name: 'Mauritel' },
    { id: 'chinguetti', name: 'Chinguetti' },
    { id: 'mattel', name: 'Mattel' }
  ]

  useEffect(() => {
    if (!user || user.user_type !== 'buyer') {
      router.push('/auth/login')
      return
    }

    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [
        categoriesData,
        productsData,
        ordersData,
        cartData,
        wishlistData,
        reviewsData
      ] = await Promise.all([
        marketplaceService.getCategories(),
        marketplaceService.getAllProducts(),
        ordersService.getOrders(),
        cartService.getCart(),
        wishlistService.getWishlist(),
        reviewService.getMyReviews()
      ])

      setProducts(normalizeList<Product>(productsData))
      setCategories(normalizeList<Category>(categoriesData))
      setOrders(normalizeList<Order>(ordersData))
      setWishlist(normalizeList<WishlistItem>(wishlistData))
      setCart(normalizeCart(cartData))
      setMyReviews(normalizeList<FarmerReview>(reviewsData))

    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.search) params.search = filters.search
      if (filters.category && filters.category !== 'all') {
        params.category = filters.category
      }
      if (filters.min_price) params.min_price = filters.min_price
      if (filters.max_price) params.max_price = filters.max_price
      if (filters.organic !== null) params.organic = filters.organic
      if (filters.city) params.city = filters.city
      if (filters.wilaya) params.wilaya = filters.wilaya
      if (filters.ordering) params.ordering = filters.ordering

      const filteredProducts = await marketplaceService.getAllProducts(params)
      setProducts(normalizeList<Product>(filteredProducts))
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const normalizeCart = (data: any) => {
    if (!data) return null

    // Cas réponse paginée
    const cart = Array.isArray(data.results) ? data.results[0] : data
    if (!cart) return null

    return {
      ...cart,
      items: Array.isArray(cart.items?.results)
        ? cart.items.results
        : Array.isArray(cart.items)
        ? cart.items
        : [],
    }
  }

  const normalizeList = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
  }
  const handleAddToCartWithQuantity = async (product: Product, qty: number) => {
  try {
    await cartService.addToCart(product.id, qty)
    const updatedCart = await cartService.getCart()
    setCart(normalizeCart(updatedCart))
    alert(`${qty} × ${product.name} ajouté au panier!`)
    setQuantity(1) // Réinitialiser la quantité après ajout
  } catch (error) {
    console.error('Erreur ajout panier:', error)
    alert('Erreur lors de l\'ajout au panier')
  }
}

  const handleAddToCart = async (product: Product) => {
   await handleAddToCartWithQuantity(product, 1)
  }

  const handleUpdateCartItem = async (itemId: number, quantity: number) => {
    try {
      await cartService.updateCartItem(itemId, quantity)
      const updatedCart = await cartService.getCart()
      setCart(normalizeCart(updatedCart))
    } catch (error) {
      console.error('Erreur mise à jour panier:', error)
    }
  }

  const handleRemoveCartItem = async (itemId: number) => {
    try {
      await cartService.removeCartItem(itemId)
      const updatedCart = await cartService.getCart()
      setCart(normalizeCart(updatedCart))
    } catch (error) {
      console.error('Erreur suppression panier:', error)
    }
  }

  const handleAddToWishlist = async (productId: number) => {
    try {
      await wishlistService.toggleWishlist(productId)
      const updatedWishlist = await wishlistService.getWishlist()
      setWishlist(updatedWishlist)
    } catch (error) {
      console.error('Erreur favoris:', error)
    }
  }

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await wishlistService.toggleWishlist(productId)
      setWishlist(wishlist.filter(item => item.product.id !== productId))
    } catch (error) {
      console.error('Erreur suppression favoris:', error)
    }
  }

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Votre panier est vide')
      return
    }

    // Valider les données de livraison
    if (!shippingData.address || !shippingData.city || !shippingData.phone) {
      alert('Veuillez remplir toutes les informations de livraison')
      return
    }

    try {
      const orderData: CreateOrderDto = {
        shipping_address: shippingData.address,
        shipping_city: shippingData.city,
        shipping_country: 'Mauritanie',
        shipping_phone: shippingData.phone,
        notes: shippingData.notes
      }

      const newOrder = await ordersService.createOrder(orderData)
      
      // Passer au paiement
      setSelectedOrder(newOrder)
      setPaymentData({
        ...paymentData,
        order: newOrder.id
      })
      setShowCheckout(false)
      setShowPayment(true)
      
    } catch (error) {
      console.error('Erreur création commande:', error)
      alert('Erreur lors de la création de la commande')
    }
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProductDetail(product)
    setQuantity(1)
    setShowProductDetail(true)
  }

  const handleCloseProductDetail = () => {
    setShowProductDetail(false)
    setSelectedProductDetail(null)
  }

  const handlePayment = async () => {
    try {
      const payment = await paymentService.createPayment(paymentData)
      
      if (payment.status === 'completed') {
        alert('Paiement réussi!')
        setShowPayment(false)
        setSelectedOrder(null)
        
        // Recharger les données
        loadDashboardData()
        
        // Rediriger vers les commandes
        router.push('/dashboard/buyer?tab=orders')
      } else {
        alert('Paiement en attente')
      }
    } catch (error) {
      console.error('Erreur paiement:', error)
      alert('Erreur lors du paiement')
    }
  }

  const handleReview = async () => {
    try {
      await reviewService.createReview(reviewData)
      alert('Merci pour votre avis!')
      setShowReview(false)
      setReviewData({
        farmer: 0,
        order: 0,
        rating: 5,
        communication_rating: 5,
        product_quality_rating: 5,
        delivery_rating: 5,
        comment: ''
      })
      // Recharger les données
      await loadDashboardData()
    } catch (error: any) {
  console.error('Review backend error:', error.response?.data)

  const data = error.response?.data

  if (typeof data === 'string') {
    alert(data)
  } else if (data?.non_field_errors?.length) {
    alert(data.non_field_errors[0])
  } else {
    alert('Erreur lors de l’envoi de l’avis')
  }
}


  }

  const handleCancelOrder = async (orderId: number) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      try {
        await ordersService.cancelOrder(orderId)
        alert('Commande annulée')
        loadDashboardData()
      } catch (error) {
        console.error('Erreur annulation commande:', error)
        alert('Erreur lors de l\'annulation')
      }
    }
  }

const canReviewOrder = (order: Order): boolean => {
  if (order.status !== 'delivered') return false

  const hasReviewed = myReviews.some(
    (review) => review.order === order.id
  )

  return !hasReviewed
}


const handleMarkDelivered = async (orderId: number) => {
  try {
    await ordersService.markAsDelivered(orderId)
    alert('Commande marquée comme livrée')
    await loadDashboardData()
  } catch (error) {
    console.error(error)
    alert("Impossible de marquer la commande comme livrée")
  }
}

  // Obtenir l'agriculteur à évaluer pour une commande
  const getFarmerToReview = (order: Order) => {
    // Pour simplifier, on prend le premier agriculteur de la commande
    const farmerItem = order.items?.find((item: any) => item.farmer || item.product?.farmer)
    return farmerItem?.farmer || farmerItem?.product?.farmer
  }

  // Ouvrir le modal d'avis pour une commande
  const openReviewModal = (order: Order) => {
    const farmer = getFarmerToReview(order)
    if (!farmer) {
      alert('Impossible de trouver l\'agriculteur à évaluer')
      return
    }
    const openReviewModal = (order: Order) => {
  console.log('ORDER ITEMS:', order.items)
}

    
    setSelectedOrder(order)
    setReviewData({
      farmer: farmer.id,
      order: order.id,
      rating: 5,
      communication_rating: 5,
      product_quality_rating: 5,
      delivery_rating: 5,
      comment: ''
    })
    setShowReview(true)
  }

  // Afficher les détails d'un avis
  const viewReviewDetails = (review: FarmerReview) => {
    setSelectedReview(review)
    setShowReviewDetail(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <ShoppingBag className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En traitement',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    }
    return translations[status] || status
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    router.push(`/products/${product.id}`)
  }

  if (loading && products.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header avec recherche et panier */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord acheteur</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.first_name}. Découvrez les meilleurs produits agricoles locaux.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des produits..."
              className="pl-10 w-64"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          {/* Bouton panier avec badge */}
          <Button variant="outline" onClick={() => setShowCart(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Panier
            {cart && cart.total_items > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {cart.total_items}
              </Badge>
            )}
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

      {/* Filtres avancés */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtres avancés</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Masquer' : 'Afficher'} les filtres
            </Button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({...filters, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ville</Label>
                <Select
                  value={filters.city}
                  onValueChange={(value) => setFilters({...filters, city: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les villes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {MAURITANIA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Wilaya</Label>
                <Select
                  value={filters.wilaya}
                  onValueChange={(value) => setFilters({...filters, wilaya: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les wilayas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les wilayas</SelectItem>
                    {MAURITANIA_WILAYAS.map(wilaya => (
                      <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="w-full">
                  Appliquer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      search: '',
                      category: 'all',
                      min_price: '',
                      max_price: '',
                      organic: null,
                      city: 'all',
                      wilaya: 'all',
                      ordering: '-created_at'
                    })
                    handleSearch()
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes actives</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dépenses totales</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(orders.reduce((total, order) => total + parseFloat(order.total_amount), 0))}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favoris</p>
                <p className="text-2xl font-bold">{wishlist.length}</p>
              </div>
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <Heart className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Panier</p>
                <p className="text-2xl font-bold">{cart?.total_items || 0}</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mes avis</p>
                <p className="text-2xl font-bold">{myReviews.length}</p>
              </div>
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                <Star className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="marketplace">Marché</TabsTrigger>
          <TabsTrigger value="orders">Mes commandes</TabsTrigger>
          <TabsTrigger value="reviews">Mes avis</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
        </TabsList>

        {/* Tab: Marketplace */}
        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits disponibles</CardTitle>
              <CardDescription>
                Découvrez les produits frais des agriculteurs locaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => {
                      const isInWishlist = wishlist.some(item => item.product.id === product.id)
                      
                      return (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-square relative cursor-pointer" onClick={() => handleViewProduct(product)}>
                            {product.main_image ? (
                              <img
                                src={product.main_image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  isInWishlist 
                                    ? handleRemoveFromWishlist(product.id)
                                    : handleAddToWishlist(product.id)
                                }}
                              >
                                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                            </div>
                            {product.organic && (
                              <Badge className="absolute top-2 left-2 bg-green-500">
                                Bio
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg line-clamp-1 cursor-pointer" onClick={() => handleViewProduct(product)}>
                                {product.name}
                              </h3>
                              <span className="font-bold text-primary">
                                {formatCurrency(parseFloat(product.price_per_unit))}/{product.unit}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {product.description}
                            </p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {product.farm_location}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs">
                                  {product.average_rating?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-medium">Stock: {product.available_quantity} {product.unit}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewProduct(product)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Détails
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddToCart(product)
                                  }}
                                  disabled={product.available_quantity === 0}
                                >
                                  Panier
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  
                  {products.length > 0 && (
                    <div className="mt-6 text-center">
                      <Button 
                        onClick={() => router.push('/marketplace')}
                        variant="outline"
                      >
                        Voir tous les produits ({products.length})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Orders */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes commandes</CardTitle>
              <CardDescription>
                Suivez l'état de vos commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Vous n'avez pas encore de commandes</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setShowCart(true)}
                  >
                    Voir mon panier
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const canReview = canReviewOrder(order)
                    
                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">
                                  Commande #{order.order_number}
                                </h3>
                                <Badge className={getStatusColor(order.status)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(order.status)}
                                    {translateStatus(order.status)}
                                  </span>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Passée le {formatDate(order.ordered_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{formatCurrency(parseFloat(order.total_amount))}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Order Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="border rounded-lg divide-y mb-4">
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                                      {item.product?.main_image ? (
                                        <img
                                          src={item.product.main_image}
                                          alt={item.product.name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                          }}
                                        />
                                      ) : (
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{item.product?.name || 'Produit'}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.quantity} × {formatCurrency(parseFloat(item.product?.price_per_unit || '0'))}/{item.product?.unit || 'unité'}
                                      </p>
                                      {item.farmer && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <User className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            Agriculteur: {item.farmer?.farm_name || item.farmer?.username}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="font-medium">
                                    {formatCurrency(parseFloat(item.total_price || '0'))}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Order Actions */}
                          <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="text-muted-foreground">Livraison à:</span>{' '}
                                {order.shipping_address}, {order.shipping_city}
                              </p>
                              <p className="text-sm">
                                <span className="text-muted-foreground">Téléphone:</span>{' '}
                                {order.shipping_phone}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
  {order.status === 'pending' && (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => handleCancelOrder(order.id)}
    >
      Annuler
    </Button>
  )}

  {/* 🟡 NOUVEAU BOUTON ICI */}
  {order.status === 'shipped' && (
    <Button
      size="sm"
      variant="default"
      onClick={() => handleMarkDelivered(order.id)}
      className="gap-2"
    >
      <CheckCircle className="h-4 w-4" />
      Marquer comme livrée
    </Button>
  )}

  {canReview && (
    <Button
      size="sm"
      variant="default"
      onClick={() => openReviewModal(order)}
      className="gap-2"
    >
      <Star className="h-4 w-4" />
      Évaluer l'agriculteur
    </Button>
  )}

  {order.status === 'delivered' && !canReview && (
    <Badge variant="outline" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      Déjà évalué
    </Badge>
  )}
</div>

                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mes Avis */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Mes avis sur les agriculteurs</CardTitle>
                  <CardDescription>
                    Tous les avis que vous avez donnés aux agriculteurs
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {myReviews.length} avis
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {myReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Vous n'avez pas encore donné d'avis</h3>
                  <p className="text-muted-foreground mb-4">
                    Évaluez les agriculteurs après la livraison de vos commandes
                  </p>
                  <Button 
                    onClick={() => router.push('/dashboard/buyer?tab=orders')}
                  >
                    Voir mes commandes
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReviews.map((review) => (
                    <Card key={review.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                Avis pour {review.farmer?.farm_name || review.farmer?.username}
                              </h3>
                              <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                {review.rating}/5
                              </Badge>
                              {review.is_verified && (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  Vérifié
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Posté le {formatDate(review.created_at)} • Commande #{review.order}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewReviewDetails(review)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Détails
                            </Button>
                          </div>
                        </div>

                        {/* Commentaire */}
                        <div className="mb-4">
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>

                        {/* Notes détaillées */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <MessageSquare className="h-3 w-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-800">Communication</span>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.communication_rating 
                                      ? 'fill-blue-500 text-blue-500' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <Award className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-medium text-green-800">Qualité</span>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.product_quality_rating 
                                      ? 'fill-green-500 text-green-500' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <Truck className="h-3 w-3 text-purple-600" />
                              <span className="text-xs font-medium text-purple-800">Livraison</span>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.delivery_rating 
                                      ? 'fill-purple-500 text-purple-500' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Info agriculteur */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {review.farmer?.farm_name || review.farmer?.username}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {review.farmer?.city || 'Localisation inconnue'} • 
                              {review.farmer?.average_rating?.toFixed(1) || '0.0'} ⭐
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Favorites */}
        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Mes favoris</CardTitle>
                  <CardDescription>
                    Vos produits sauvegardés
                  </CardDescription>
                </div>
                {wishlist.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (confirm('Vider tous vos favoris ?')) {
                        await wishlistService.clearWishlist()
                        setWishlist([])
                      }
                    }}
                  >
                    Vider la liste
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun produit dans vos favoris</p>
                  <Button 
                    className="mt-4"
                    onClick={() => router.push('/marketplace')}
                  >
                    Découvrir des produits
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="aspect-square relative cursor-pointer" onClick={() => handleProductClick(item.product)}>
                        {item.product.main_image ? (
                          <img
                            src={item.product.main_image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFromWishlist(item.product.id)
                          }}
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 cursor-pointer" onClick={() => handleProductClick(item.product)}>
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.product.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">
                            {formatCurrency(parseFloat(item.product.price_per_unit))}/{item.product.unit}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProductClick(item.product)}
                            >
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToCart(item.product)
                              }}
                            >
                              Acheter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Détail Produit */}
      <Dialog open={showProductDetail} onOpenChange={setShowProductDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProductDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProductDetail.name}</DialogTitle>
                <DialogDescription>
                  {selectedProductDetail.category?.name ?? 'Catégorie inconnue'} • {selectedProductDetail.farm_location}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Images */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {selectedProductDetail.main_image ? (
                      <img
                        src={selectedProductDetail.main_image}
                        alt={selectedProductDetail.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-24 w-24 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {selectedProductDetail.images && selectedProductDetail.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProductDetail.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square rounded overflow-hidden cursor-pointer">
                          <img
                            src={image}
                            alt={`${selectedProductDetail.name} ${index + 1}`}
                            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                            onClick={() => {
                              // Changer l'image principale
                              setSelectedProductDetail({
                                ...selectedProductDetail,
                                main_image: image
                              })
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Produit */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {selectedProductDetail.organic && (
                          <Badge className="bg-green-500">
                            Bio
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {selectedProductDetail.quality_grade}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const isInWishlist = wishlist.some(item => item.product.id === selectedProductDetail.id)
                          isInWishlist 
                            ? handleRemoveFromWishlist(selectedProductDetail.id)
                            : handleAddToWishlist(selectedProductDetail.id)
                        }}
                      >
                        <Heart className={`h-5 w-5 ${
                          wishlist.some(item => item.product.id === selectedProductDetail.id) 
                            ? 'fill-red-500 text-red-500' 
                            : ''
                        }`} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="font-medium">
                          {selectedProductDetail.average_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({selectedProductDetail.total_reviews || 0} avis)
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Package className="h-4 w-4 mr-1" />
                        {selectedProductDetail.available_quantity} {selectedProductDetail.unit} disponible(s)
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(parseFloat(selectedProductDetail.price_per_unit))}/{selectedProductDetail.unit}
                      </p>
                      <p className="text-muted-foreground">
                        Prix par {selectedProductDetail.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{selectedProductDetail.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Récolté le</p>
                          <p className="font-medium">{formatDate(selectedProductDetail.harvest_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Localisation</p>
                          <p className="font-medium">{selectedProductDetail.farm_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Agriculteur */}
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <User className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h4 className="font-semibold">
          
          {selectedProductDetail.farmer?.farm_name && selectedProductDetail.farmer.farm_name.trim() !== '' 
            ? selectedProductDetail.farmer.farm_name
            : selectedProductDetail.farmer?.first_name || 'Agriculteur'}
        </h4>
        <p className="text-sm text-muted-foreground">
          {/* Vérifier si la ville n'est pas vide */}
          {(selectedProductDetail.farmer?.city && selectedProductDetail.farmer.city.trim() !== '') 
            ? selectedProductDetail.farmer.city
            : (selectedProductDetail.farmer?.wilaya && selectedProductDetail.farmer.wilaya.trim() !== '')
              ? selectedProductDetail.farmer.wilaya
              : (selectedProductDetail.farm_location && selectedProductDetail.farm_location.trim() !== '')
                ? selectedProductDetail.farm_location
                : 'Localisation inconnue'}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span>
            {selectedProductDetail.farmer?.rating ? parseFloat(selectedProductDetail.farmer.rating).toFixed(1) : '0.0'}
          </span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
                  </div>

<div className="space-y-4 pt-4 border-t">
  <div className="flex items-center gap-4">
    <div className="flex items-center border rounded-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (quantity > 1) {
            setQuantity(quantity - 1)
          }
        }}
        disabled={quantity <= 1}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="px-4 min-w-[60px] text-center">{quantity}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (quantity < selectedProductDetail.available_quantity) {
            setQuantity(quantity + 1)
          }
        }}
        disabled={quantity >= selectedProductDetail.available_quantity}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    <div className="text-sm text-muted-foreground">
      Max: {selectedProductDetail.available_quantity} {selectedProductDetail.unit}
    </div>
    
    {/* Affichage du prix total */}
    <div className="ml-auto">
      <p className="text-sm text-muted-foreground">Total:</p>
      <p className="text-lg font-bold">
        {formatCurrency(parseFloat(selectedProductDetail.price_per_unit) * quantity)}
      </p>
    </div>
  </div>

  <div className="flex gap-4">
    <Button
      className="flex-1"
      size="lg"
      onClick={() => {
        handleAddToCartWithQuantity(selectedProductDetail, quantity)
        setShowProductDetail(false)
      }}
      disabled={selectedProductDetail.available_quantity === 0}
    >
      <ShoppingCart className="h-5 w-5 mr-2" />
      Ajouter au panier
    </Button>
    <Button
      className="flex-1"
      size="lg"
      variant="outline"
      onClick={() => {
        handleAddToCartWithQuantity(selectedProductDetail, quantity)
        setShowCart(true)
        setShowProductDetail(false)
      }}
      disabled={selectedProductDetail.available_quantity === 0}
    >
      Acheter maintenant
                      </Button>
                    </div>

                    {selectedProductDetail.available_quantity === 0 && (
                      <p className="text-red-500 text-center">Produit temporairement indisponible</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseProductDetail}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Panier */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mon panier</DialogTitle>
            <DialogDescription>
              {cart?.total_items || 0} article(s) dans votre panier
            </DialogDescription>
          </DialogHeader>
      
          {cart && Array.isArray(cart.items) && cart.items.length > 0 ? (
            <>
              <div className="space-y-4">
                
                {cart?.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                        {
                        item.product.main_image ? (
                          <img 
                            src={item.product.main_image} 
                            alt={item.product.name}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(parseFloat(item.product.price_per_unit))}/{item.product.unit}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Agriculteur: {item.product.farmer?.farm_name || 'Inconnu'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateCartItem(item.id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-4">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateCartItem(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold">{formatCurrency(parseFloat(item.total_price))}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCartItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(parseFloat(cart.subtotal))}</span>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCart(false)}>
                    Continuer mes achats
                  </Button>
                  <Button onClick={() => {
                    setShowCart(false)
                    setShowCheckout(true)
                  }}>
                    Procéder au paiement
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Votre panier est vide</p>
              <Button className="mt-4" onClick={() => setShowCart(false)}>
                Découvrir des produits
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finaliser ma commande</DialogTitle>
            <DialogDescription>
              Remplissez vos informations de livraison
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Adresse de livraison *</Label>
              <Input
                id="address"
                value={shippingData.address}
                onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                placeholder="Votre adresse complète"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Select
                  value={shippingData.city}
                  onValueChange={(value) => setShippingData({...shippingData, city: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAURITANIA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="wilaya">Wilaya *</Label>
                <Select
                  value={shippingData.wilaya}
                  onValueChange={(value) => setShippingData({...shippingData, wilaya: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAURITANIA_WILAYAS.map(wilaya => (
                      <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={shippingData.phone}
                onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                placeholder="Votre numéro de téléphone"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={shippingData.notes}
                onChange={(e) => setShippingData({...shippingData, notes: e.target.value})}
                placeholder="Instructions spéciales pour la livraison..."
                rows={3}
              />
            </div>
            
            {cart && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Récapitulatif de la commande</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Articles:</span>
                    <span>{cart.total_items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">{formatCurrency(parseFloat(cart.subtotal))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCheckout(false)
              setShowCart(true)
            }}>
              Retour au panier
            </Button>
            <Button onClick={handleCheckout}>
              Passer au paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Paiement */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paiement</DialogTitle>
            <DialogDescription>
              Sélectionnez votre méthode de paiement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Méthode de paiement *</Label>
              <Select
                value={paymentData.payment_method}
                onValueChange={(value: any) => setPaymentData({...paymentData, payment_method: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_on_delivery">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Paiement à la livraison
                    </div>
                  </SelectItem>
                  <SelectItem value="credit_card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Carte bancaire
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile_money">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Mobile Money
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {paymentData.payment_method === 'mobile_money' && (
              <>
                <div>
                  <Label>Numéro de téléphone *</Label>
                  <Input
                    value={paymentData.mobile_number}
                    onChange={(e) => setPaymentData({...paymentData, mobile_number: e.target.value})}
                    placeholder="Votre numéro Mobile Money"
                  />
                </div>
                <div>
                  <Label>Opérateur</Label>
                  <Select
                    value={paymentData.mobile_provider}
                    onValueChange={(value) => setPaymentData({...paymentData, mobile_provider: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILE_PROVIDERS.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {paymentData.payment_method === 'credit_card' && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Mode test activé</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Utilisez ces cartes de test pour le paiement:
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Visa (succès):</span> 4242 4242 4242 4242
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">MasterCard (succès):</span> 5555 5555 5555 4444
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Visa (échec):</span> 4000 0000 0000 0002
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Token de carte *</Label>
                  <Input
                    value={paymentData.card_token || 'tok_visa'}
                    onChange={(e) => setPaymentData({...paymentData, card_token: e.target.value})}
                    placeholder="tok_visa"
                  />
                </div>
              </div>
            )}
            
            {selectedOrder && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total à payer:</span>
                  <span className="text-xl font-bold">{formatCurrency(parseFloat(selectedOrder.total_amount))}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPayment(false)
              setShowCheckout(true)
            }}>
              Retour
            </Button>
            <Button onClick={handlePayment}>
              {paymentData.payment_method === 'cash_on_delivery' ? 'Confirmer la commande' : 'Payer maintenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Avis */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Évaluer l'agriculteur</DialogTitle>
            <DialogDescription>
              Partagez votre expérience avec l'agriculteur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedOrder && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">Commande #{selectedOrder.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.items?.length || 0} article(s) • {formatCurrency(parseFloat(selectedOrder.total_amount))}
                </p>
              </div>
            )}
            
            <div>
              <Label>Note globale *</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setReviewData({...reviewData, rating: star})}
                  >
                    <Star className={`h-6 w-6 ${star <= reviewData.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {reviewData.rating === 1 && 'Médiocre'}
                {reviewData.rating === 2 && 'Passable'}
                {reviewData.rating === 3 && 'Bon'}
                {reviewData.rating === 4 && 'Très bon'}
                {reviewData.rating === 5 && 'Excellent'}
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Communication</Label>
                <p className="text-xs text-muted-foreground mb-1">Qualité des échanges</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => setReviewData({...reviewData, communication_rating: star})}
                    >
                      <Star className={`h-3 w-3 ${star <= reviewData.communication_rating ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm">Qualité des produits</Label>
                <p className="text-xs text-muted-foreground mb-1">Frais et qualité des produits</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => setReviewData({...reviewData, product_quality_rating: star})}
                    >
                      <Star className={`h-3 w-3 ${star <= reviewData.product_quality_rating ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm">Livraison</Label>
                <p className="text-xs text-muted-foreground mb-1">Respect des délais et condition</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => setReviewData({...reviewData, delivery_rating: star})}
                    >
                      <Star className={`h-3 w-3 ${star <= reviewData.delivery_rating ? 'fill-purple-500 text-purple-500' : 'text-gray-300'}`} />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                placeholder="Partagez votre expérience avec cet agriculteur..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Votre avis aidera d'autres acheteurs à faire leur choix
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReview(false)}>
              Annuler
            </Button>
            <Button onClick={handleReview}>
              Envoyer l'avis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Détail Avis */}
      <Dialog open={showReviewDetail} onOpenChange={setShowReviewDetail}>
        <DialogContent className="max-w-md">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  Avis détaillé
                </DialogTitle>
                <DialogDescription>
                  Votre évaluation de {selectedReview.farmer?.farm_name || selectedReview.farmer?.username}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* En-tête */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {selectedReview.farmer?.farm_name || selectedReview.farmer?.username}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Commande #{selectedReview.order} • {formatDate(selectedReview.created_at)}
                    </p>
                  </div>
                </div>

                {/* Note globale */}
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-4xl font-bold mb-1">{selectedReview.rating}.0</div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= selectedReview.rating 
                            ? 'fill-yellow-500 text-yellow-500' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedReview.rating === 1 && 'Médiocre'}
                    {selectedReview.rating === 2 && 'Passable'}
                    {selectedReview.rating === 3 && 'Bon'}
                    {selectedReview.rating === 4 && 'Très bon'}
                    {selectedReview.rating === 5 && 'Excellent'}
                  </p>
                </div>

                {/* Commentaire */}
                {selectedReview.comment && (
                  <div>
                    <Label>Votre commentaire</Label>
                    <div className="p-3 bg-muted/30 rounded-lg mt-1">
                      <p className="text-sm">{selectedReview.comment}</p>
                    </div>
                  </div>
                )}

                {/* Détails des notes */}
                <div>
                  <Label className="mb-2">Détails des notes</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Communication</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= selectedReview.communication_rating 
                                ? 'fill-blue-500 text-blue-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Qualité des produits</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= selectedReview.product_quality_rating 
                                ? 'fill-green-500 text-green-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Livraison</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= selectedReview.delivery_rating 
                                ? 'fill-purple-500 text-purple-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statut vérifié */}
                {selectedReview.is_verified && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Avis vérifié provenant d'une commande réelle
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDetail(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}