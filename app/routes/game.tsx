import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import App from '~/app.client';
import { useAuth } from '~/lib/auth';
import { signOut } from '~/lib/firebase';
import { Button } from '~/components/ui/button';

export default function Game() {
  const { user, playerProfile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Generate a color string safely
  const getColorString = () => {
    if (!playerProfile || typeof playerProfile.color !== 'number') {
      return '#888888'; // Default gray color
    }
    return `#${playerProfile.color.toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="relative">
      {/* Header with user info and sign out button */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
        {user && (
          <>
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: getColorString() }}
              ></div>
              <div className="text-foreground">
                {playerProfile?.name || user.displayName || user.email?.split('@')[0] || 'Player'}
              </div>
            </div>
            <Button 
              onClick={handleSignOut} 
              variant="destructive" 
              size="sm"
            >
              Sign Out
            </Button>
          </>
        )}
      </div>

      {/* Game component */}
      <ClientOnly fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        {() => <App />}
      </ClientOnly>
    </div>
  );
} 