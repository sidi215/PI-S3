'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Droplets,
  TrendingDown,
  Eye,
  Smartphone,
} from 'lucide-react';

const problems = [
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: 'Maladies des cultures',
    description: 'Difficulté à détecter les maladies des cultures à temps',
  },
  {
    icon: <Droplets className="h-6 w-6" />,
    title: "Gestion de l'eau",
    description: "Mauvaise gestion de l'eau dans un contexte de sécheresse",
  },
  {
    icon: <TrendingDown className="h-6 w-6" />,
    title: 'Intermédiaires',
    description: 'Dépendance aux intermédiaires pour vendre les produits',
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: 'Visibilité limitée',
    description: 'Manque de visibilité sur les prix du marché',
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: 'Outils numériques',
    description: "Peu d'outils numériques simples et accessibles",
  },
];

export function ProblemsSection() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Les défis quotidiens des
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
              {' '}
              agriculteurs
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            L'agriculture aujourd'hui est difficile, surtout sans outils adaptés
            aux réalités locales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mb-4">
                    {problem.icon}
                  </div>
                  <h3 className="font-bold mb-2">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {problem.description}
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
