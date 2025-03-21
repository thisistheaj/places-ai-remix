/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Make environment variables available to the client
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
      FIREBASE_VAPID_KEY: string;
    };
  }
}

// Function to initialize Firebase service worker with config
async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service worker registered successfully:', registration);

      // Create a channel to communicate with the service worker
      const messageChannel = new MessageChannel();
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Get active service worker
      const activeWorker = registration.active;
      if (!activeWorker) {
        console.error('No active service worker found');
        return;
      }
      
      // Send Firebase config to the service worker
      activeWorker.postMessage({
        type: 'FIREBASE_CONFIG',
        config: {
          apiKey: window.ENV.FIREBASE_API_KEY,
          authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
          projectId: window.ENV.FIREBASE_PROJECT_ID,
          storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID,
          appId: window.ENV.FIREBASE_APP_ID
        }
      }, [messageChannel.port2]);
      
      console.log('Firebase config sent to service worker');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
}

// Initialize app
startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <RemixBrowser />
        </StrictMode>
    );
    
    // Initialize service worker if window exists
    if (typeof window !== 'undefined') {
        initServiceWorker().catch(console.error);
    }
});
