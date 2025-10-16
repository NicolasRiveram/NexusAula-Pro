import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchClassesForMonth } from '@/api/planningApi';
import { parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDashboardWidgetsPrefs } from '@/api/settingsApi';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardWidgetGrid from '@/components/dashboard/teacher/DashboardWidgetGrid';
import { useAuth } from '@/contexts/AuthContext';

const TeacherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { activeEstablishment } = useEstablishment();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: highlightedDays = [] } = useQuery({
    queryKey: ['highlightedDays', user?.id, activeEstablishment?.id, selectedDate.getMonth()],
    queryFn: () => fetchClassesForMonth(user!.id, activeEstablishment!.id, selectedDate).then(classes => classes.map(c => parseISO(c.fecha))),
    enabled: !!user && !!activeEstablishment,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (newOrder: string[]) => {
      if (!user || !profile?.dashboard_widgets_prefs) throw new Error("No user or prefs found");
      const newPrefs = { ...profile.dashboard_widgets_prefs, order: newOrder };
      return updateDashboardWidgetsPrefs(user.id, newPrefs);
    },
    onMutate: async (newOrder: string[]) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['userProfile', user?.id] });
      const previousProfile = queryClient.getQueryData(['userProfile', user?.id]);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) => ({
        ...old,
        dashboard_widgets_prefs: {
          ...old.dashboard_widgets_prefs,
          order: newOrder,
        },
      }));
      return { previousProfile };
    },
    onError: (err, newOrder, context) => {
      showError("No se pudo guardar el nuevo orden.");
      if (context?.previousProfile) {
        queryClient.setQueryData(['userProfile', user?.id], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
  });

  const handleOrderChange = (newOrder: string[]) => {
    updatePrefsMutation.mutate(newOrder);
  };

  if (!profile) {
    return (
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-24 lg:col-span-3" />
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-80 lg:col-span-1" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const widgetPrefs = profile.dashboard_widgets_prefs;

  return (
    <div className="container mx-auto">
      {widgetPrefs ? (
        <DashboardWidgetGrid
          widgetOrder={widgetPrefs.order}
          widgetVisibility={widgetPrefs.visible}
          onOrderChange={handleOrderChange}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          highlightedDays={highlightedDays}
          activeEstablishment={activeEstablishment}
        />
      ) : (
        // Fallback for users without prefs (should not happen with default values)
        <p>No se pudo cargar la configuración del dashboard.</p>
      )}
    </div>
  );
};

export default TeacherDashboard;