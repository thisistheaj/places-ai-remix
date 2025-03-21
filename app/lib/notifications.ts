import { database, ref, set, get, onValue } from './firebase';

export interface NotificationPreferences {
  global: boolean;
  dm: boolean;
  room: boolean;
  mentions: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  global: true,
  dm: true,
  room: true,
  mentions: true
};

// Store messaging instance
let messaging: any = null;

/**
 * Get user's notification preferences
 * @param userId User ID
 * @returns Promise with user preferences or default preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  if (!userId) return DEFAULT_PREFERENCES;

  try {
    const prefsRef = ref(database, `notifications/preferences/${userId}`);
    const snapshot = await get(prefsRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as NotificationPreferences;
    }
    
    // If no preferences are set, return and save defaults
    await set(prefsRef, DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Subscribe to user's notification preferences
 * @param userId User ID
 * @param callback Function to call with updated preferences
 * @returns Unsubscribe function
 */
export function subscribeToNotificationPreferences(
  userId: string, 
  callback: (preferences: NotificationPreferences) => void
) {
  if (!userId) {
    callback(DEFAULT_PREFERENCES);
    return () => {};
  }
  
  const prefsRef = ref(database, `notifications/preferences/${userId}`);
  return onValue(prefsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as NotificationPreferences);
    } else {
      callback(DEFAULT_PREFERENCES);
      // Save defaults if not exists
      set(prefsRef, DEFAULT_PREFERENCES);
    }
  });
}

/**
 * Update user's notification preferences
 * @param userId User ID
 * @param preferences New notification preferences
 * @returns Promise that resolves when preferences are updated
 */
export async function updateNotificationPreferences(
  userId: string, 
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  if (!userId) return;
  
  try {
    // Get current preferences
    const currentPrefs = await getNotificationPreferences(userId);
    
    // Merge with new preferences
    const newPrefs = {
      ...currentPrefs,
      ...preferences
    };
    
    // Update in Firebase
    const prefsRef = ref(database, `notifications/preferences/${userId}`);
    await set(prefsRef, newPrefs);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Check if notifications are supported in the current browser
 * @returns Boolean indicating if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'Notification' in window && 
         'serviceWorker' in navigator &&
         'PushManager' in window;
}

/**
 * Check current notification permission status
 * @returns 'granted', 'denied', or 'default'
 */
export function getNotificationPermission(): string {
  if (typeof window === 'undefined') return 'default';
  
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * This will show the browser permission dialog
 * @returns Promise that resolves with the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'default';
  
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  // If we already have permission, return it
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  // If permission is denied, we can't ask again
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  // Request permission - this will show the browser dialog
  return await Notification.requestPermission();
}

/**
 * Initialize Firebase Cloud Messaging
 * This must be called after a user has granted notification permission
 * @returns Promise that resolves to the FCM token or null if initialization failed
 */
export async function initializeFCM(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Dynamically import Firebase modules
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    
    messaging = getMessaging();
    
    // Get the token
    const token = await getToken(messaging, {
      vapidKey: window.ENV?.FIREBASE_VAPID_KEY
    });
    
    // Set up handler for foreground messages
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show custom UI notification since we're in the foreground
      if (payload.notification) {
        showCustomNotification(
          payload.notification.title || 'New message',
          payload.notification.body || '',
          payload.data
        );
      }
    });
    
    return token;
  } catch (error) {
    console.error('Failed to initialize FCM:', error);
    return null;
  }
}

/**
 * Register FCM token for a user
 * @param userId User ID
 * @param token FCM token
 * @returns Promise that resolves when the token is registered
 */
export async function registerFCMToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  
  try {
    const tokenRef = ref(database, `notifications/tokens/${userId}/${token.replace(/[.#$/[\]]/g, '_')}`);
    await set(tokenRef, {
      token,
      lastSeen: Date.now(),
      device: getDeviceInfo()
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
}

/**
 * Get basic device information for token registration
 * @returns Object with device information
 */
function getDeviceInfo() {
  if (typeof window === 'undefined') return {};

  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language
  };
}

/**
 * Show a custom in-app notification
 * Used for foreground notifications
 */
function showCustomNotification(title: string, body: string, data?: any) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('custom-notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'custom-notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.backgroundColor = 'rgba(30, 30, 50, 0.9)';
  notification.style.backdropFilter = 'blur(5px)';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.padding = '12px 16px';
  notification.style.marginBottom = '10px';
  notification.style.color = 'white';
  notification.style.width = '300px';
  notification.style.border = '1px solid rgba(217, 70, 239, 0.3)';
  notification.style.cursor = 'pointer';
  notification.style.transition = 'all 0.3s ease';
  
  // Add title
  const titleElement = document.createElement('div');
  titleElement.textContent = title;
  titleElement.style.fontWeight = 'bold';
  titleElement.style.marginBottom = '4px';
  titleElement.style.color = '#d946ef';
  notification.appendChild(titleElement);
  
  // Add body
  const bodyElement = document.createElement('div');
  bodyElement.textContent = body;
  bodyElement.style.fontSize = '14px';
  notification.appendChild(bodyElement);
  
  // Add click event
  notification.addEventListener('click', () => {
    container?.removeChild(notification);
    
    // Handle navigation based on data
    if (data && data.url) {
      window.location.href = data.url;
    }
  });
  
  // Add to container
  container.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (container?.contains(notification)) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(20px)';
      setTimeout(() => {
        if (container?.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

/**
 * Initialize notifications for a user
 * This handles permission request, FCM setup, and token registration
 * @param userId User ID
 * @returns Promise that resolves with success status
 */
export async function setupNotifications(userId: string): Promise<boolean> {
  if (!userId || !areNotificationsSupported()) return false;
  
  try {
    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return false;
    }
    
    // Initialize FCM
    const token = await initializeFCM();
    if (!token) {
      return false;
    }
    
    // Register token
    await registerFCMToken(userId, token);
    return true;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
} 