import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  nombre_completo: string;
  rol: string;
  perfil_completo: boolean;
  subscription_plan?: string;
  trial_ends_at?: string | null;
  quick_actions_prefs?: string[];
  dashboard_widgets_prefs?: { order: string[], visible: Record<string, boolean> };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isSuperAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data as Profile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionAndProfile(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionAndProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = profile?.rol === 'administrador_establecimiento' || profile?.rol === 'coordinador';
  const isStudent = profile?.rol === 'estudiante';
  const isSuperAdmin = profile?.rol === 'super_administrador';
  const isTeacher = !isAdmin && !isStudent && !isSuperAdmin;

  const value = {
    session,
    user,
    profile,
    loading,
    isAdmin,
    isStudent,
    isSuperAdmin,
    isTeacher,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};