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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Package,
  Star,
  ShoppingCart,
  Eye,
  Filter,
  Sparkles,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  Heart,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { marketplaceService, Product, Category } from '@/services/marketplace';
import { useAuthStore } from '@/stores/auth.store';
import { wishlistService, WishlistItem } from '@/services/wishlist';

interface SearchFilters {
  search: string;
  category: string;
  min_price: string;
  max_price: string;
  organic: boolean | null;
  city: string;
  wilaya: string;
  ordering: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Filtres et recherche
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: 'all',
    min_price: '',
    max_price: '',
    organic: null,
    city: 'all',
    wilaya: 'all',
    ordering: '-created_at',
  });

  // Villes et wilayas Mauritanie
  const MAURITANIA_CITIES = [
    'Nouakchott',
    'Nouadhibou',
    'Kiffa',
    'Rosso',
    'Zouérat',
    'Atar',
    'Kaédi',
    'Aleg',
    'Boutilimit',
    'Selibaby',
    'Tidjikja',
    'Néma',
    'Aïoun',
  ];

  const MAURITANIA_WILAYAS = [
    'Nouakchott',
    'Dakhlet Nouadhibou',
    'Tagant',
    'Trarza',
    'Hodh Ech Chargui',
    'Hodh El Gharbi',
    'Assaba',
    'Gorgol',
    'Brakna',
    'Guidimaka',
    'Adrar',
    'Inchiri',
  ];

  /* ===================== LOAD DATA ===================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          marketplaceService.getAllProducts(),
          marketplaceService.getCategories(),
        ]);

        setProducts(
          Array.isArray(productsData?.results)
            ? productsData.results
            : productsData || []
        );

        setCategories(
          Array.isArray(categoriesData?.results)
            ? categoriesData.results
            : categoriesData || []
        );
      } catch (error) {
        console.error('Marketplace error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const normalizeList = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (filters.search) params.search = filters.search;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.organic !== null) params.organic = filters.organic;
      if (filters.city !== 'all') params.city = filters.city;
      if (filters.wilaya !== 'all') params.wilaya = filters.wilaya;

      const data = await marketplaceService.getAllProducts(params);
      setProducts(normalizeList<Product>(data));
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProductDetail(product);
    setShowProductDetail(true);
  };

  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProductDetail(null);
  };
  const handleAddToWishlist = async (productId: number) => {
    try {
      await wishlistService.toggleWishlist(productId);
      const updatedWishlist = await wishlistService.getWishlist();
      setWishlist(updatedWishlist);
    } catch (error) {
      console.error('Erreur favoris:', error);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await wishlistService.toggleWishlist(productId);
      setWishlist(wishlist.filter((item) => item.product.id !== productId));
    } catch (error) {
      console.error('Erreur suppression favoris:', error);
    }
  };

  /* ===================== ACTION ===================== */
  const handleAddToCart = (product: Product) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.user_type !== 'buyer') {
      router.push('/dashboard/buyer');
      return;
    }

    router.push('/dashboard/buyer');
  };

  if (loading && products.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header avec recherche */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marché en ligne</h1>
          <p className="text-lg text-muted-foreground">
            Produits frais directement des agriculteurs
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
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtres avancés</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
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
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
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
                  onValueChange={(value) =>
                    setFilters({ ...filters, city: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les villes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {MAURITANIA_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Wilaya</Label>
                <Select
                  value={filters.wilaya}
                  onValueChange={(value) =>
                    setFilters({ ...filters, wilaya: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les wilayas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les wilayas</SelectItem>
                    {MAURITANIA_WILAYAS.map((wilaya) => (
                      <SelectItem key={wilaya} value={wilaya}>
                        {wilaya}
                      </SelectItem>
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
                      ordering: '-created_at',
                    });
                    handleSearch();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agriculteurs</p>
                <p className="text-2xl font-bold">
                  {[...new Set(products.map((p) => p.farmer?.id))].length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits bio</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.organic).length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En stock</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.available_quantity > 0).length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations pour les utilisateurs non connectés */}
      {!user && (
        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800">
                  Connectez-vous pour acheter
                </h4>
                <p className="text-sm text-blue-600">
                  Vous devez être connecté en tant qu'acheteur pour ajouter des
                  produits à votre panier.
                </p>
              </div>
              <Button size="sm" onClick={() => router.push('/auth/login')}>
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations pour les agriculteurs */}
      {user?.user_type === 'farmer' && (
        <Card className="bg-amber-50 border-amber-200 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800">
                  Réservé aux acheteurs
                </h4>
                <p className="text-sm text-amber-600">
                  Cette fonctionnalité est réservée aux acheteurs.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/dashboard/farmer')}
              >
                Tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun produit trouvé</p>
          </div>
        ) : (
          products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className="aspect-square relative cursor-pointer"
                onClick={() => handleViewProduct(product)}
              >
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
                {product.organic && (
                  <Badge className="absolute top-2 left-2 bg-green-500">
                    Bio
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className="font-semibold text-lg line-clamp-1 cursor-pointer"
                    onClick={() => handleViewProduct(product)}
                  >
                    {product.name}
                  </h3>
                  <span className="font-bold text-primary">
                    {formatCurrency(parseFloat(product.price_per_unit))}/
                    {product.unit}
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
                    <span className="font-medium">
                      Stock: {product.available_quantity} {product.unit}
                    </span>
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
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.available_quantity === 0}
                    >
                      Panier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Détail Produit */}
      <Dialog open={showProductDetail} onOpenChange={setShowProductDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProductDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedProductDetail.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedProductDetail.category?.name ?? 'Catégorie inconnue'}{' '}
                  • {selectedProductDetail.farm_location}
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

                  {selectedProductDetail.images &&
                    selectedProductDetail.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedProductDetail.images
                          .slice(0, 4)
                          .map((image, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded overflow-hidden cursor-pointer"
                            >
                              <img
                                src={image}
                                alt={`${selectedProductDetail.name} ${index + 1}`}
                                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  // Changer l'image principale
                                  setSelectedProductDetail({
                                    ...selectedProductDetail,
                                    main_image: image,
                                  });
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
                          <Badge className="bg-green-500">Bio</Badge>
                        )}
                        <Badge variant="outline">
                          {selectedProductDetail.quality_grade}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const isInWishlist = wishlist.some(
                            (item) =>
                              item.product.id === selectedProductDetail.id
                          );
                          isInWishlist
                            ? handleRemoveFromWishlist(selectedProductDetail.id)
                            : handleAddToWishlist(selectedProductDetail.id);
                        }}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            wishlist.some(
                              (item) =>
                                item.product.id === selectedProductDetail.id
                            )
                              ? 'fill-red-500 text-red-500'
                              : ''
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="font-medium">
                          {selectedProductDetail.average_rating?.toFixed(1) ||
                            '0.0'}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({selectedProductDetail.total_reviews || 0} avis)
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Package className="h-4 w-4 mr-1" />
                        {selectedProductDetail.available_quantity}{' '}
                        {selectedProductDetail.unit} disponible(s)
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(
                          parseFloat(selectedProductDetail.price_per_unit)
                        )}
                        /{selectedProductDetail.unit}
                      </p>
                      <p className="text-muted-foreground">
                        Prix par {selectedProductDetail.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">
                        {selectedProductDetail.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Récolté le
                          </p>
                          <p className="font-medium">
                            {formatDate(selectedProductDetail.harvest_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Localisation
                          </p>
                          <p className="font-medium">
                            {selectedProductDetail.farm_location}
                          </p>
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
                              {selectedProductDetail.farmer?.farm_name ||
                                'Agriculteur'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedProductDetail.farmer?.city ||
                                'Localisation inconnue'}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>
                                {selectedProductDetail.farmer?.average_rating?.toFixed(
                                  1
                                ) || '0.0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
