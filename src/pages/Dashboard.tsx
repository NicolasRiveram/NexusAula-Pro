import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useTeacherTour } from '@/hooks/useTeacherTour';
import TeacherTour from '@/components/tour/TeacherTour';
import TrialBanner from '@/components/layout/TrialBanner';
import { useAuth } from '@/contexts/AuthContext';
import FullPageLoader from '@/components/layout/FullPageLoader';

const Dashboard = () => {
  const { profile } = useAuth();
  const { runTour, handleTourEnd } = useTeacherTour(profile?.rol || '');

  if (!profile) {
    return <FullPageLoader />;
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
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;