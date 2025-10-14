import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useTeacherTour } from '@/hooks/useTeacherTour';
import TeacherTour from '@/components/tour/TeacherTour';
import TrialBanner from '@/components/layout/TrialBanner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ 
    nombre_completo: string, 
    rol: string, 
    subscription_plan?: string,
    trial_ends_at?: string | null,
    quick_actions_prefs?: string[],
    dashboard_widgets_prefs?: { order: string[], visible: Record<string, boolean> }
  } | null>(null);
  const { runTour, handleTourEnd } = useTeacherTour(profile?.rol || '');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('nombre_completo, rol, subscription_plan, trial_ends_at, quick_actions_prefs, dashboard_widgets_prefs')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          navigate('/login');
        } else {
          setProfile(data);
        }
      } else {
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  const isTrial = profile.subscription_plan === 'prueba' && profile.rol !== 'estudiante';

  return (
    <>
      <TeacherTour run={runTour} onTourEnd={handleTourEnd} />
      <div className="flex h-screen bg-background">
        <Sidebar profile={profile} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header profile={profile} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-8" data-tour="main-content">
            {isTrial && <TrialBanner trialEndsAt={profile.trial_ends_at || null} />}
            <Outlet context={{ profile }} />
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;