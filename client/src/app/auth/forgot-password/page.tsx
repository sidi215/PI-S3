'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la nouvelle page password-reset
    router.replace('/auth/password-reset');
  }, [router]);

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          Redirection vers la page de réinitialisation...
        </p>
      </div>
    </div>
  );
}
