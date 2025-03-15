import { User } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { database } from './firebase';
import { Player } from '~/models/player';

// Create or update user profile
export const createOrUpdateUserProfile = async (user: User): Promise<Player> => {
  try {
    const userRef = ref(database, `players/${user.uid}`);
    const snapshot = await get(userRef);
    
    // Check if user profile already exists
    if (snapshot.exists()) {
      // Update lastSeenAt timestamp
      const existingData = snapshot.val() as Player;
      const updatedData: Partial<Player> = {
        lastSeenAt: Date.now()
      };
      
      await set(userRef, { ...existingData, ...updatedData });
      return { ...existingData, ...updatedData } as Player;
    } else {
      // Create new user profile
      const defaultX = Math.floor(Math.random() * 15) + 5; // Random position between 5-20
      const defaultY = Math.floor(Math.random() * 15) + 5;
      const defaultColor = Math.floor(Math.random() * 0xFFFFFF); // Random color
      
      const newUserData: Player = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        x: defaultX,
        y: defaultY,
        color: defaultColor,
        direction: 'down',
        moving: false,
        room: null,
        lastSeenAt: Date.now()
      };
      
      await set(userRef, newUserData);
      return newUserData;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<Player | null> => {
  try {
    const userRef = ref(database, `players/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Player;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}; 