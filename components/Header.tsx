'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, MapPin, Plane, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<{ mode: 'light' | 'dark'; color: 'default' | 'blue' | 'green' | 'purple' | 'orange' }>({ mode: 'light', color: 'default' });
  const pathname = usePathname();

  useEffect(() => {
    // Check for saved theme preference, default to light theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedColor = localStorage.getItem('theme-color') || 'default';
    
    const mode: 'light' | 'dark' = savedTheme as 'light' | 'dark';
    const color: 'default' | 'blue' | 'green' | 'purple' | 'orange' = savedColor as unknown || 'default';
    
    // Apply mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply color variant
    if (color !== 'default') {
      document.documentElement.setAttribute('data-theme', color);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    setTheme({ mode, color });
  }, []);

  // Apply theme function
  const applyTheme = (mode: 'light' | 'dark', color: 'default' | 'blue' | 'green' | 'purple' | 'orange') => {
    // Apply mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply color variant
    if (color !== 'default') {
      document.documentElement.setAttribute('data-theme', color);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', mode);
    localStorage.setItem('theme-color', color);
    
    setTheme({ mode, color });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Helper function to determine if a link is active
  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href.startsWith('/#')) {
      // For hash links, check if we're on the home page
      return pathname === '/';
    }
    return pathname.startsWith(href);
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
              className={`transition-colors duration-200 font-medium whitespace-nowrap relative pb-1 ${
                isActiveLink('/#home')
                  ? 'text-primary font-semibold'
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              Home
              {isActiveLink('/#home') && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
              )}
            </Link>
            <Link
              href="/#features"
              className={`transition-colors duration-200 font-medium whitespace-nowrap relative pb-1 ${
                isActiveLink('/#features')
                  ? 'text-primary font-semibold'
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              Features
              {isActiveLink('/#features') && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
              )}
            </Link>
            <Link
              href="/about"
              className={`transition-colors duration-200 font-medium whitespace-nowrap relative pb-1 ${
                isActiveLink('/about')
                  ? 'text-primary font-semibold'
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              About
              {isActiveLink('/about') && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
              )}
            </Link>
            <Link
              href="/contact"
              className={`transition-colors duration-200 font-medium whitespace-nowrap relative pb-1 ${
                isActiveLink('/contact')
                  ? 'text-primary font-semibold'
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              Contact
              {isActiveLink('/contact') && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
              )}
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Theme Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-background/50 hover:bg-background/80 border border-border/50"
                  aria-label="Select theme"
                >
                  <Palette className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => applyTheme('light', 'default')}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                  {theme.mode === 'light' && theme.color === 'default' && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTheme('dark', 'default')}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                  {theme.mode === 'dark' && theme.color === 'default' && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Color Variants</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'blue')}>
                  <div className="h-4 w-4 mr-2 rounded-full bg-blue-500" />
                  Blue
                  {theme.color === 'blue' && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'green')}>
                  <div className="h-4 w-4 mr-2 rounded-full bg-green-500" />
                  Green
                  {theme.color === 'green' && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'purple')}>
                  <div className="h-4 w-4 mr-2 rounded-full bg-purple-500" />
                  Purple
                  {theme.color === 'purple' && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'orange')}>
                  <div className="h-4 w-4 mr-2 rounded-full bg-orange-500" />
                  Orange
                  {theme.color === 'orange' && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                      className={`flex items-center text-lg font-medium transition-colors py-4 px-4 rounded-xl group relative ${
                        isActiveLink('/#home')
                          ? 'text-primary bg-primary/10 font-semibold'
                          : 'text-foreground hover:text-primary hover:bg-accent/50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Home</span>
                      {isActiveLink('/#home') && (
                        <span className="absolute -bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"></span>
                      )}
                    </Link>
                    <Link
                      href="/#features"
                      className={`flex items-center text-lg font-medium transition-colors py-4 px-4 rounded-xl group relative ${
                        isActiveLink('/#features')
                          ? 'text-primary bg-primary/10 font-semibold'
                          : 'text-foreground hover:text-primary hover:bg-accent/50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Features</span>
                      {isActiveLink('/#features') && (
                        <span className="absolute -bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"></span>
                      )}
                    </Link>
                    <Link
                      href="/about"
                      className={`flex items-center text-lg font-medium transition-colors py-4 px-4 rounded-xl group relative ${
                        isActiveLink('/about')
                          ? 'text-primary bg-primary/10 font-semibold'
                          : 'text-foreground hover:text-primary hover:bg-accent/50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">About</span>
                      {isActiveLink('/about') && (
                        <span className="absolute -bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"></span>
                      )}
                    </Link>
                    <Link
                      href="/contact"
                      className={`flex items-center text-lg font-medium transition-colors py-4 px-4 rounded-xl group relative ${
                        isActiveLink('/contact')
                          ? 'text-primary bg-primary/10 font-semibold'
                          : 'text-foreground hover:text-primary hover:bg-accent/50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Contact</span>
                      {isActiveLink('/contact') && (
                        <span className="absolute -bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"></span>
                      )}
                    </Link>
                  </div>
                  
                  {/* Theme Dropdown */}
                  <div className="px-6 pb-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start rounded-xl hover:bg-muted/50"
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Theme
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel>Theme</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => applyTheme('light', 'default')}>
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                          {theme.mode === 'light' && theme.color === 'default' && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTheme('dark', 'default')}>
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                          {theme.mode === 'dark' && theme.color === 'default' && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Color Variants</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'blue')}>
                          <div className="h-4 w-4 mr-2 rounded-full bg-blue-500" />
                          Blue
                          {theme.color === 'blue' && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'green')}>
                          <div className="h-4 w-4 mr-2 rounded-full bg-green-500" />
                          Green
                          {theme.color === 'green' && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'purple')}>
                          <div className="h-4 w-4 mr-2 rounded-full bg-purple-500" />
                          Purple
                          {theme.color === 'purple' && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTheme(theme.mode, 'orange')}>
                          <div className="h-4 w-4 mr-2 rounded-full bg-orange-500" />
                          Orange
                          {theme.color === 'orange' && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
