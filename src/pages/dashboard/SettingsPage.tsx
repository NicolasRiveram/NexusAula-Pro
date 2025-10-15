import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchUserProfile, fetchUserPedagogicalProfile, UserProfile, UserPedagogicalProfile } from '@/api/settingsApi';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import SubjectsAndLevelsForm from '@/components/settings/SubjectsAndLevelsForm';
import EstablishmentSettingsForm from '@/components/settings/EstablishmentSettingsForm';
import SubscriptionManager from '@/components/settings/SubscriptionSettingsCard';
import QuickActionsSettings from '@/components/settings/QuickActionsSettings';
import DashboardWidgetsSettings from '@/components/settings/DashboardWidgetsSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const SettingsPage = () => {
  const { user, profile: authProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user,
    onError: (error: any) => showError(error.message),
  });

  const { data: pedagogicalProfile, isLoading: isLoadingPedagogical } = useQuery({
    queryKey: ['pedagogicalProfile', user?.id],
    queryFn: () => fetchUserPedagogicalProfile(user!.id),
    enabled: !!user && authProfile?.rol !== 'estudiante',
    onError: (error: any) => showError(error.message),
  });

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['pedagogicalProfile', user?.id] });
  };

  const isAdmin = authProfile?.rol === 'administrador_establecimiento' || authProfile?.rol === 'coordinador';
  const isStudent = authProfile?.rol === 'estudiante';
  const canManageEstablishment = isAdmin || authProfile?.rol === 'docente';

  if (isLoadingProfile || (authProfile?.rol !== 'estudiante' && isLoadingPedagogical)) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile || !user) {
    return <div className="container mx-auto"><p>No se pudo cargar la información del perfil.</p></div>;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {!isStudent && <TabsTrigger value="pedagogical">Preferencias Pedagógicas</TabsTrigger>}
          {!isStudent && <TabsTrigger value="customization">Personalización</TabsTrigger>}
          {canManageEstablishment && <TabsTrigger value="establishment">Establecimiento</TabsTrigger>}
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileSettingsForm profile={profile} userId={user.id} onProfileUpdate={handleUpdate} />
        </TabsContent>
        {!isStudent && (
          <TabsContent value="pedagogical" className="mt-6">
            {pedagogicalProfile && (
              <SubjectsAndLevelsForm pedagogicalProfile={pedagogicalProfile} userId={user.id} />
            )}
          </TabsContent>
        )}
        {!isStudent && (
          <TabsContent value="customization" className="mt-6">
            <div className="space-y-6">
              <QuickActionsSettings userId={user.id} currentPrefs={profile.quick_actions_prefs || []} onUpdate={handleUpdate} />
              <DashboardWidgetsSettings userId={user.id} currentPrefs={profile.dashboard_widgets_prefs} onUpdate={handleUpdate} />
            </div>
          </TabsContent>
        )}
        {canManageEstablishment && (
          <TabsContent value="establishment" className="mt-6">
            <EstablishmentSettingsForm />
          </TabsContent>
        )}
        <TabsContent value="subscription" className="mt-6">
          <SubscriptionManager userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;