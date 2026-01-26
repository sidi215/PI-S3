'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Brain, Cloud, BarChart3, ShoppingCart, Shield, Smartphone, Droplets, Zap } from 'lucide-react'

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Analyse IA des Cultures",
    description: "Diagnostic intelligent de la santé des plantes avec recommandations personnalisées pour optimiser vos rendements."
  },
  {
    icon: <Cloud className="h-6 w-6" />,
    title: "Météo Prédictive",
    description: "Alertes météo en temps réel et prévisions adaptées spécifiquement à votre région en Mauritanie."
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: "Marketplace Intelligent",
    description: "Vendez vos produits directement aux consommateurs ou achetez des produits frais localement."
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analytique Avancée",
    description: "Suivez vos performances agricoles, ventes et tendances du marché en temps réel."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Sécurité & Confiance",
    description: "Transactions sécurisées, paiements garantis et profils vérifiés pour une expérience fiable."
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Application Mobile",
    description: "Gérez votre ferme, suivez vos cultures et vendez vos produits depuis votre smartphone."
  },
  {
    icon: <Droplets className="h-6 w-6" />,
    title: "Gestion d'Irrigation",
    description: "Optimisez votre consommation d'eau avec des recommandations basées sur l'IA et les conditions météo."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Alertes en Temps Réel",
    description: "Notifications instantanées sur l'état de vos cultures, nouvelles ventes et changements météo."
  }
]

export function FeaturesSection() {
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
            Une plateforme complète pour 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600"> moderniser votre agriculture</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            BetterAgri combine les dernières technologies avec l'expertise agricole pour offrir des solutions adaptées au contexte mauritanien.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="inline-flex p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}