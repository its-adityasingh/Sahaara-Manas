import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string; user_type?: string; grade_level?: string | null; preferred_language?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials for bypassing Supabase
const HARDCODED_EMAIL = 'adityasingh28012007@gmail.com';
const HARDCODED_PASSWORD = '123456';
const HARDCODED_SESSION_KEY = 'sahaara_hardcoded_session';

// Create a mock user object for hardcoded login
const createMockUser = (email: string, metadata?: { full_name?: string; user_type?: string; grade_level?: string | null }): User => {
  return {
    id: 'hardcoded-user-id-' + email.replace(/[^a-zA-Z0-9]/g, '-'),
    email: email,
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      full_name: metadata?.full_name || 'Aditya Singh',
      user_type: metadata?.user_type || 'student',
      grade_level: metadata?.grade_level || null,
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User;
};

// Create a mock session object
const createMockSession = (user: User): Session => {
  return {
    access_token: 'hardcoded-token-' + Date.now(),
    refresh_token: 'hardcoded-refresh-' + Date.now(),
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: user,
  } as Session;
};

// Save hardcoded session to localStorage
const saveHardcodedSession = (user: User, session: Session) => {
  try {
    localStorage.setItem(HARDCODED_SESSION_KEY, JSON.stringify({ user, session }));
  } catch (error) {
    console.error('Error saving hardcoded session:', error);
  }
};

// Load hardcoded session from localStorage
const loadHardcodedSession = (): { user: User; session: Session } | null => {
  try {
    const stored = localStorage.getItem(HARDCODED_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading hardcoded session:', error);
  }
  return null;
};

// Clear hardcoded session from localStorage
const clearHardcodedSession = () => {
  try {
    localStorage.removeItem(HARDCODED_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing hardcoded session:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First check for hardcoded session
    const hardcodedSession = loadHardcodedSession();
    if (hardcodedSession) {
      setUser(hardcodedSession.user);
      setSession(hardcodedSession.session);
      setLoading(false);
      return;
    }

    // Only set up auth if Supabase is configured
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // If session check fails, just set loading to false
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; user_type?: string; grade_level?: string | null; preferred_language?: string }
  ) => {
    // Check for hardcoded credentials first
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      const mockUser = createMockUser(email, metadata);
      const mockSession = createMockSession(mockUser);
      saveHardcodedSession(mockUser, mockSession);
      setUser(mockUser);
      setSession(mockSession);
      return { error: null };
    }

    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.') 
      };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (signUpError) {
        // Handle network errors
        if (signUpError.message.includes('Failed to fetch') || signUpError.message.includes('NetworkError')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and ensure Supabase is properly configured.');
        }
        throw signUpError;
      }
      
      // If user is created, update profile with additional metadata
      if (authData.user) {
        // Wait a bit for the trigger to create the profile, then update it
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const updateData: any = {
            preferred_language: metadata?.preferred_language || 'en'
          };
          
          if (metadata?.grade_level) {
            updateData.grade_level = metadata.grade_level;
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('user_id', authData.user.id);
            
            if (updateError) {
              console.error('Error updating profile:', updateError);
              // Don't throw here, profile was created by trigger, just couldn't update metadata
            }
          }
        } catch (profileError) {
          console.error('Error updating profile metadata:', profileError);
          // Don't fail signup if profile update fails
        }
      }
      
      return { error: null };
    } catch (error: any) {
      // Handle network and connection errors
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError') || error?.name === 'TypeError') {
        return { 
          error: new Error('Unable to connect to the server. Please check your internet connection and ensure Supabase environment variables are correctly set in your .env file.') 
        };
      }
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check for hardcoded credentials first
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      const mockUser = createMockUser(email);
      const mockSession = createMockSession(mockUser);
      saveHardcodedSession(mockUser, mockSession);
      setUser(mockUser);
      setSession(mockSession);
      return { error: null };
    }

    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.') 
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and ensure Supabase is properly configured.');
        }
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      // Handle network and connection errors
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError') || error?.name === 'TypeError') {
        return { 
          error: new Error('Unable to connect to the server. Please check your internet connection and ensure Supabase environment variables are correctly set in your .env file.') 
        };
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Clear hardcoded session
    clearHardcodedSession();
    
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
