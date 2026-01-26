import type { Metadata } from 'next'
import { Inter, Tajawal } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })
const tajawal = Tajawal({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['arabic'],
  variable: '--font-tajawal'
})

export const metadata: Metadata = {
  title: 'BetterAgri Mauritanie - Plateforme Agricole',
  description: 'Connecter les agriculteurs aux marchés en Mauritanie',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}<Toaster /></main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}