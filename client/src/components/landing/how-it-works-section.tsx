'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Settings,
  Brain,
  ShoppingBag,
  TrendingUp,
  Zap,
} from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="h-5 w-5" />,
    title: 'Inscription Rapide',
    description:
      'Créez votre compte en quelques minutes, gratuitement et sans engagement.',
  },
  {
    icon: <Settings className="h-5 w-5" />,
    title: 'Configuration du Profil',
    description:
      'Ajoutez vos informations, localisation et spécifiez vos cultures.',
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'Accès aux Outils IA',
    description:
      "Utilisez nos outils d'analyse pour surveiller la santé de vos cultures.",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    title: 'Vente & Achat',
    description:
      'Mettez en vente vos récoltes ou achetez directement aux producteurs locaux.',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Suivi des Performances',
    description:
      "Suivez vos indicateurs clés et recevez des recommandations d'amélioration.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Optimisation Continue',
    description:
      'Améliorez vos pratiques grâce aux insights générés par notre IA.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Comment
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">
              {' '}
              fonctionne
            </span>{' '}
            notre plateforme ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            En quelques étapes simples, transformez votre façon de cultiver,
            vendre et optimiser votre production agricole.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:pl-8 lg:col-start-2'}`}
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 lg:left-auto lg:right-0 lg:transform-none w-4 h-4 rounded-full bg-green-500 border-4 border-white dark:border-gray-900 z-10 hidden lg:block"
                  style={index % 2 === 0 ? { right: '-2px' } : { left: '-2px' }}
                />

                <Card className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        {step.icon}
                      </div>
                      <div className={index % 2 === 0 ? 'lg:text-right' : ''}>
                        <h3 className="font-bold text-lg mb-2">
                          Étape {index + 1}: {step.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
