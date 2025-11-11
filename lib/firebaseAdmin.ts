// Server-side Firebase Admin initialization and export
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the admin app only once
if (!getApps().length) {
  // Prefer explicit credentials from environment variables (works on Vercel)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      : undefined);

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  try {
    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      initializeApp({ credential: cert(parsed) });
    } else if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      // Fallback to Application Default Credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS path)
      initializeApp({ credential: applicationDefault() });
    }
  } catch (error) {
    // As a last resort, try default initialization (may work locally with gcloud auth)
    initializeApp();
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
