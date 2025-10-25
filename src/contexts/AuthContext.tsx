import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  nombre_completo: string;
  rol: string;
  perfil_completo: boolean;
  subscription_plan?: string;
  subscription_status?: string;
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
  refreshProfile: () => Promise<void>;
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

  const fetchProfile = useCallback(async (userToFetch: User) => {
    const { data: profileData, error: profileError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userToFetch.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      setProfile(null);
    } else {
      let finalProfile = { ...profileData };

      // Check for establishment subscription override
      const { data: establishmentLinks, error: estError } = await supabase
        .from('perfil_establecimientos')
        .select('establecimientos!inner(id, suscripciones_establecimiento(*))')
        .eq('perfil_id', userToFetch.id)
        .eq('estado', 'aprobado');

      if (!estError && establishmentLinks) {
        const hasActiveEstablishmentPlan = establishmentLinks.some((link: any) => {
          const sub = link.establecimientos?.suscripciones_establecimiento?.[0];
          return sub && (sub.plan_type === 'establecimiento' || sub.plan_type === 'pro') && sub.expires_at && new Date(sub.expires_at) > new Date();
        });

        if (hasActiveEstablishmentPlan) {
          finalProfile.subscription_plan = 'establecimiento';
          finalProfile.subscription_status = 'active';
          finalProfile.trial_ends_at = null;
        }
      }
      
      setProfile(finalProfile as Profile);
    }
  }, []);

  useEffect(() => {
    const fetchSessionAndProfile = async (currentSession: Session | null) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
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
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

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
    refreshProfile,
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