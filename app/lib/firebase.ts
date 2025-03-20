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
  push,
  serverTimestamp,
  update
} from 'firebase/database';
import { Player, getPresenceStatus } from '~/models/player';

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

/**
 * Set up presence tracking for the current user
 * This will update the lastSeenAt timestamp when the user connects
 * and set up an onDisconnect handler to update lastLeftAt when they disconnect
 * @param userId The current user's ID
 */
export const setupPresenceTracking = (userId: string) => {
  if (!userId) return;
  
  const userRef = ref(database, `players/${userId}`);
  const lastSeenAtRef = ref(database, `players/${userId}/lastSeenAt`);
  const lastLeftAtRef = ref(database, `players/${userId}/lastLeftAt`);
  
  // When the user connects, update their lastSeenAt timestamp
  const updateOnlineStatus = () => {
    // Get the current player data first to preserve other fields
    onValue(userRef, (snapshot) => {
      const currentData = snapshot.exists() ? snapshot.val() : {};
      
      // First update lastSeenAt
      const now = Date.now();
      set(lastSeenAtRef, now);
      
      // Then set up onDisconnect handler to update lastLeftAt when they disconnect
      onDisconnect(lastLeftAtRef).set(Date.now());
    }, { onlyOnce: true });
  };
  
  // Call the update function immediately
  updateOnlineStatus();
  
  // Return a cleanup function
  return () => {
    // Update lastLeftAt when the component unmounts
    set(lastLeftAtRef, Date.now());
  };
};

/**
 * Update lastSeenAt timestamp for a user
 * This should be called when the user performs actions like:
 * - Moving
 * - Sending messages
 * - Any other activity that should indicate presence
 */
export const updateLastSeen = (userId: string) => {
  const userRef = ref(database, `players/${userId}/lastSeenAt`);
  return set(userRef, Date.now());
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
      
      // Count only players that are considered online
      let activeCount = 0;
      Object.values(playersData).forEach((player) => {
        const status = getPresenceStatus(player);
        if (status === 'online') {
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

/**
 * Subscribe to all player updates
 * @param callback Function to call with the updated players map
 * @returns Unsubscribe function
 */
export const subscribeToPlayers = (callback: (players: Record<string, Player>) => void) => {
  const playersRef = ref(database, 'players');
  return onValue(playersRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};

/**
 * Update player position and movement state
 * @param uid Player's user ID
 * @param x Grid X position
 * @param y Grid Y position
 * @param direction Direction player is facing
 * @param moving Whether player is currently moving
 */
export const updatePlayerPosition = (
  uid: string,
  x: number,
  y: number,
  direction: string,
  moving: boolean
) => {
  const playerRef = ref(database, `players/${uid}`);
  return update(playerRef, { x, y, direction, moving });
};

/**
 * Update player skin
 * @param uid Player's user ID
 * @param skin Skin number (01-20)
 */
export const updatePlayerSkin = (uid: string, skin: string) => {
  const playerRef = ref(database, `players/${uid}`);
  return update(playerRef, { skin });
};

// DO NOT import these elsewhere
export { database, push, onValue, ref, set, update, serverTimestamp };