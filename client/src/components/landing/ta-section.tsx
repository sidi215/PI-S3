'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
      <div className="container">
        <div className="text-center text-white max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Prêt à transformer votre agriculture ?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Rejoignez des centaines d'agriculteurs qui utilisent déjà notre
            plateforme pour augmenter leurs revenus et développer leur activité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 gap-2"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10"
              >
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
