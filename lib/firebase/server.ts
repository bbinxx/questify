import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Replace with your Firebase service account key path or environment variable
// For production, use an environment variable to store the service account key JSON
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    console.warn('Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
    // You might want to throw an error or handle this case differently in production
  }
}

const adminApp = getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);