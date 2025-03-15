import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Places AI</CardTitle>
          <CardDescription className="text-center">
            A multiplayer virtual space where you can interact with other players and AI agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Button 
              onClick={handleLogin} 
              className="w-full"
            >
              Sign in with Google
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Sign in to start exploring the virtual space
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 