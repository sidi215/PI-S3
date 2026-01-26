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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Leaf } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
    email: z.string().email('Email invalide'),
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    password2: z.string().min(6, 'La confirmation du mot de passe est requise'),
    user_type: z.enum(['farmer', 'buyer']),
    first_name: z.string().min(1, 'Le prénom est requis'),
    last_name: z.string().min(1, 'Le nom est requis'),
    phone_number: z.string().min(1, 'Le numéro de téléphone est requis'),
    wilaya: z.string().optional(),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.password2, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password2'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error } = useAuthStore();
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [userType, setUserType] = useState<'farmer' | 'buyer'>('farmer');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      password2: '',
      user_type: 'farmer',
      first_name: '',
      last_name: '',
      phone_number: '',
      wilaya: '',
      city: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setRegistrationError(null);
    try {
      await registerUser(data);

      // Rediriger selon le type d'utilisateur
      const user = useAuthStore.getState().user;
      if (user?.user_type === 'farmer') {
        router.push('/dashboard/farmer');
      } else if (user?.user_type === 'buyer') {
        router.push('/dashboard/buyer');
      }
    } catch (error: any) {
      setRegistrationError(error.message || "Erreur d'inscription");
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
            Créer un compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Rejoignez la communauté agricole de Mauritanie
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Remplissez les informations pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(registrationError || error) && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {registrationError || error}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    placeholder="Mohamed"
                    disabled={isLoading}
                    {...form.register('first_name')}
                  />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    placeholder="Ahmed"
                    disabled={isLoading}
                    {...form.register('last_name')}
                  />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  placeholder="agriculteur123"
                  autoCapitalize="none"
                  autoComplete="username"
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="nom@exemple.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  disabled={isLoading}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Téléphone</Label>
                <Input
                  id="phone_number"
                  placeholder="+22212345678"
                  disabled={isLoading}
                  {...form.register('phone_number')}
                />
                {form.formState.errors.phone_number && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phone_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_type">Type de compte</Label>
                <Select
                  onValueChange={(value: 'farmer' | 'buyer') => {
                    setUserType(value);
                    form.setValue('user_type', value);
                  }}
                  defaultValue="farmer"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Agriculteur</SelectItem>
                    <SelectItem value="buyer">Acheteur</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.user_type && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.user_type.message}
                  </p>
                )}
              </div>

              {userType === 'farmer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wilaya">Wilaya</Label>
                    <Input
                      id="wilaya"
                      placeholder="Brakna"
                      disabled={isLoading}
                      {...form.register('wilaya')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      placeholder="Aleg"
                      disabled={isLoading}
                      {...form.register('city')}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    disabled={isLoading}
                    {...form.register('password')}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Confirmer le mot de passe</Label>
                  <Input
                    id="password2"
                    placeholder="••••••••"
                    type="password"
                    disabled={isLoading}
                    {...form.register('password2')}
                  />
                  {form.formState.errors.password2 && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password2.message}
                    </p>
                  )}
                </div>
              </div>

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Inscription...' : "S'inscrire"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              Déjà un compte ?{' '}
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
