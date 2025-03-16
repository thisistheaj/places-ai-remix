import { Link } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '~/components/ui/card';
import { useAuth } from '~/lib/auth';

export default function Landing() {
  const { user, loading } = useAuth();
  
  return (
    <main className="relative min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="relative sm:pb-16 sm:pt-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
            <div className="absolute inset-0">
              {/* Background with pixel grid and stars */}
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
              </div>
              {/* Cleaner gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-blue-500/30 to-cyan-400/40" />
            </div>
            <div className="relative px-4 pb-8 pt-16 sm:px-6 sm:pb-14 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-32">
              <h1 className="text-center font-pixel tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-pixel-float">
                <span className="block uppercase text-white drop-shadow-md" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                  Chiptunes Stack
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-lg text-center text-xl text-white sm:max-w-3xl">
                A Remix stack for building realtime authenticated multiplayer games with Phaser and Firebase.
              </p>
              <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : user ? (
                  <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 font-pixel text-white py-6 px-8 text-lg">
                    <Link to="/game">Go to Game</Link>
                  </Button>
                ) : (
                  <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                    <Link
                      to="/login"
                      className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-purple-700 shadow-sm hover:bg-purple-50 sm:px-8"
                    >
                      Get Started
                    </Link>
                    <a
                      href="#features"
                      className="flex items-center justify-center rounded-md bg-purple-500 px-4 py-3 font-medium text-white hover:bg-purple-600"
                    >
                      Learn More
                    </a>
                  </div>
                )}
              </div>
              <a href="https://remix.run">
                <img
                  src="https://user-images.githubusercontent.com/1500684/158298926-e45dafff-3544-4b69-96d6-d3bcc33fc76a.svg"
                  alt="Remix"
                  className="mx-auto mt-16 w-full max-w-[12rem] md:max-w-[16rem]"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div id="features" className="my-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 font-pixel text-purple-700">Key Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build multiplayer games with React and Phaser
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-border/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 p-2 bg-purple-500/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="mb-3">Realtime Capabilities</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Built-in Firebase Realtime Database integration for multiplayer synchronization and live updates.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border border-border/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 p-2 bg-purple-500/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle className="mb-3">Authentication</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Seamless Firebase Authentication with ready-to-use login flows and user management.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border border-border/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 p-2 bg-purple-500/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <CardTitle className="mb-3">State Management</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Integrated state management between React/Remix and Phaser for seamless game-UI interactions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technology Showcase - Updated with actual technologies used */}
        <div className="mt-16 mb-16 pt-8 border-t border-border/20">
          <h2 className="text-center text-2xl font-bold mb-8 font-pixel text-purple-700">Built With</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            {[
              {
                src: "https://user-images.githubusercontent.com/1500684/157764276-a516a239-e377-4a20-b44a-0ac7b65c8c14.svg",
                alt: "Tailwind",
                href: "https://tailwindcss.com",
              },
              {
                src: "https://phaser.io/images/img.png",
                alt: "Phaser",
                href: "https://phaser.io/",
              },
              {
                src: "https://firebase.google.com/static/downloads/brand-guidelines/SVG/logo-standard.svg",
                alt: "Firebase",
                href: "https://firebase.google.com/",
              },
              {
                src: "https://ui.shadcn.com/apple-touch-icon.png",
                alt: "shadcn/ui",
                href: "https://ui.shadcn.com/",
              },
              {
                src: "https://user-images.githubusercontent.com/1500684/157773063-20a0ed64-b9f8-4e0b-9d1e-0b65a3d4a6db.svg",
                alt: "TypeScript",
                href: "https://typescriptlang.org",
              },
            ].map((img) => (
              <a
                key={img.href}
                href={img.href}
                className="flex h-16 w-32 justify-center p-1 grayscale transition hover:grayscale-0 focus:grayscale-0"
              >
                <img alt={img.alt} src={img.src} className="object-contain" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 font-pixel text-purple-700">Ready to Build Your Game?</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Get started with a fully configured stack for building multiplayer games with Remix, Phaser, and Firebase.
            </p>
            {user ? (
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 font-pixel text-sm py-6">
                <Link to="/game">Go to Game</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 font-pixel text-sm py-6">
                <Link to="/login">Get Started Now</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Chiptunes Stack. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
} 