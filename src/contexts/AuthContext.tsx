import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = async (uid: string) => {
    if (uid === '00000000-0000-0000-0000-000000000000') {
      setProfile({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Administrador Demo',
        onboarding_completed: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          console.log('Profile not found, creating new profile for UID:', uid);
          // Create profile if it doesn't exist
          const newProfile = {
            id: uid,
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário',
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile (likely table "profiles" missing or RLS issue):', insertError);
            // Fallback to minimal profile in memory if table is missing so app doesn't break
            setProfile(newProfile as unknown as Profile);
          } else {
            console.log('Profile created successfully');
            setProfile(createdProfile as unknown as Profile);
          }
        } else {
          console.error('Error fetching profile:', error);
          // Fallback for demo/missing table
          setProfile({
            id: uid,
            name: 'Usuário',
            onboarding_completed: false,
            created_at: new Date(),
            updated_at: new Date()
          } as unknown as Profile);
        }
      } else {
        setProfile(data as unknown as Profile);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsDemo = () => {
    setIsDemo(true);
    setUser({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'admin@demo.com',
      user_metadata: { full_name: 'Administrador Demo' },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
    } as any);
    setProfile({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Administrador Demo',
      onboarding_completed: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  };

  const signOut = async () => {
    if (isDemo) {
      setUser(null);
      setProfile(null);
      setIsDemo(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, loginAsDemo }}>
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
