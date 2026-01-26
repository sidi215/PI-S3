'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Mohamed Ahmed',
    role: 'Agriculteur, Trarza',
    content:
      "Grâce à BetterAgri, j'ai augmenté mes ventes de 40% en seulement 3 mois. Je peux maintenant vendre directement aux consommateurs sans intermédiaires.",
    rating: 5,
    avatar: 'MA',
  },
  {
    name: 'Aminata Sow',
    role: 'Acheteuse, Nouakchott',
    content:
      'Je trouve toujours des produits frais et de qualité à des prix compétitifs. Le service de livraison est excellent !',
    rating: 5,
    avatar: 'AS',
  },
  {
    name: 'Ibrahim Ba',
    role: 'Agriculteur, Guidimakha',
    content:
      "La plateforme est très intuitive. Les outils d'analytics m'aident à mieux planifier ma production selon la demande.",
    rating: 4,
    avatar: 'IB',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ce que disent nos utilisateurs
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Découvrez comment BetterAgri transforme l'agriculture en Mauritanie
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{testimonial.name}</CardTitle>
                    <CardDescription>{testimonial.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground italic">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
