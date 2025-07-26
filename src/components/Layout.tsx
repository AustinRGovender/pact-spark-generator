import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from './ui/button';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-surface-elevated to-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-card border-b border-glass-border">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="p-2 rounded-lg hover:bg-primary/10" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">
                    Advanced Pact Generator
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Multi-language contract testing
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="glass-button"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex w-full pt-16">
          <div className="pt-16">
            <AppSidebar />
          </div>
          
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};