'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Home, ShoppingCart, Sprout, Search, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-900/20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-1/3 right-10 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="container relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header with logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 dark:text-green-400">
              <Sprout className="h-8 w-8" />
              BetterAgri
            </Link>
          </motion.div>

          {/* Main 404 content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            {/* 404 number with animation */}
            <div className="relative inline-block mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute -top-6 -left-6"
              >
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              </motion.div>
              
              <div className="text-9xl font-bold bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                404
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">
              Oups ! Page non trouvée
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La page que vous cherchez semble avoir été déplacée, supprimée 
              ou n'existe peut-être pas. Ne vous inquiétez pas, 
              nous pouvons vous aider à retrouver votre chemin.
            </p>

            {/* Search suggestion */}
            <Card className="max-w-md mx-auto mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Essayez de rechercher :</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Vérifiez l'orthographe de l'URL</p>
                  <p>• Utilisez la barre de recherche en haut de la page</p>
                  <p>• Naviguez via le menu principal</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              size="lg"
              className="h-12 px-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour en arrière
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Page d'accueil
              </Link>
            </Button>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-center text-lg font-semibold mb-6">
              Voici quelques pages qui pourraient vous intéresser :
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/marketplace">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex p-3 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 mb-4 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold mb-2">Marketplace</h4>
                    <p className="text-sm text-muted-foreground">
                      Achetez des produits agricoles frais directement aux producteurs
                    </p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/auth/login">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                      <Sprout className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold mb-2">Espace Agriculteur</h4>
                    <p className="text-sm text-muted-foreground">
                      Gérez vos cultures et vendez vos produits
                    </p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/about">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                      <Search className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold mb-2">À propos</h4>
                    <p className="text-sm text-muted-foreground">
                      Découvrez notre mission et notre équipe
                    </p>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </motion.div>

          {/* Support contact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-12 pt-8 border-t"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Vous ne trouvez toujours pas ce que vous cherchez ?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/contact">
                  Contacter le support
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">ou</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/help">
                  Consulter l'aide
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BetterAgri Mauritanie. Tous droits réservés.
        </p>
      </footer>
    </div>
  )
}