'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/');
        return;
      }
      
      if (data.session?.user) {
        const user = data.session.user;
        
        // Check if user already has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (profileError && !profileData) {
          // User doesn't have a profile, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.user_metadata.user_name || user.user_metadata.preferred_username || user.email?.split('@')[0] || `user_${Math.random().toString(36).substring(2, 8)}`,
              avatar_url: user.user_metadata.avatar_url || '',
              email: user.email,
              created_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating user profile:', insertError);
          }
        }
      }
      
      // Redirect back to the main page
      router.push('/');
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
        <p className="text-muted-foreground">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
} 