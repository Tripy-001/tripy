'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  X, 
  Globe, 
  Home, 
  Plus, 
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface NavigationProps {
  showAuth?: boolean;
  showCreateTrip?: boolean;
}

const Navigation = ({ showAuth = true, showCreateTrip = true }: NavigationProps) => {
  const router = useRouter();
  const { user, isAuthenticated, setCurrentStep } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCreateTrip = () => {
    if (isAuthenticated) {
      setCurrentStep('trip-creation');
      router.push('/trip/create');
    } else {
      router.push('/onboarding');
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">tripy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            
            {isAuthenticated && (
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {showCreateTrip && (
              <Button
                onClick={handleCreateTrip}
                className="theme-bg theme-bg-hover text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            )}
            
            {showAuth && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/onboarding')}
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => router.push('/onboarding')}
                      className="theme-bg theme-bg-hover text-primary-foreground"
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
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            <div className="space-y-4">
              <Link 
                href="/" 
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {isAuthenticated && (
                <Link 
                  href="/dashboard" 
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              <div className="pt-4 border-t border-white/20">
                {showCreateTrip && (
                  <Button
                    onClick={() => {
                      handleCreateTrip();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full gradient-primary gradient-primary-hover text-white mb-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Trip
                  </Button>
                )}
                
                {showAuth && (
                  <>
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{user?.name || 'User'}</span>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push('/dashboard');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            handleLogout();
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
                          className="w-full"
                          onClick={() => {
                            router.push('/onboarding');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => {
                            router.push('/onboarding');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full gradient-primary gradient-primary-hover text-white"
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
    </header>
  );
};

export default Navigation;
