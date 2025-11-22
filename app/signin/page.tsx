"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

const SigninPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithEmail, signInWithGoogle, error, setError, authLoading, user, firebaseUser } = useAppStore();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Check for invitation params
  const invitationEmail = searchParams.get('email');
  const invitationToken = searchParams.get('invitation');
  const tripId = searchParams.get('tripId');

  useEffect(() => {
    if (invitationEmail) {
      setFormData(prev => ({ ...prev, email: invitationEmail }));
    }
  }, [invitationEmail]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
  setError(null);
  setFieldErrors({});
  setLoading(true);
    try {
      await signInWithEmail(formData.email, formData.password);
      // Wait for Zustand user to update (profile fetch)
      const waitForProfile = async () => {
        let tries = 0;
        while (!user && tries < 20) {
          await new Promise(res => setTimeout(res, 100));
          tries++;
        }
      };
      await waitForProfile();
      setLoading(false);
      
      // If there's an invitation, accept it after signin
      if (invitationToken && tripId && firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              token: invitationToken,
              tripId,
              userId: firebaseUser.uid,
            }),
          });

          if (res.ok) {
            toast.success('Invitation accepted! Redirecting to trip...');
            setTimeout(() => {
              router.push(`/trip/${tripId}`);
            }, 1500);
            return;
          }
        } catch (err) {
          console.error('Error accepting invitation:', err);
          // Continue to dashboard/onboarding even if invitation acceptance fails
        }
      }
      
      // If user has preferences, go to dashboard, else onboarding
      if (user?.preferences?.travelStyle) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("email")) setFieldErrors((prev) => ({ ...prev, email: msg }));
      else if (msg.toLowerCase().includes("password")) setFieldErrors((prev) => ({ ...prev, password: msg }));
      else setError("Failed to sign in. " + msg);
      // Do NOT clear formData or reset input fields on error
    }
  };

  const handleGoogleSignin = async () => {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await signInWithGoogle();
      // Wait for Zustand user to update (profile fetch)
      const waitForProfile = async () => {
        let tries = 0;
        while (!user && tries < 20) {
          await new Promise(res => setTimeout(res, 100));
          tries++;
        }
      };
      await waitForProfile();
      setLoading(false);
      
      // If there's an invitation, accept it after Google signin
      if (invitationToken && tripId && firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              token: invitationToken,
              tripId,
              userId: firebaseUser.uid,
            }),
          });

          if (res.ok) {
            toast.success('Invitation accepted! Redirecting to trip...');
            setTimeout(() => {
              router.push(`/trip/${tripId}`);
            }, 1500);
            return;
          }
        } catch (err) {
          console.error('Error accepting invitation:', err);
          // Continue to dashboard/onboarding even if invitation acceptance fails
        }
      }
      
      if (user?.preferences?.travelStyle) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    } catch (err: unknown) {
      setLoading(false);
      setError("Failed to sign in with Google. " + (err?.message || ""));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      {(authLoading || loading) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )}
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-10 flex flex-col gap-6">
        <h2 className="text-3xl font-bold mb-2 text-center text-foreground">Sign In to Tripy</h2>
        <form onSubmit={handleSignin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              ref={emailRef}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              className={`h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70 text-base bg-background ${fieldErrors.email ? "border-red-500" : "border-input"}`}
              autoComplete="email"
            />
            {fieldErrors.email && <span className="text-red-500 text-xs pt-1">{fieldErrors.email}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              ref={passwordRef}
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              className={`h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70 text-base bg-background ${fieldErrors.password ? "border-red-500" : "border-input"}`}
              autoComplete="current-password"
            />
            {fieldErrors.password && <span className="text-red-500 text-xs pt-1">{fieldErrors.password}</span>}
          </div>
          {error && <div className="text-red-500 text-sm pt-2 text-center">{error}</div>}
          <Button type="submit" className="w-full theme-bg theme-bg-hover text-primary-foreground h-12 rounded-lg text-base font-semibold" disabled={authLoading || loading}>
            Sign In
          </Button>
        </form>
        <div className="my-2 flex items-center justify-center">
          <span className="text-muted-foreground text-xs">or</span>
        </div>
        <Button onClick={handleGoogleSignin} variant="outline" className="w-full h-12 border-2 rounded-lg flex items-center justify-center gap-2 text-base font-semibold" type="button" disabled={authLoading || loading}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-primary underline">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

const SigninPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-10 flex flex-col gap-6">
          <h2 className="text-3xl font-bold mb-2 text-center text-foreground">Sign In to Tripy</h2>
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <SigninPageContent />
    </Suspense>
  );
};

export default SigninPage;
