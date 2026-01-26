'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sprout, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-900/20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <div className="container relative py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">Cultiver mieux.</span>
                <span className="block">Vendre directement.</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">
                  Vivre dignement.
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl">
                Une plateforme agricole pensée pour les réalités de la
                Mauritanie : diagnostic des cultures, gestion de l'eau et vente
                directe sans intermédiaires.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" asChild className="h-12 px-8 text-base group">
                <Link
                  href="/auth/register?type=farmer"
                  className="flex items-center justify-center gap-2"
                >
                  <Sprout className="h-5 w-5" />
                  Je suis agriculteur
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-8 text-base"
              >
                <Link
                  href="/marketplace"
                  className="flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Acheter des produits locaux
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
              {/* Image */}
              <Image
                src="/Farmer.jpg"
                alt="Agriculteur utilisant la plateforme BetterAgri en Mauritanie"
                fill
                className="object-cover"
                priority
              />

              {/* Overlay sombre */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center p-8 max-w-xl"></div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary/10" />
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-yellow-400/10" />
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-white dark:text-gray-900"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="currentColor"
            opacity=".25"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            fill="currentColor"
            opacity=".5"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
