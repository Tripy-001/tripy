"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

const SignupPage = () => {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, error, setError, authLoading } = useAppStore();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      await signUpWithEmail(formData.email, formData.password, formData.name);
      router.push("/onboarding");
    } catch (err: any) {
      let msg = err?.message || "";
      if (msg.toLowerCase().includes("name")) setFieldErrors((prev) => ({ ...prev, name: msg }));
      else if (msg.toLowerCase().includes("email")) setFieldErrors((prev) => ({ ...prev, email: msg }));
      else if (msg.toLowerCase().includes("password")) setFieldErrors((prev) => ({ ...prev, password: msg }));
      else setError("Failed to sign up. " + msg);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      router.push("/onboarding");
    } catch (err: any) {
      setError("Failed to sign up with Google. " + (err?.message || ""));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-10 flex flex-col gap-6">
        <h2 className="text-3xl font-bold mb-2 text-center text-foreground">Sign Up for Tripy</h2>
        <form onSubmit={handleSignup} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              ref={nameRef}
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              className={`h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70 text-base bg-background ${fieldErrors.name ? "border-red-500" : "border-input"}`}
              autoComplete="name"
            />
            {fieldErrors.name && <span className="text-red-500 text-xs pt-1">{fieldErrors.name}</span>}
          </div>
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
              autoComplete="new-password"
            />
            {fieldErrors.password && <span className="text-red-500 text-xs pt-1">{fieldErrors.password}</span>}
          </div>
          {error && <div className="text-red-500 text-sm pt-2 text-center">{error}</div>}
          <Button type="submit" className="w-full theme-bg theme-bg-hover text-primary-foreground h-12 rounded-lg text-base font-semibold" disabled={authLoading}>
            Sign Up
          </Button>
        </form>
        <div className="my-2 flex items-center justify-center">
          <span className="text-muted-foreground text-xs">or</span>
        </div>
        <Button onClick={handleGoogleSignup} variant="outline" className="w-full h-12 border-2 rounded-lg flex items-center justify-center gap-2 text-base font-semibold" type="button" disabled={authLoading}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/signin" className="text-primary underline">Sign In</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
