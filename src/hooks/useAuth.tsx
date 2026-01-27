import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Hardcoded credentials
const HARDCODED_EMAIL = "adityasingh28012007@gmail.com";
const HARDCODED_PASSWORD = "123456";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to create a mock user
const createMockUser = (email: string, displayName?: string): User => {
  return {
    id: "hardcoded-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: email,
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"]
    },
    user_metadata: {
      display_name: displayName || email.split("@")[0]
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false
  } as User;
};

// Helper function to create a mock session
const createMockSession = (user: User): Session => {
  return {
    access_token: "mock-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "mock-refresh-token",
    user: user
  } as Session;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHardcodedAuth, setIsHardcodedAuth] = useState(false);

  useEffect(() => {
    // Check for hardcoded auth in localStorage
    const hardcodedAuth = localStorage.getItem("hardcoded_auth");
    if (hardcodedAuth === "true") {
      const storedEmail = localStorage.getItem("hardcoded_email");
      if (storedEmail) {
        const mockUser = createMockUser(storedEmail);
        const mockSession = createMockSession(mockUser);
        setUser(mockUser);
        setSession(mockSession);
        setIsHardcodedAuth(true);
        setLoading(false);
        return;
      }
    }

    // Set up auth state listener for Supabase
    try {
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
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Check hardcoded credentials first
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      const mockUser = createMockUser(email, displayName);
      const mockSession = createMockSession(mockUser);
      setUser(mockUser);
      setSession(mockSession);
      setIsHardcodedAuth(true);
      localStorage.setItem("hardcoded_auth", "true");
      localStorage.setItem("hardcoded_email", email);
      return { error: null };
    }

    // Try Supabase if credentials don't match hardcoded ones
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName
          }
        }
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      // If Supabase fails, still allow hardcoded credentials
      if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
        const mockUser = createMockUser(email, displayName);
        const mockSession = createMockSession(mockUser);
        setUser(mockUser);
        setSession(mockSession);
        setIsHardcodedAuth(true);
        localStorage.setItem("hardcoded_auth", "true");
        localStorage.setItem("hardcoded_email", email);
        return { error: null };
      }
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check hardcoded credentials first
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      const mockUser = createMockUser(email);
      const mockSession = createMockSession(mockUser);
      setUser(mockUser);
      setSession(mockSession);
      setIsHardcodedAuth(true);
      localStorage.setItem("hardcoded_auth", "true");
      localStorage.setItem("hardcoded_email", email);
      return { error: null };
    }

    // Try Supabase if credentials don't match hardcoded ones
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      setIsHardcodedAuth(false);
      return { error: null };
    } catch (error) {
      // If Supabase fails, still allow hardcoded credentials
      if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
        const mockUser = createMockUser(email);
        const mockSession = createMockSession(mockUser);
        setUser(mockUser);
        setSession(mockSession);
        setIsHardcodedAuth(true);
        localStorage.setItem("hardcoded_auth", "true");
        localStorage.setItem("hardcoded_email", email);
        return { error: null };
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (isHardcodedAuth) {
      setUser(null);
      setSession(null);
      setIsHardcodedAuth(false);
      localStorage.removeItem("hardcoded_auth");
      localStorage.removeItem("hardcoded_email");
    } else {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        // If Supabase fails, still clear local state
        setUser(null);
        setSession(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
