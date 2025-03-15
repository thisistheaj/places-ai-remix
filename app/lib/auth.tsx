import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from './firebase';
import { createOrUpdateUserProfile } from './user';
import { Player } from '~/models/player';

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  playerProfile: Player | null;
  loading: boolean;
  error: Error | null;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  playerProfile: null,
  loading: true,
  error: null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap the application
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [playerProfile, setPlayerProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      
      // If user is logged in, create or update profile
      if (user) {
        try {
          const profile = await createOrUpdateUserProfile(user);
          setPlayerProfile(profile);
        } catch (err) {
          console.error('Error creating/updating user profile:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } else {
        setPlayerProfile(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, playerProfile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
} 