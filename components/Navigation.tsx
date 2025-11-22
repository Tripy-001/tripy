'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  X, 
  Globe, 
  Plus, 
  LogOut,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface NavigationProps {
  showAuth?: boolean;
  showCreateTrip?: boolean;
}

const Navigation = ({ showAuth = true, showCreateTrip = true }: NavigationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, firebaseUser, signOut, setCurrentStep, authLoading } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Preload logo image immediately
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/images/tripy-app-logo.png';
    document.head.appendChild(link);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    // Check for saved theme preference, default to light theme
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      // Ensure light theme is set as default if no preference exists
      if (!savedTheme) {
        localStorage.setItem('theme', 'light');
      }
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleCreateTrip = () => {
    if (isAuthenticated) {
      setCurrentStep('trip-creation');
      router.push('/trip/create');
    } else {
      router.push('/onboarding');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowLogoutModal(false);
      router.push('/');
    } catch (error) {
      setShowLogoutModal(false);
      console.error('Logout error:', error);
    }
  };



  const handleSignInRedirect = () => {
    router.push('/signin');
  };

  const handleSignupRedirect = () => {
    router.push('/signup');
  };

  // Helper function to determine if a link is active
  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // if (authLoading) {
  //   return (
  //     <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
  //         <div className="flex items-center space-x-3">
  //           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
  //             <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
  //           </div>
  //           <span className="text-xl font-bold text-foreground">Tripy</span>
  //         </div>
  //       </div>
  //     </header>
  //   );
  // }
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 group-hover:scale-110 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/tripy-app-logo.png"
                alt="Tripy Logo"
                className="w-full h-full object-contain"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
              />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight hidden sm:inline">Tripy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isActiveLink('/')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Home
              {isActiveLink('/') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/about" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isActiveLink('/about')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              About
              {isActiveLink('/about') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/contact" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isActiveLink('/contact')
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Contact
              {isActiveLink('/contact') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
            
            {isAuthenticated && (
              <Link 
                href="/dashboard" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActiveLink('/dashboard')
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Dashboard
                {isActiveLink('/dashboard') && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-lg hover:bg-muted/50 transition-all"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </Button>

            {showCreateTrip && (
              <Button
                onClick={handleCreateTrip}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all rounded-xl font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            )}
            
            {showAuth && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-9 h-9 border-2 border-primary/20 shadow-md">
                      <AvatarImage src={firebaseUser?.photoURL || user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user?.displayName?.charAt(0) || firebaseUser?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLogoutModal(true)}
                      className="rounded-lg hover:bg-muted/50"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={handleSignInRedirect}
                      className="rounded-lg hover:bg-muted/50"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={handleSignupRedirect}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all rounded-xl font-semibold"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg hover:bg-muted/50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl py-4">
            <div className="space-y-2 pt-4">
              <Link 
                href="/" 
                className={`block text-base font-medium transition-all py-3 px-4 rounded-xl ${
                  isActiveLink('/')
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-foreground hover:text-primary hover:bg-muted/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className={`block text-base font-medium transition-all py-3 px-4 rounded-xl ${
                  isActiveLink('/about')
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-foreground hover:text-primary hover:bg-muted/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className={`block text-base font-medium transition-all py-3 px-4 rounded-xl ${
                  isActiveLink('/contact')
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-foreground hover:text-primary hover:bg-muted/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {isAuthenticated && (
                <Link 
                  href="/dashboard" 
                  className={`block text-base font-medium transition-all py-3 px-4 rounded-xl ${
                    isActiveLink('/dashboard')
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              <div className="pt-4 border-t border-border/50 space-y-3">
                {/* Theme Toggle in Mobile Menu */}
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl hover:bg-muted/50"
                  onClick={toggleTheme}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </Button>

                {showCreateTrip && (
                  <Button
                    onClick={() => {
                      handleCreateTrip();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-xl font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Trip
                  </Button>
                )}
                
                {showAuth && (
                  <>
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarImage src={firebaseUser?.photoURL || user?.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user?.displayName?.charAt(0) || firebaseUser?.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold">{user?.displayName || firebaseUser?.displayName || 'User'}</span>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start rounded-xl hover:bg-muted/50"
                          onClick={() => {
                            setShowLogoutModal(true);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full rounded-xl hover:bg-muted/50"
                          onClick={() => {
                            handleSignInRedirect();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => {
                            handleSignupRedirect();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-xl font-semibold"
                        >
                          Get Started
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <div className="text-lg font-semibold text-foreground">Confirm Logout</div>
          </DialogHeader>
          <div className="py-2 text-muted-foreground">Are you sure you want to log out?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button className="theme-bg theme-bg-hover text-primary-foreground" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navigation;
