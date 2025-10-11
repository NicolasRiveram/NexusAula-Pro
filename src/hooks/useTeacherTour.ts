import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTeacherTour = (profileRole: string) => {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const checkTourStatus = async () => {
      // El tour es solo para docentes y administradores, no para estudiantes.
      if (profileRole === 'estudiante' || profileRole === 'super_administrador') {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('ha_visto_tour')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching tour status:", error);
          return;
        }

        if (data && !data.ha_visto_tour) {
          // Iniciar el tour solo si no lo ha visto antes.
          setRunTour(true);
        }
      }
    };

    // Damos un pequeño retraso para que la UI principal se cargue primero.
    const timer = setTimeout(checkTourStatus, 1500);
    return () => clearTimeout(timer);
  }, [profileRole]);

  const handleTourEnd = useCallback(async () => {
    setRunTour(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('perfiles')
        .update({ ha_visto_tour: true })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating tour status:", error);
      }
    }
  }, []);

  return { runTour, handleTourEnd };
};