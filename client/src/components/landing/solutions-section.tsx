'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Brain, Cloud, Droplets, ShoppingCart, TrendingUp } from 'lucide-react';

const solutions = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'Diagnostic intelligent',
    description:
      'Analyse des cultures via photo avec recommandations personnalisées',
  },
  {
    icon: <Cloud className="h-6 w-6" />,
    title: 'Alertes météo',
    description: 'Prévisions adaptées à votre région et alertes en temps réel',
  },
  {
    icon: <Droplets className="h-6 w-6" />,
    title: "Gestion d'irrigation",
    description: "Recommandations pour une utilisation optimale de l'eau",
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: 'Marketplace direct',
    description: 'Vente directe aux consommateurs sans intermédiaires',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Suivi des performances',
    description: 'Analytique des ventes et optimisation des cultures',
  },
];

export function SolutionsSection() {
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
            Une solution
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              {' '}
              complète, simple et locale
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Chaque fonctionnalité de BetterAgri répond à un besoin réel des
            agriculteurs mauritaniens.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 mb-4">
                    {solution.icon}
                  </div>
                  <h3 className="font-bold mb-2">{solution.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {solution.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
