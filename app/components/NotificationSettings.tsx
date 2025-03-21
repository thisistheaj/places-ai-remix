import { useState, useEffect } from 'react';
import { useAuth } from '~/lib/auth';
import { 
  NotificationPreferences, 
  subscribeToNotificationPreferences, 
  updateNotificationPreferences,
  areNotificationsSupported,
  getNotificationPermission,
  setupNotifications 
} from '~/lib/notifications';

export function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    global: true,
    dm: true,
    room: true,
    mentions: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const supported = areNotificationsSupported();

  // Subscribe to notification preferences
  useEffect(() => {
    if (!user) return;
    return subscribeToNotificationPreferences(user.uid, setPreferences);
  }, [user]);

  // Check permission status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermissionStatus(getNotificationPermission());
    }
  }, []);

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!user) return;
    
    // Optimistically update UI
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
    
    // Update in database
    try {
      setIsSaving(true);
      await updateNotificationPreferences(user.uid, { [key]: !preferences[key] });
      setSaveMessage('Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Error saving preferences');
      // Revert on error
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    
    setIsSettingUp(true);
    try {
      const success = await setupNotifications(user.uid);
      if (success) {
        setPermissionStatus('granted');
        setSaveMessage('Notifications enabled!');
      } else {
        setPermissionStatus(getNotificationPermission());
        setSaveMessage('Failed to enable notifications');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setSaveMessage('Error enabling notifications');
    } finally {
      setIsSettingUp(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 bg-[rgba(30,30,50,0.9)] backdrop-blur-sm border border-[rgba(217,70,239,0.3)] rounded-lg shadow-lg">
      <h2 className="text-lg font-medium text-[#d946ef] mb-4">Notification Settings</h2>
      
      {/* Browser notification permission */}
      <div className="mb-6 p-3 border border-[rgba(217,70,239,0.2)] rounded-md">
        <h3 className="text-[#d946ef] font-medium mb-2">Browser Notifications</h3>
        
        {!supported ? (
          <div className="text-amber-400 text-sm mb-2">
            Your browser doesn't support notifications.
          </div>
        ) : permissionStatus === 'granted' ? (
          <div className="text-green-400 text-sm mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Notifications are enabled
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="text-red-400 text-sm mb-2">
            Notifications are blocked. Please update your browser settings to allow notifications.
          </div>
        ) : (
          <button
            onClick={handleEnableNotifications}
            disabled={isSettingUp}
            className={`w-full py-2 px-3 rounded-md flex justify-center items-center gap-2 
                      ${isSettingUp 
                        ? 'bg-purple-700/30 text-purple-300/70' 
                        : 'bg-purple-700/60 hover:bg-purple-700/80 text-white'}`}
          >
            {isSettingUp ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting up...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Enable Browser Notifications
              </>
            )}
          </button>
        )}
        
        <p className="text-gray-400 text-xs">
          Allow browser notifications to receive alerts when you're not focused on this tab.
        </p>
      </div>
      
      <div className="space-y-3">
        {/* Global Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="global-notifications" className="text-white">
            Global Chat Notifications
          </label>
          <button
            id="global-notifications"
            onClick={() => handleTogglePreference('global')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.global ? 'bg-[#d946ef]' : 'bg-gray-600'
            }`}
            aria-checked={preferences.global}
            role="switch"
            disabled={permissionStatus !== 'granted'}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                preferences.global ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        
        {/* DM Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="dm-notifications" className="text-white">
            Direct Message Notifications
          </label>
          <button
            id="dm-notifications"
            onClick={() => handleTogglePreference('dm')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.dm ? 'bg-[#d946ef]' : 'bg-gray-600'
            }`}
            aria-checked={preferences.dm}
            role="switch"
            disabled={permissionStatus !== 'granted'}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                preferences.dm ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        
        {/* Room Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="room-notifications" className="text-white">
            Room Chat Notifications
          </label>
          <button
            id="room-notifications"
            onClick={() => handleTogglePreference('room')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.room ? 'bg-[#d946ef]' : 'bg-gray-600'
            }`}
            aria-checked={preferences.room}
            role="switch"
            disabled={permissionStatus !== 'granted'}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                preferences.room ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        
        {/* Mentions Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="mentions-notifications" className="text-white">
            @Mention Notifications
          </label>
          <button
            id="mentions-notifications"
            onClick={() => handleTogglePreference('mentions')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.mentions ? 'bg-[#d946ef]' : 'bg-gray-600'
            }`}
            aria-checked={preferences.mentions}
            role="switch"
            disabled={permissionStatus !== 'granted'}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                preferences.mentions ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Status message */}
      {saveMessage && (
        <div className="mt-4 text-sm font-medium text-[#d946ef]">
          {saveMessage}
        </div>
      )}
    </div>
  );
} 