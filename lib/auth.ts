// /lib/auth.ts
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useAppStore } from './store';

export const useFirebaseAuth = () => {
  const { setFirebaseUser, setAuthenticated, setAuthLoading, setUser, setCurrentStep } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      
      if (firebaseUser) {
        // User is signed in
        setFirebaseUser(firebaseUser);
        setAuthenticated(true);
        
        // Fetch user profile from our API
        try {
          const response = await fetch(`/api/users/${firebaseUser.uid}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            
            // Determine appropriate step based on user data
            if (userData.user.preferences?.travelStyle) {
              setCurrentStep('dashboard');
            } else {
              setCurrentStep('onboarding');
            }
          } else {
            // User exists in Firebase but not in our database
            setCurrentStep('onboarding');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setCurrentStep('onboarding');
        }
      } else {
        // User is signed out
        setFirebaseUser(null);
        setAuthenticated(false);
        setUser(null);
        setCurrentStep('onboarding');
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setAuthenticated, setAuthLoading, setUser, setCurrentStep]);
};