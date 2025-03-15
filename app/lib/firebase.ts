// Firebase configuration and utilities
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Declare global window with ENV property
declare global {
  interface Window {
    ENV: {
      FIREBASE_API_KEY: string;
      FIREBASE_AUTH_DOMAIN: string;
      FIREBASE_DATABASE_URL: string;
      FIREBASE_PROJECT_ID: string;
      FIREBASE_STORAGE_BUCKET: string;
      FIREBASE_MESSAGING_SENDER_ID: string;
      FIREBASE_APP_ID: string;
    };
  }
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: typeof window !== 'undefined' ? window.ENV?.FIREBASE_API_KEY : process.env.FIREBASE_API_KEY,
  authDomain: typeof window !== 'undefined' ? window.ENV?.FIREBASE_AUTH_DOMAIN : process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: typeof window !== 'undefined' ? window.ENV?.FIREBASE_DATABASE_URL : process.env.FIREBASE_DATABASE_URL,
  projectId: typeof window !== 'undefined' ? window.ENV?.FIREBASE_PROJECT_ID : process.env.FIREBASE_PROJECT_ID,
  storageBucket: typeof window !== 'undefined' ? window.ENV?.FIREBASE_STORAGE_BUCKET : process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: typeof window !== 'undefined' ? window.ENV?.FIREBASE_MESSAGING_SENDER_ID : process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: typeof window !== 'undefined' ? window.ENV?.FIREBASE_APP_ID : process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Export the Firebase instances for direct access if needed
export { auth, database }; 