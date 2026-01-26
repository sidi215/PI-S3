'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Leaf, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react'

const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  new_password: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirm_password: z.string().min(1, 'La confirmation est requise'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"],
})

type ResetConfirmFormValues = z.infer<typeof resetConfirmSchema>

export default function PasswordResetConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    }
  }, [searchParams])

  const form = useForm<ResetConfirmFormValues>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: {
      token: token || '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Mettre à jour le token dans le form quand il est chargé
  useEffect(() => {
    if (token) {
      form.setValue('token', token)
    }
  }, [token, form])

  async function onSubmit(data: ResetConfirmFormValues) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('http://localhost:8000/api/accounts/password-reset/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: data.token,
          new_password: data.new_password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        form.reset()
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setError(result.error || 'Erreur lors de la réinitialisation du mot de passe')
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <div className="mx-auto">
              <Leaf className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Lien invalide
            </h1>
            <p className="text-sm text-muted-foreground">
              Le lien de réinitialisation est invalide ou a expiré
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="rounded-md bg-destructive/15 p-4 flex items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-destructive">
                    Token manquant ou invalide
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Veuillez faire une nouvelle demande de réinitialisation.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/password-reset">
                    Nouvelle demande
                  </Link>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground text-center w-full">
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Retour à la connexion
                </Link>
              </div>
            </CardFooter>
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
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez un nouveau mot de passe pour votre compte
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau mot de passe</CardTitle>
            <CardDescription>
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    Mot de passe réinitialisé avec succès !
                  </p>
                  <p className="text-sm text-green-700">
                    Redirection vers la page de connexion...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {!success && (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token de réinitialisation</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="token"
                      value={token}
                      readOnly
                      className="pl-10 bg-muted"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ce token a été automatiquement rempli depuis le lien
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...form.register("new_password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 caractères
                  </p>
                  {form.formState.errors.new_password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...form.register("confirm_password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.confirm_password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Retour à la connexion
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}