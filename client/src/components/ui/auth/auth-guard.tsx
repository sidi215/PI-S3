'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: 'farmer' | 'buyer' | 'admin';
}

export function AuthGuard({ children, requiredUserType }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (
      !isLoading &&
      user &&
      requiredUserType &&
      user.user_type !== requiredUserType
    ) {
      // Rediriger vers le dashboard approprié
      if (user.user_type === 'farmer') {
        router.push('/dashboard/farmer');
      } else if (user.user_type === 'buyer') {
        router.push('/dashboard/buyer');
      }
    }
  }, [isLoading, user, router, requiredUserType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (requiredUserType && user.user_type !== requiredUserType)) {
    return null;
  }

  return <>{children}</>;
}
