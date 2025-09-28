import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { fetchAsignaturas, fetchNiveles, fetchUserProfile, Asignatura, Nivel } from './api';
import { UseFormSetValue } from 'react-hook-form';
import { FormData } from './schemas';

interface UseProfileDataResult {
  asignaturas: Asignatura[];
  niveles: Nivel[];
  loadingData: boolean;
  profileComplete: boolean | null;
}

export const useProfileData = (setValue: UseFormSetValue<FormData>): UseProfileDataResult => {
  const navigate = useNavigate();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("No se encontró usuario autenticado.");
        navigate('/login');
        setLoadingData(false);
        return;
      }

      try {
        const profileData = await fetchUserProfile(user.id);
        if (profileData?.perfil_completo) {
          showSuccess("Tu perfil ya está configurado. Redirigiendo al dashboard.");
          setProfileComplete(true);
          navigate('/dashboard');
          setLoadingData(false);
          return;
        } else {
          setProfileComplete(false);
          setValue('nombre_completo', profileData?.nombre_completo || user.email?.split('@')[0] || '');
          setValue('rol_seleccionado', profileData?.rol || undefined);
        }

        const fetchedAsignaturas = await fetchAsignaturas();
        setAsignaturas(fetchedAsignaturas);

        const fetchedNiveles = await fetchNiveles();
        setNiveles(fetchedNiveles);

      } catch (error: any) {
        console.error("Error al cargar datos iniciales:", error);
        showError("Error al cargar los datos iniciales: " + error.message);
        setProfileComplete(false);
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [navigate, setValue]);

  return { asignaturas, niveles, loadingData, profileComplete };
};