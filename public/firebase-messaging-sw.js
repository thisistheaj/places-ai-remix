// Firebase Cloud Messaging Service Worker

// Handle notification click events - must be at top level
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] Notification clicked:', event);
  
  event.notification.close();
  
  // Extract data passed with the notification
  const urlToOpen = event.notification.data?.url || '/app';
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    console.log('[FCM] Found window clients:', windowClients);
    
    // Check if there is already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    // If no window is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

// Import the latest version of Firebase
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Store Firebase config when received from main thread
let firebaseConfig = null;
let messaging = null;

console.log('[FCM] Service Worker loaded');

// Listen for push messages directly
self.addEventListener('push', (event) => {
  console.log('[FCM] Push message received:', event);
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[FCM] Push payload:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.data || {},
      actions: [{ action: 'open', title: 'View' }],
      requireInteraction: true
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => console.log('[FCM] Push notification shown successfully'))
        .catch(error => console.error('[FCM] Error showing push notification:', error))
    );
  } catch (error) {
    console.error('[FCM] Error handling push message:', error);
  }
});

// Listen for message from the main thread with Firebase config
self.addEventListener('message', async (event) => {
  console.log('[FCM] Message received in SW:', event.data);
  
  if (event.data?.type === 'FIREBASE_CONFIG') {
    try {
      // Initialize Firebase with the provided config
      firebaseConfig = event.data.config;
      console.log('[FCM] Received Firebase config:', firebaseConfig);
      
      // Check if Firebase is already initialized
      if (firebase.apps.length) {
        console.log('[FCM] Firebase already initialized, deleting existing apps');
        await Promise.all(firebase.apps.map(app => app.delete()));
      }
      
      // Initialize Firebase
      const app = firebase.initializeApp(firebaseConfig);
      console.log('[FCM] Firebase app initialized:', app.name);
      
      // Initialize messaging
      messaging = firebase.messaging();
      console.log('[FCM] Firebase messaging initialized');
      
      // Set up background message handler
      messaging.onBackgroundMessage((payload) => {
        console.log('[FCM] Background message received:', payload);
        
        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: payload.data || {},
          actions: [{ action: 'open', title: 'View' }],
          requireInteraction: true,
          tag: payload.data?.messageId || 'default' // Prevent duplicate notifications
        };
        
        console.log('[FCM] Showing notification:', { title: notificationTitle, options: notificationOptions });
        
        return self.registration.showNotification(notificationTitle, notificationOptions)
          .then(() => console.log('[FCM] Notification shown successfully'))
          .catch(error => console.error('[FCM] Error showing notification:', error));
      });
      
      console.log('[FCM] Background message handler set up successfully');
    } catch (error) {
      console.error('[FCM] Error during Firebase initialization:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        config: firebaseConfig
      });
    }
  }
}); 