'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const products = [
  {
    id: 1,
    name: 'Tomates Fraîches',
    farmer: 'Mohamed Ahmed',
    price: '450 MRU/kg',
    rating: 4.5,
    category: 'Légumes',
    organic: true,
  },
  {
    id: 2,
    name: 'Oignons Locaux',
    farmer: 'Aminata Sow',
    price: '300 MRU/kg',
    rating: 4.2,
    category: 'Légumes',
    organic: true,
  },
  {
    id: 3,
    name: 'Carottes',
    farmer: 'Ibrahim Ba',
    price: '400 MRU/kg',
    rating: 4.7,
    category: 'Légumes',
    organic: false,
  },
  {
    id: 4,
    name: 'Miel Naturel',
    farmer: 'Bees of Mauritania',
    price: '2,500 MRU/kg',
    rating: 4.9,
    category: 'Autres',
    organic: true,
  },
];

export function FeaturedProducts() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Produits en vedette
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Découvrez nos produits agricoles les plus populaires
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-lg flex items-center justify-center">
                <span className="text-4xl">
                  {product.name.includes('Tomates') && '🍅'}
                  {product.name.includes('Oignons') && '🧅'}
                  {product.name.includes('Carottes') && '🥕'}
                  {product.name.includes('Miel') && '🍯'}
                </span>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.organic && (
                    <Badge className="bg-green-600">Bio</Badge>
                  )}
                </div>
                <CardDescription>{product.farmer}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {product.rating}
                    </span>
                  </div>
                  <span className="font-bold text-primary">
                    {product.price}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter au panier
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
