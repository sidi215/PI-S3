'use client';

import { Users, Package, TrendingUp, Globe } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '500+',
    label: 'Agriculteurs actifs',
    description: 'Sur toute la Mauritanie',
  },
  {
    icon: Package,
    value: '2,500+',
    label: 'Produits listés',
    description: 'Frais et locaux',
  },
  {
    icon: TrendingUp,
    value: '75%',
    label: 'Augmentation des revenus',
    description: 'Pour nos agriculteurs',
  },
  {
    icon: Globe,
    value: '15+',
    label: 'Régions couvertes',
    description: 'À travers le pays',
  },
];

export function StatsSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
              <p className="text-lg font-semibold mb-2">{stat.label}</p>
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
