'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Leaf, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'L\'ancien mot de passe est requis'),
  new_password: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirm_password: z.string().min(1, 'La confirmation est requise'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Les nouveaux mots de passe ne correspondent pas",
  path: ["confirm_password"],
})

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  async function onSubmit(data: ChangePasswordFormValues) {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('http://localhost:8000/api/auth/change-password/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
        },
        body: JSON.stringify({
          old_password: data.old_password,
          new_password: data.new_password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        form.reset()
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(result.old_password?.[0] || result.error || 'Erreur lors du changement de mot de passe')
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
            Changer le mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Mettez à jour votre mot de passe pour sécuriser votre compte
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Modification du mot de passe</CardTitle>
            <CardDescription>
              Entrez votre mot de passe actuel et choisissez-en un nouveau
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    Mot de passe modifié avec succès !
                  </p>
                  <p className="text-sm text-green-700">
                    Redirection vers votre tableau de bord...
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
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="old_password"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    {...form.register("old_password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.old_password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.old_password.message}
                  </p>
                )}
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
                <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
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

              <Button className="w-full" type="submit" disabled={isLoading || success}>
                {isLoading ? "Modification..." : "Modifier le mot de passe"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              <Link
                href="/dashboard"
                className="underline underline-offset-4 hover:text-primary"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}