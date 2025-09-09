'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, MapPin, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);


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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Enhanced glassmorphic background */}
      <div className="absolute inset-0 glass-header rounded-2xl" />
      
      {/* Header content */}
      <div className="relative px-4 sm:px-6 lg:px-8 header-container">
        <div className="flex items-center justify-between h-16 lg:h-20 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground whitespace-nowrap">Tripy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 flex-1 justify-center">
            <Link
              href="/#home"
              className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              href="/#features"
              className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium whitespace-nowrap"
            >
              Features
            </Link>
            <Link
              href="/about"
              className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium whitespace-nowrap"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium whitespace-nowrap"
            >
              Contact
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-lg bg-background/50 hover:bg-background/80 border border-border/50"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* CTA Button */}
            <Button className="hidden sm:inline-flex" size="default">
              <MapPin className="w-4 h-4 mr-2" />
              Get Started
            </Button>

            {/* Mobile menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10 rounded-lg bg-background/50 hover:bg-background/80 border border-border/50"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[85vw] sm:w-[400px] max-w-[400px] bg-background/95 backdrop-blur-sm border-l border-border/50 p-0"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                        <Plane className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-xl font-bold text-foreground">Tripy</span>
                        <p className="text-sm text-muted-foreground">AI-Powered Travel</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Links */}
                  <div className="flex flex-col px-6 py-8 space-y-2 flex-1">
                    <Link
                      href="/#home"
                      className="flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors py-4 px-4 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Home</span>
                    </Link>
                    <Link
                      href="/#features"
                      className="flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors py-4 px-4 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Features</span>
                    </Link>
                    <Link
                      href="/about"
                      className="flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors py-4 px-4 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">About</span>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors py-4 px-4 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Contact</span>
                    </Link>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="p-6 pt-4 border-t border-border/50">
                    <Button className="w-full h-12 text-base font-semibold" size="default">
                      <MapPin className="w-5 h-5 mr-2" />
                      Get Started
                    </Button>
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      Start planning your next adventure
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
