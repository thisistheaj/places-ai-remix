import { database, ref, onValue, push, serverTimestamp } from './firebase';
import type { Message, GlobalMessage, DirectMessage } from '../models/message';

// Firebase paths
export const PATHS = {
  global: 'messages/global',
  dm: (uid1: string, uid2: string) => {
    // Sort UIDs to ensure consistent path regardless of sender/receiver order
    const [first, second] = [uid1, uid2].sort();
    return `messages/dm/${first}_${second}`;
  }
} as const;

// Generate a consistent color for a user based on their ID
export function getUserColor(userId: string): string {
  // List of pleasant, distinct colors
  const colors = [
    '#FF6B6B', // coral red
    '#4ECDC4', // turquoise
    '#45B7D1', // sky blue
    '#96CEB4', // sage
    '#FFEEAD', // cream
    '#D4A5A5', // dusty rose
    '#9B59B6', // purple
    '#3498DB', // blue
    '#F1C40F', // yellow
    '#2ECC71', // green
  ];
  
  // Hash the user ID to get a consistent index
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}

// Subscribe to messages from a path
export function subscribeToMessages(path: string, callback: (messages: Message[]) => void) {
  const messagesRef = ref(database, path);
  
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      messages.push({
        id: childSnapshot.key!,
        uid: message.uid,
        text: message.text,
        sender: message.sender,
        senderId: message.uid, // Use uid as senderId for backward compatibility
        timestamp: message.timestamp || 0,
        type: message.type
      });
    });
    
    // Sort messages by timestamp
    messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    callback(messages);
  });
  
  return unsubscribe;
}

// Send a global message
export async function sendGlobalMessage(text: string, senderId: string, senderName: string): Promise<void> {
  const message: Omit<GlobalMessage, 'id'> = {
    uid: senderId,
    senderId,
    sender: senderName,
    text,
    timestamp: Date.now(),
    type: 'global'
  };
  
  await push(ref(database, PATHS.global), message);
}

// Send a DM
export async function sendDirectMessage(
  text: string,
  senderId: string,
  senderName: string,
  receiverId: string
): Promise<void> {
  const message: Omit<DirectMessage, 'id'> = {
    uid: senderId,
    senderId,
    sender: senderName,
    text,
    timestamp: Date.now(),
    type: 'dm',
    targetId: receiverId
  };
  
  await push(ref(database, PATHS.dm(senderId, receiverId)), message);
}

// Update user's last seen timestamp
export async function updatePresence(userId: string) {
  const userRef = ref(database, `players/${userId}/lastSeenAt`);
  await push(userRef, serverTimestamp());
}

// Get list of users with DM history
export function subscribeToDmUsers(userId: string, callback: (users: { id: string; name: string }[]) => void) {
  const dmRef = ref(database, 'messages/dm');
  
  const unsubscribe = onValue(dmRef, (snapshot) => {
    const users = new Set<string>();
    
    snapshot.forEach((childSnapshot) => {
      const [user1, user2] = childSnapshot.key!.split('_');
      if (user1 === userId) users.add(user2);
      if (user2 === userId) users.add(user1);
    });
    
    // Get user names from players data
    const playersRef = ref(database, 'players');
    onValue(playersRef, (playersSnapshot) => {
      const dmUsers = Array.from(users).map(id => {
        const playerData = playersSnapshot.child(id).val();
        return {
          id,
          name: playerData?.name || 'Anonymous'
        };
      });
      callback(dmUsers);
    });
  });
  
  return unsubscribe;
}

// Search all users
export function subscribeToUserSearch(searchTerm: string, currentUserId: string, callback: (users: { id: string; name: string }[]) => void) {
  const playersRef = ref(database, 'players');
  
  const unsubscribe = onValue(playersRef, (snapshot) => {
    const users: { id: string; name: string }[] = [];
    const lowerSearch = searchTerm.toLowerCase();
    
    snapshot.forEach((childSnapshot) => {
      const id = childSnapshot.key!;
      if (id === currentUserId) return; // Skip current user
      
      const playerData = childSnapshot.val();
      const name = playerData?.name || 'Anonymous';
      
      // Only include users whose names match the search term
      if (searchTerm === '' || name.toLowerCase().includes(lowerSearch)) {
        users.push({ id, name });
      }
    });
    
    // Sort by name
    users.sort((a, b) => a.name.localeCompare(b.name));
    callback(users);
  });
  
  return unsubscribe;
} 