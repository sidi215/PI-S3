'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserPlus, ShoppingCart, Truck, Star } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: '1. Inscription',
    description:
      "Créez votre compte gratuitement en tant qu'agriculteur ou acheteur.",
  },
  {
    icon: ShoppingCart,
    title: '2. Explorez le marché',
    description:
      'Parcourez les produits disponibles ou listez vos propres produits.',
  },
  {
    icon: Truck,
    title: '3. Commandez/Livrez',
    description: 'Passez vos commandes en ligne ou organisez vos livraisons.',
  },
  {
    icon: Star,
    title: '4. Évaluez',
    description: 'Donnez votre avis et construisez votre réputation.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Quatre étapes simples pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="border-0 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
