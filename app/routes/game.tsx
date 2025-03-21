import { useEffect, useState } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import App from '~/app.client';
import { useAuth } from '~/lib/auth';
import { signOut, updatePlayerSkin } from '~/lib/firebase';
import { Button } from '~/components/ui/button';
import { CharacterPreview } from '~/components/CharacterPreview';
import { NotificationSettings } from '~/components/NotificationSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function Game() {
  const { user, playerProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [isChangingSkin, setIsChangingSkin] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSkinSelector, setShowSkinSelector] = useState(false);

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

  const handleSkinChange = async (skinNumber: string) => {
    if (!user) return;
    setIsChangingSkin(true);
    try {
      await updatePlayerSkin(user.uid, skinNumber);
    } catch (error) {
      console.error('Failed to update skin:', error);
    } finally {
      setIsChangingSkin(false);
      setShowSkinSelector(false);
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

  // Generate array of available skins
  const availableSkins = Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));

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

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80">
            <NotificationSettings />
            <button
              onClick={() => setShowNotificationSettings(false)}
              className="w-full mt-2 p-2 bg-[rgba(30,30,50,0.9)] text-[#d946ef] border border-[rgba(217,70,239,0.3)] rounded-lg hover:bg-[rgba(217,70,239,0.2)] transition-colors"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Skin Selector Modal */}
      {showSkinSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[rgba(30,30,50,0.9)] backdrop-blur-sm border border-[rgba(217,70,239,0.3)] rounded-lg shadow-lg max-h-96 w-64 overflow-y-auto p-4">
            <h3 className="text-[#d946ef] font-medium mb-4">Choose Character Skin</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableSkins.map((skin) => (
                <button
                  key={skin}
                  onClick={() => handleSkinChange(skin)}
                  className={`p-2 rounded-lg flex flex-col items-center ${
                    playerProfile?.skin === skin ? 'bg-purple-500/20' : 'hover:bg-purple-500/10'
                  }`}
                >
                  <CharacterPreview skinNumber={skin} size={32} />
                  <span className="text-white text-sm mt-1">Skin {skin}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSkinSelector(false)}
              className="w-full mt-4 p-2 bg-[rgba(30,30,50,0.9)] text-[#d946ef] border border-[rgba(217,70,239,0.3)] rounded-lg hover:bg-[rgba(217,70,239,0.2)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header with user info and controls */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-purple-500/20 shadow-md">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-pixel text-purple-600 text-lg hover:text-purple-800 transition-colors">
              Hackerhouse AI
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger disabled={isChangingSkin} asChild>
                    <button className="flex items-center gap-2 bg-background/60 px-3 py-1.5 rounded-full border border-purple-500/20 hover:bg-purple-500/10 transition-colors">
                      <div 
                        className="w-3 h-3 rounded-full animate-pulse" 
                        style={{ backgroundColor: getColorString() }}
                      ></div>
                      <div className="text-white font-medium">
                        {playerProfile?.name || user.displayName || user.email?.split('@')[0] || 'Player'}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="text-xs text-gray-400 px-2 py-1">Character</div>
                    <DropdownMenuItem 
                      onClick={() => setShowSkinSelector(true)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <div className="flex-shrink-0">
                        <CharacterPreview skinNumber={playerProfile?.skin || '01'} size={20} />
                      </div>
                      <span>Change Character Skin</span>
                    </DropdownMenuItem>
                    
                    <div className="h-px bg-gray-700 my-1"></div>
                    
                    <div className="text-xs text-gray-400 px-2 py-1">Settings</div>
                    <DropdownMenuItem 
                      onClick={() => setShowNotificationSettings(true)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      <span>Notification Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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