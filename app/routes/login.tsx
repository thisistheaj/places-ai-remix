import { useEffect } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { signInWithGoogle } from '~/lib/firebase';
import { useAuth } from '~/lib/auth';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to game if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/game');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // Auth state change will trigger redirect
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Background with pixel grid and stars */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-[#111122]">
          {/* Pixel grid overlay */}
          <div className="absolute inset-0 opacity-10" 
            style={{ 
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '8px 8px'
            }}>
          </div>
          {/* Animated pixel "stars" */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{ 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-blue-500/30 to-cyan-400/40" />
        </div>
      </div>
      
      <Card className="w-full max-w-md border-2 border-purple-500/20 shadow-xl backdrop-blur-sm bg-background/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl text-center font-pixel text-purple-700">Chiptunes Stack</CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            Ready to join the multiplayer adventure? Sign in to start building and playing your game.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Button 
              onClick={handleLogin} 
              className="w-full bg-purple-600 hover:bg-purple-700 font-pixel py-6 text-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Sign in with Google
              </div>
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Your adventure in multiplayer game development awaits
          </p>
          <Link to="/" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 