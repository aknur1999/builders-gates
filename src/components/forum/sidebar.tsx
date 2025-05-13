'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Github, User, LogOut, Settings, LayoutGrid, Beer, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCategory } from "@/lib/category-context";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export function Sidebar() {
  const { user, signInWithGitHub, signOut } = useAuth();
  const { selectedCategory, setSelectedCategory } = useCategory();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [totalThreads, setTotalThreads] = useState(0);
  const [todayThreads, setTodayThreads] = useState(0);
  const [threadStatsLoading, setThreadStatsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({
    Free: 0,
    Honey: 0,
    Boasts: 0
  });

  const handleGitHubSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error("GitHub login error:", error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsAuthLoading(false);
      setShowLogout(false);
    }
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  // Fetch thread statistics
  useEffect(() => {
    const fetchThreadStats = async () => {
      setThreadStatsLoading(true);
      try {
        // Get the start of today for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISOString = today.toISOString();

        // Get total thread count
        const { count: totalCount, error: totalError } = await supabase
          .from('threads')
          .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Get threads created today
        const { count: todayCount, error: todayError } = await supabase
          .from('threads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayISOString);

        if (todayError) throw todayError;

        // Get counts by category
        const { data: categoryData, error: categoryError } = await supabase
          .from('threads')
          .select('category');

        if (categoryError) throw categoryError;

        const counts = {
          Free: 0,
          Honey: 0,
          Boasts: 0
        };

        categoryData.forEach(thread => {
          const category = thread.category as 'Free' | 'Honey' | 'Boasts';
          if (counts[category] !== undefined) {
            counts[category]++;
          }
        });

        setCategoryCounts(counts);
        setTotalThreads(totalCount || 0);
        setTodayThreads(todayCount || 0);
      } catch (error) {
        console.error('Error fetching thread statistics:', error);
      } finally {
        setThreadStatsLoading(false);
      }
    };

    fetchThreadStats();
  }, []);

  // Calculate thread percentage for progress bar
  const threadPercentage = totalThreads > 0 ? (todayThreads / totalThreads) * 100 : 0;
  const threadPercentageWidth = `${Math.min(100, threadPercentage)}%`;

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-black flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <rect x="4" y="4" width="7" height="7" />
            <rect x="4" y="13" width="7" height="7" />
            <rect x="13" y="4" width="7" height="7" />
            <rect x="13" y="13" width="7" height="7" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">BuildersGates</h1>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <h2 className="text-sm text-muted-foreground mb-2">Categories</h2>
          <div className="space-y-1">
            <Button 
              variant={selectedCategory === 'All' ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              onClick={() => setSelectedCategory('All')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>All</span>
            </Button>
            <Button 
              variant={selectedCategory === 'Honey' ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              onClick={() => setSelectedCategory('Honey')}
            >
              <Beer className="h-4 w-4" />
              <span>Honey</span>
              <span className="ml-auto bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-md">
                {categoryCounts.Honey}
              </span>
            </Button>
            <Button 
              variant={selectedCategory === 'Boasts' ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              onClick={() => setSelectedCategory('Boasts')}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Boasts</span>
              <span className="ml-auto bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-md">
                {categoryCounts.Boasts}
              </span>
            </Button>
            <Button 
              variant={selectedCategory === 'Free' ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              onClick={() => setSelectedCategory('Free')}
            >
              <Users className="h-4 w-4" />
              <span>Free</span>
              <span className="ml-auto bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-md">
                {categoryCounts.Free}
              </span>
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <h2 className="text-sm text-muted-foreground mb-2">Community Stats</h2>
          <div className="space-y-1">
            <div className="space-y-1">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Online Users</span>
                <span className="text-sm">3/5</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Threads Today</span>
                {threadStatsLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : (
                  <span className="text-sm">{todayThreads}/{totalThreads}</span>
                )}
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: threadStatsLoading ? '0%' : threadPercentageWidth }}></div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {user && (
        <div className="p-4 mt-auto border-t relative">
          <div className="flex items-center">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 bg-amber-200 flex items-center justify-center rounded-full overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <Image 
                    src={user.user_metadata.avatar_url} 
                    alt={user.user_metadata?.name || 'User'} 
                    width={40}
                    height={40}
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <User className="h-5 w-5 text-amber-800" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.user_metadata?.name || user.user_metadata?.user_name || 'aknur1999'}</p>
                <p className="text-xs text-muted-foreground">@{user.user_metadata?.user_name || 'aknur1999'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={toggleLogout}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
          
          {showLogout && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Button
                className="flex items-center gap-2 px-6"
                variant="outline"
                onClick={handleSignOut}
                disabled={isAuthLoading}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      )}
      
      {!user && (
        <div className="p-4 mt-auto">
          <Button 
            className="w-full flex items-center gap-2 bg-black text-white hover:bg-black/90" 
            variant="default"
            onClick={handleGitHubSignIn}
            disabled={isAuthLoading}
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>
      )}
    </div>
  );
} 