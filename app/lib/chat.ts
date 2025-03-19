import { database, ref, onValue, push, serverTimestamp } from './firebase';
import type { Message, GlobalMessage, DirectMessage } from '../models/message';

// Firebase paths
export const PATHS = {
  global: 'messages/global',
  dm: (id1: string, id2: string) => `messages/dm/${[id1, id2].sort().join('_')}`
} as const;

// Subscribe to messages from a path
export function subscribeToMessages(path: string, callback: (messages: Message[]) => void) {
  const msgRef = ref(database, path);
  return onValue(msgRef, snapshot => {
    const messages: Message[] = [];
    snapshot.forEach(child => {
      messages.push({ id: child.key, ...child.val() });
    });
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  });
}

// Send a global message
export async function sendGlobalMessage(text: string, userId: string, userName: string): Promise<void> {
  const message: Omit<GlobalMessage, 'id'> = {
    uid: userId,
    sender: userName,
    text,
    timestamp: serverTimestamp() as number,
    type: 'global'
  };
  
  await push(ref(database, PATHS.global), message);
}

// Send a DM
export async function sendDirectMessage(
  text: string,
  userId: string,
  userName: string,
  targetId: string
): Promise<void> {
  const message: Omit<DirectMessage, 'id'> = {
    uid: userId,
    sender: userName,
    text,
    timestamp: serverTimestamp() as number,
    type: 'dm',
    targetId
  };
  
  await push(ref(database, PATHS.dm(userId, targetId)), message);
}

// Update user's last seen timestamp
export async function updatePresence(userId: string) {
  const userRef = ref(database, `players/${userId}/lastSeenAt`);
  await push(userRef, serverTimestamp());
} 