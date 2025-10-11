import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useTeacherTour } from '@/hooks/useTeacherTour';
import TeacherTour from '@/components/tour/TeacherTour';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ nombre_completo: string, rol: string, quick_actions_prefs?: string[] } | null>(null);
  const { runTour, handleTourEnd } = useTeacherTour(profile?.rol || '');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('nombre_completo, rol, quick_actions_prefs')
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

  return (
    <>
      <TeacherTour run={runTour} onTourEnd={handleTourEnd} />
      <div className="flex h-screen bg-background">
        <Sidebar profile={profile} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header profile={profile} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-8" data-tour="main-content">
            <Outlet context={{ profile }} />
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;