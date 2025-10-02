import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchUserProfile, fetchUserPedagogicalProfile, UserProfile, UserPedagogicalProfile } from '@/api/settingsApi';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import SubjectsAndLevelsForm from '@/components/settings/SubjectsAndLevelsForm';
import EstablishmentSettingsForm from '@/components/settings/EstablishmentSettingsForm';
import SubscriptionManager from '@/components/settings/SubscriptionSettingsCard';

interface DashboardContext {
  profile: { rol: string };
}

const SettingsPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pedagogicalProfile, setPedagogicalProfile] = useState<UserPedagogicalProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile: userRoleProfile } = useOutletContext<DashboardContext>();

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      try {
        const profileData = await fetchUserProfile(user.id);
        setProfile(profileData);

        if (userRoleProfile?.rol !== 'estudiante') {
          const pedagogicalData = await fetchUserPedagogicalProfile(user.id);
          setPedagogicalProfile(pedagogicalData);
        }
      } catch (error: any) {
        showError(error.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userRoleProfile) {
      loadData();
    }
  }, [userRoleProfile]);

  const isAdmin = userRoleProfile?.rol === 'administrador_establecimiento' || userRoleProfile?.rol === 'coordinador';
  const isStudent = userRoleProfile?.rol === 'estudiante';
  const canManageEstablishment = isAdmin || userRoleProfile?.rol === 'docente';

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile || !userId) {
    return <div className="container mx-auto"><p>No se pudo cargar la información del perfil.</p></div>;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {!isStudent && <TabsTrigger value="pedagogical">Preferencias Pedagógicas</TabsTrigger>}
          {canManageEstablishment && <TabsTrigger value="establishment">Establecimiento</TabsTrigger>}
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileSettingsForm profile={profile} userId={userId} onProfileUpdate={loadData} />
        </TabsContent>
        {!isStudent && (
          <TabsContent value="pedagogical" className="mt-6">
            {pedagogicalProfile && (
              <SubjectsAndLevelsForm pedagogicalProfile={pedagogicalProfile} userId={userId} />
            )}
          </TabsContent>
        )}
        {canManageEstablishment && (
          <TabsContent value="establishment" className="mt-6">
            <EstablishmentSettingsForm />
          </TabsContent>
        )}
        <TabsContent value="subscription" className="mt-6">
          <SubscriptionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;