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
import { 
  getDatabase, 
  ref, 
  onValue, 
  DataSnapshot, 
  onDisconnect, 
  set, 
  serverTimestamp,
  remove,
  update
} from 'firebase/database';

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

// Player tracking functions
interface Player {
  lastSeenAt?: number;
  direction?: string;
  moving?: boolean;
  x?: number;
  y?: number;
  [key: string]: any;
}

/**
 * Set up presence tracking for the current user
 * This will update the lastSeenAt timestamp when the user connects
 * and set up an onDisconnect handler to remove it when they disconnect
 * @param userId The current user's ID
 */
export const setupPresenceTracking = (userId: string) => {
  if (!userId) return;
  
  const userRef = ref(database, `players/${userId}`);
  const lastSeenAtRef = ref(database, `players/${userId}/lastSeenAt`);
  
  // When the user connects, update their lastSeenAt timestamp
  const updateOnlineStatus = () => {
    // Get the current player data first to preserve other fields
    onValue(userRef, (snapshot) => {
      const currentData = snapshot.exists() ? snapshot.val() : {};
      
      // Update the lastSeenAt timestamp
      update(userRef, {
        lastSeenAt: Date.now()
      });
      
      // Set up an onDisconnect handler to remove the lastSeenAt property when they disconnect
      // This will trigger when the user closes their browser tab
      onDisconnect(lastSeenAtRef).remove();
    }, { onlyOnce: true });
  };
  
  // Set up a heartbeat to update the lastSeenAt timestamp periodically
  // This ensures the user is still considered "connected" even if they're inactive
  const heartbeatInterval = setInterval(() => {
    update(userRef, {
      lastSeenAt: Date.now()
    });
  }, 60000); // Update every minute
  
  // Call the update function immediately
  updateOnlineStatus();
  
  // Return a cleanup function
  return () => {
    clearInterval(heartbeatInterval);
    // Remove lastSeenAt when the component unmounts
    remove(lastSeenAtRef);
  };
};

/**
 * Subscribe to connected players count
 * @param callback Function to call with the updated player count
 * @returns Unsubscribe function
 */
export const subscribeToConnectedPlayers = (
  callback: (count: number) => void
) => {
  const playersRef = ref(database, 'players');
  
  const unsubscribe = onValue(playersRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const playersData = snapshot.val() as Record<string, Player>;
      
      // Count only players that have the lastSeenAt property set
      let activeCount = 0;
      Object.values(playersData).forEach((player) => {
        if (player.lastSeenAt) {
          activeCount++;
        }
      });
      
      callback(activeCount);
    } else {
      callback(0);
    }
  });
  
  return unsubscribe;
};

// Export the Firebase instances for direct access if needed
export { auth, database, ref, onValue }; 