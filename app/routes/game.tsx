import { useEffect } from 'react';
import { useNavigate, Link } from '@remix-run/react';
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
      <div className="min-h-screen flex items-center justify-center bg-[#111122]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
    <div className="relative min-h-screen">
      {/* Background with pixel grid for the game UI */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-[#111122]">
          {/* Pixel grid overlay */}
          <div className="absolute inset-0 opacity-5" 
            style={{ 
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '8px 8px'
            }}>
          </div>
        </div>
      </div>

      {/* Header with user info and controls */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-purple-500/20 shadow-md">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-pixel text-purple-600 text-lg hover:text-purple-800 transition-colors">
              Chiptunes Stack
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-background/60 px-3 py-1.5 rounded-full border border-purple-500/20">
                <div 
                  className="w-3 h-3 rounded-full animate-pulse" 
                  style={{ backgroundColor: getColorString() }}
                ></div>
                <div className="text-white font-medium">
                  {playerProfile?.name || user.displayName || user.email?.split('@')[0] || 'Player'}
                </div>
              </div>
              <Button 
                onClick={handleSignOut} 
                variant="outline"
                className="border-purple-500/30 hover:bg-purple-500/10 text-purple-700 font-pixel text-sm"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Game container with padding for the header and centered content */}
      <div className="pt-14 flex justify-center items-center">
        {/* Game component */}
        <ClientOnly fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        }>
          {() => <App />}
        </ClientOnly>
      </div>
    </div>
  );
} 