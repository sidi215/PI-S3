'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Token manquant')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`http://localhost:8000/api/auth/verify-email/${token}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()

        if (response.ok) {
          setSuccess(true)
        } else {
          setError(result.error || 'Erreur lors de la vérification de l\'email')
        }
      } catch (err: any) {
        setError('Erreur de connexion au serveur')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [token])

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <div className="mx-auto">
              <Leaf className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Vérification de l'email
            </h1>
            <p className="text-sm text-muted-foreground">
              Nous vérifions votre adresse email...
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground text-center">
                  Vérification en cours, veuillez patienter
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <div className="mx-auto">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Vérification de l'email
          </h1>
          <p className="text-sm text-muted-foreground">
            {success ? 'Votre email a été vérifié' : 'Échec de la vérification'}
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {success ? 'Email vérifié' : 'Échec de la vérification'}
            </CardTitle>
            <CardDescription>
              {success 
                ? 'Votre adresse email a été confirmée avec succès'
                : 'Nous n\'avons pas pu vérifier votre adresse email'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-800">
                      Félicitations ! Votre email a été vérifié
                    </p>
                    <p className="text-sm text-green-700">
                      Votre compte est maintenant entièrement activé. Vous pouvez vous connecter et profiter de toutes les fonctionnalités.
                    </p>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-medium text-sm">Prochaines étapes</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      Connectez-vous à votre compte
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      Complétez votre profil
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      Découvrez nos fonctionnalités
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md bg-destructive/15 p-4 flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      Échec de la vérification
                    </p>
                    <p className="text-sm text-destructive">
                      {error || 'Le lien de vérification est invalide ou a expiré.'}
                    </p>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <h3 className="font-medium text-sm">Solutions possibles</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5"></div>
                      <span>Le lien peut avoir expiré (valable 24h)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5"></div>
                      <span>Vérifiez que vous avez utilisé le bon lien</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5"></div>
                      <span>Essayez de vous connecter - votre compte pourrait déjà être vérifié</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {success ? (
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Se connecter
                </Link>
              </Button>
            ) : (
              <div className="space-y-3 w-full">
                <Button asChild variant="default" className="w-full">
                  <Link href="/auth/register">
                    <Mail className="h-4 w-4 mr-2" />
                    Créer un nouveau compte
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login">
                    Essayer de se connecter
                  </Link>
                </Button>
              </div>
            )}
            
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