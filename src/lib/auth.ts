import { supabase } from './supabase';

export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { user: null, error };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  return { user, error: null };
} 