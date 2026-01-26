'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Leaf, Mail, CheckCircle, AlertCircle } from 'lucide-react'

const passwordResetSchema = z.object({
  email: z.string().email('Email invalide'),
})

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>

export default function PasswordResetPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: PasswordResetFormValues) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('http://localhost:8000/api/accounts/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setSentEmail(data.email)
        form.reset()
      } else {
        setError(result.error || 'Erreur lors de la demande de réinitialisation')
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur')
      console.error(err)
    } finally {
      setIsLoading(false)
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
            Mot de passe oublié
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Réinitialiser le mot de passe</CardTitle>
            <CardDescription>
              Nous vous enverrons un lien pour créer un nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    Email envoyé avec succès !
                  </p>
                  <p className="text-sm text-green-700">
                    Nous avons envoyé un lien de réinitialisation à <strong>{sentEmail}</strong>.
                    Vérifiez votre boîte de réception (et vos spams).
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
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      className="pl-10"
                      disabled={isLoading}
                      {...form.register("email")}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>
            )}

            {success && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Le lien est valable 24 heures. Si vous ne recevez pas l'email,
                    vérifiez vos spams ou réessayez.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setSentEmail('')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Faire une nouvelle demande
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Retour à la connexion
              </Link>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Pas encore de compte ?{" "}
              <Link
                href="/auth/register"
                className="underline underline-offset-4 hover:text-primary"
              >
                S'inscrire
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}