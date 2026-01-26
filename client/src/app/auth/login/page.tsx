'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setLoginError(null);
    try {
      await login(data.username, data.password);

      // Rediriger selon le type d'utilisateur
      const user = useAuthStore.getState().user;
      if (user?.user_type === 'farmer') {
        router.push('/dashboard/farmer');
      } else if (user?.user_type === 'buyer') {
        router.push('/dashboard/buyer');
      } else {
        router.push('/dashboard/admin');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Erreur de connexion');
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Entrez vos identifiants pour accéder à votre compte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accédez à votre compte</CardTitle>
            <CardDescription>
              Connectez-vous pour gérer vos produits, commandes et plus encore
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(loginError || error) && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {loginError || error}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  placeholder="votre_utilisateur"
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...form.register('username')}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground">
              <Link
                href="/auth/forgot-password"
                className="underline underline-offset-4 hover:text-primary"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
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
  );
}
