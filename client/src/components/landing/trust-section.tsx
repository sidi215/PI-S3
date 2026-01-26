'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Lock, Shield, CheckCircle, Package } from 'lucide-react';

const trustFactors = [
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Données protégées',
    description: 'Vos données agricoles sont sécurisées et confidentielles',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Paiements sécurisés',
    description: 'Transactions bancaires garanties et sans risque',
  },
  {
    icon: <CheckCircle className="h-6 w-6" />,
    title: 'Profils vérifiés',
    description: 'Tous les agriculteurs et acheteurs sont authentifiés',
  },
  {
    icon: <Package className="h-6 w-6" />,
    title: 'Suivi des commandes',
    description: 'Traçabilité complète de chaque transaction',
  },
];

export function TrustSection() {
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
            Une plateforme
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {' '}
              fiable et sécurisée
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Nous mettons tout en œuvre pour garantir la sécurité et la confiance
            de nos utilisateurs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustFactors.map((factor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-4">
                    {factor.icon}
                  </div>
                  <h3 className="font-bold mb-2">{factor.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {factor.description}
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
