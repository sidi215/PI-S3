'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sprout, ShoppingCart, Users } from 'lucide-react';

const audiences = [
  {
    icon: <Sprout className="h-8 w-8" />,
    title: 'Agriculteurs',
    description:
      "Améliorez vos rendements, économisez l'eau et vendez sans intermédiaires pour augmenter vos revenus.",
    features: [
      'Diagnostic IA des cultures',
      "Gestion optimisée de l'eau",
      'Vente directe aux consommateurs',
      'Suivi des performances',
    ],
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: <ShoppingCart className="h-8 w-8" />,
    title: 'Acheteurs',
    description:
      'Achetez des produits frais, locaux et traçables directement auprès des producteurs de votre région.',
    features: [
      'Produits frais et locaux',
      'Traçabilité complète',
      'Prix équitables',
      'Livraison ou retrait',
    ],
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Coopératives & ONG',
    description:
      'Suivez la production agricole et soutenez les agriculteurs locaux avec des outils adaptés.',
    features: [
      'Suivi de production',
      'Analytique collective',
      'Gestion des membres',
      'Rapports détaillés',
    ],
    color: 'from-blue-500 to-cyan-500',
  },
];

export function ForWhoSection() {
  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Une plateforme pour tous les
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              {' '}
              acteurs agricoles
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Que vous soyez agriculteur, consommateur ou organisation, BetterAgri
            a des outils pour vous.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${audience.color} text-white mb-4`}
                  >
                    {audience.icon}
                  </div>
                  <CardTitle className="text-xl">{audience.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    {audience.description}
                  </p>
                  <ul className="space-y-2">
                    {audience.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div
                          className={`h-2 w-2 rounded-full bg-gradient-to-br ${audience.color}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
