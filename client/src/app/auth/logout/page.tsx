'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, LogOut, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export default function LogoutPage() {
  const router = useRouter()
  const { logout, isLoading } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Déconnexion automatique après 3 secondes
    const autoLogout = async () => {
      try {
        setIsLoggingOut(true)
        await logout()
        setSuccess(true)
        
        // Redirection après 2 secondes
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la déconnexion')
        setIsLoggingOut(false)
      }
    }

    autoLogout()
  }, [logout, router])

  const handleManualLogout = async () => {
    try {
      setIsLoggingOut(true)
      setError(null)
      await logout()
      setSuccess(true)
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la déconnexion')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <div className="mx-auto">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Déconnexion
          </h1>
          <p className="text-sm text-muted-foreground">
            Vous êtes en train de vous déconnecter
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Déconnexion en cours</CardTitle>
            <CardDescription>
              Nous sécurisons votre session avant la déconnexion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Vous avez été déconnecté avec succès. Redirection...
                  </span>
                </div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground text-center">
                    {isLoggingOut 
                      ? 'Fermeture de votre session...' 
                      : 'Préparation de la déconnexion...'
                    }
                  </p>
                </div>

                {!isLoggingOut && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      La déconnexion automatique n'a pas fonctionné
                    </p>
                    <Button 
                      onClick={handleManualLogout} 
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Me déconnecter maintenant
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              <Link
                href="/"
                className="underline underline-offset-4 hover:text-primary"
              >
                Retour à l'accueil
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}