🤖 AGENTS.md: Firebase Auth & Firestore Implementation Guide
This document outlines the step-by-step process for implementing Firebase Authentication and Cloud Firestore for the AI Trip Planner application. Following these instructions will ensure a secure, scalable, and correctly configured backend foundation.

🎯 Objective
To set up user authentication via Google Sign-In and establish the Firestore database with the correct data models and security rules. The entire logic will be handled within the Next.js application, using API routes for secure backend operations.

Prerequisites
A Google account.

An existing Next.js project.

Node.js and npm/yarn installed.

🔑 Section 1: Firebase Project Setup & Configuration
This is the foundational step. All services (Auth, Firestore) live inside a Firebase project.

1.1. Create the Firebase Project
Go to the Firebase Console.

Click "Add project" and give it a name (e.g., ai-trip-planner-hackathon).

Continue through the setup steps. You can choose whether or not to enable Google Analytics.

Once your project is created, you will land on the project dashboard.

1.2. Create a Web App
On the project dashboard, click the web icon (</>) to add a new web app.

Give the app a nickname (e.g., Trip Planner Web App) and click "Register app".

Firebase will provide you with a firebaseConfig object. Copy these keys.

1.3. Configure Environment Variables
Guardrail: Never commit API keys or secret credentials directly into your code. Use environment variables to keep them secure.

In the root of your Next.js project, create a file named .env.local.

Paste the configuration keys from Firebase into this file, prefixing each with NEXT_PUBLIC_:

Plaintext

# .env.local

NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
1.4. Initialize Firebase SDK
Create a utility file to initialize and export Firebase services.

Create /lib/firebase.js:

JavaScript

// /lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
👤 Section 2: Firebase Authentication
Now, let's enable users to sign in.

2.1. Enable Google Sign-In Provider
In the Firebase Console, go to Build > Authentication.

Click the "Get started" button.

In the "Sign-in method" tab, select Google from the list of providers.

Enable the provider and select a project support email.

Click Save.

2.2. Implement Client-Side Auth Logic
It's a best practice to use React Context to manage the user's authentication state throughout the application.

Create /context/AuthContext.js:

JavaScript

// /context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // **IMPORTANT**: After successful sign-in, call our API to create a user profile in Firestore
      await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      });
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, loading, signInWithGoogle, logout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
Wrap your application with the provider in _app.js:

JavaScript

// /pages/_app.js
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
Now you can use the useAuth hook in any component to get the user state and call sign-in functions.

🗂️ Section 3: Firestore Database Setup
With users authenticating, we need a place to store their data.

3.1. Create Firestore Database
In the Firebase Console, go to Build > Firestore Database.

Click "Create database".

Start in Test mode for the hackathon (this allows open reads/writes). We will secure this in Section 5.

Choose a location for your database (e.g., asia-south1 for India).

Click Enable.

3.2. Data Models (For Reference)
This confirms the data structures we will be creating via our API routes.

users Collection: users/{userId}

JSON

{
  "uid": "string", "email": "string", "displayName": "string", "photoURL": "string", "createdAt": "Timestamp", "preferences": {}, "stats": {}
}
trips Collection: trips/{tripId}

JSON

{
  "userId": "string", "title": "string", "destination": {}, "dates": {}, "status": "string", "visibility": "string", "budget": {}, "createdAt": "Timestamp", "updatedAt": "Timestamp"
}
days Subcollection: trips/{tripId}/days/{dayId}

JSON

{
  "dayNumber": "number", "date": "Timestamp", "theme": "string", "activities": [/* array of activity maps */]
}
places Collection: places/{placeId} (For pre-populated data)

JSON

{
  "name": "string", "type": "string", "location": {}, "redditData": {}, "weatherPatterns": {}
}
Guardrail: Always use Firestore's native data types like Timestamp and GeoPoint where applicable. They provide powerful querying capabilities (e.g., "find all trips in December") that you cannot achieve with simple strings or numbers.

⚙️ Section 4: API Route Implementation
This is the secure bridge between your client-side actions and your database.

4.1. Create User Profile API Route
This API route is called immediately after a user signs in. Its job is to create their profile in Firestore if one doesn't already exist.

Create /pages/api/auth/signin.js:

JavaScript

// /pages/api/auth/signin.js
import { db } from '../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { uid, email, displayName, photoURL } = req.body;

    // Guardrail: Basic server-side validation
    if (!uid || !email) {
      return res.status(400).json({ message: 'Missing required fields: uid and email.' });
    }

    const userDocRef = doc(db, 'users', uid);

    const newUserProfile = {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: serverTimestamp(),
      // Default preferences and stats for a new user
      preferences: {
        travelStyle: [], interests: [], budgetRange: "medium", preferredWeather: ["any"]
      },
      stats: {
        tripsCreated: 0, placesVisited: 0
      }
    };

    // Use `setDoc` with `merge: true` to create or update.
    // This is an "upsert" operation. It won't overwrite existing data
    // on subsequent logins, which is exactly what we want.
    await setDoc(userDocRef, newUserProfile, { merge: true });

    res.status(200).json({ message: 'User profile synchronized successfully.' });

  } catch (error) {
    console.error('API Error /api/auth/signin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
🔒 Section 5: Firestore Security Rules
This is the most important guardrail. Security rules protect your data from unauthorized access. The test mode rules are dangerously insecure for a real application.

In the Firebase Console, go to Firestore Database > Rules.

Replace the existing rules (allow read, write: if request.time < timestamp.date(2025, 9, 13);) with the following:

Plaintext

// Firestore Security Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Rule for the 'users' collection
    // A user can read/write ONLY their own document.
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    // Rule for the 'trips' collection
    // A user can create a trip.
    // They can only read/update/delete trips where their UID matches the 'userId' field in the document.
    // Anyone can read a trip if its visibility is set to 'public'.
    match /trips/{tripId} {
      allow create: if request.auth != null;
      allow read: if resource.data.visibility == 'public' || (request.auth != null && request.auth.uid == resource.data.userId);
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;

        // Rule for the 'days' subcollection
        // Inherits permissions from the parent trip document.
        match /days/{dayId} {
            allow read, write: if get(/databases/$(database)/documents/trips/$(tripId)).data.userId == request.auth.uid;
        }
    }

    // Rule for the 'places' collection
    // For our app, this data is public and curated by us.
    // All authenticated users can read, but no one can write.
    match /places/{placeId} {
        allow read: if request.auth != null;
        allow write: if false; // Disable client-side writes completely
    }
  }
}
Click Publish. Your database is now secured.

✅ Implementation Checklist
[ ] Firebase project created.

[ ] Web app registered and firebaseConfig keys obtained.

[ ] .env.local file created with Firebase keys.

[ ] /lib/firebase.js file created and initialized.

[ ] Google Sign-In enabled in Firebase Auth console.

[ ] AuthContext created and wrapped around _app.js.

[ ] Client-side sign-in/sign-out functions implemented and tested.

[ ] Firestore database created.

[ ] /api/auth/signin API route created and deployed.

[ ] Firestore security rules updated and published.