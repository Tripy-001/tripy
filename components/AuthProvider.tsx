'use client';

import { useFirebaseAuth } from '@/lib/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useFirebaseAuth();
  
  return <>{children}</>;
}