'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2, Mail, MapPin, Users, CheckCircle2, XCircle } from 'lucide-react';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string;
    tripId: string;
    tripName: string;
    token: string;
    existingUserId: string | null;
    expiresAt?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const tripId = searchParams.get('tripId');

    if (!token || !tripId) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/accept?token=${token}&tripId=${tripId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load invitation');
        }
        const data = await res.json();
        setInvitation(data.invitation);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load invitation';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [searchParams]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !firebaseUser) return;

    try {
      setAccepting(true);
      const token = await firebaseUser.getIdToken();
      
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: invitation.token,
          tripId: invitation.tripId,
          userId: firebaseUser.uid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      toast.success('Invitation accepted! Redirecting to trip...');
      setTimeout(() => {
        router.push(`/trip/${invitation.tripId}`);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      await signUpWithEmail(email, password, name);
      // After signup, automatically accept invitation
      if (invitation) {
        await handleAcceptInvitation();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      toast.error(errorMessage);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      // After signin, automatically accept invitation
      if (invitation) {
        await handleAcceptInvitation();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is already signed in and email matches
  if (firebaseUser && firebaseUser.email?.toLowerCase() === invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Trip Invitation
            </CardTitle>
            <CardDescription>
              You've been invited to collaborate on a trip
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{invitation.tripName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{invitation.email}</span>
              </div>
            </div>
            <Button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is signed in but email doesn't match
  if (firebaseUser && firebaseUser.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Mismatch</CardTitle>
            <CardDescription>
              This invitation was sent to a different email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Invitation sent to:</p>
              <p className="font-medium">{invitation.email}</p>
              <p className="text-sm text-muted-foreground mt-2">Your account:</p>
              <p className="font-medium">{firebaseUser.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                auth.signOut();
                router.refresh();
              }}
              className="w-full"
            >
              Sign Out and Use Different Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not signed in - show sign up/sign in options
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Trip Invitation</CardTitle>
          <CardDescription>
            Sign in or create an account to join this trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">You've been invited to collaborate on:</p>
            <p className="font-medium text-lg">{invitation.tripName}</p>
            <p className="text-sm text-muted-foreground mt-2">Invitation sent to:</p>
            <p className="font-medium">{invitation.email}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  // After Google sign in, check if we can accept
                  setTimeout(async () => {
                    const user = auth.currentUser;
                    if (user && user.email?.toLowerCase() === invitation.email.toLowerCase()) {
                      await handleAcceptInvitation();
                    }
                  }, 1000);
                } catch (err) {
                  toast.error('Failed to sign in with Google');
                }
              }}
              variant="outline"
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Sign in with the email <strong>{invitation.email}</strong> to accept this invitation
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => router.push(`/signup?email=${encodeURIComponent(invitation.email)}&invitation=${invitation.token}&tripId=${invitation.tripId}`)}
                className="text-primary hover:underline"
              >
                Sign up here
              </button>
            </p>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Already have an account?{' '}
              <button
                onClick={() => router.push(`/signin?email=${encodeURIComponent(invitation.email)}&invitation=${invitation.token}&tripId=${invitation.tripId}`)}
                className="text-primary hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

