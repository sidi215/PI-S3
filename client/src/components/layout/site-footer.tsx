import Link from 'next/link';
import {
  Leaf,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SiteFooter() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-green-50/50 dark:to-gray-900">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-green-600">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                BetterAgri<span className="text-primary">.mr</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plateforme numérique qui connecte directement les agriculteurs et
              les acheteurs en Mauritanie.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/marketplace"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Marché des produits
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/farmer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Agriculteurs
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/farmer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Météo Agricole
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/farmer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Statistiques
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ressources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Blog Agricole
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Guides de culture
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+222 1234 5678</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@betteragri.mr</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Nouakchott, Mauritanie</span>
              </li>
            </ul>
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link href="/contact">Nous Contacter</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BetterAgri Mauritanie. Tous droits
            réservés.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Développé avec ❤️ pour l'agriculture mauritanienne
          </p>
        </div>
      </div>
    </footer>
  );
}
