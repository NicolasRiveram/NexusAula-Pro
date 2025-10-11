import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import DashboardCalendar from '@/components/dashboard/teacher/DashboardCalendar';
import DailyAgenda from '@/components/dashboard/teacher/DailyAgenda';
import QuickActions from '@/components/dashboard/teacher/QuickActions';
import NotificationsPanel from '@/components/dashboard/teacher/NotificationsPanel';
import StatisticsWidget from '@/components/dashboard/teacher/StatisticsWidget';
import StudentsNeedingSupportWidget from '@/components/dashboard/teacher/StudentsNeedingSupportWidget';
import ActiveProjectsWidget from '@/components/dashboard/teacher/ActiveProjectsWidget';
import PendingLogsWidget from '@/components/dashboard/teacher/PendingLogsWidget';
import RecentEvaluationsWidget from '@/components/dashboard/teacher/RecentEvaluationsWidget';
import AnnouncementsWidget from '@/components/dashboard/teacher/AnnouncementsWidget';
import { fetchClassesForMonth } from '@/api/planningApi';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import WidgetCard from '@/components/dashboard/teacher/WidgetCard';
import { useOutletContext } from 'react-router-dom';
import { updateDashboardWidgetsPrefs } from '@/api/settingsApi';
import { showError } from '@/utils/toast';

interface DashboardContext {
  profile: {
    dashboard_widgets_prefs?: {
      order: string[];
      visible: Record<string, boolean>;
    };
  };
}

const TeacherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const [widgetPrefs, setWidgetPrefs] = useState(profile?.dashboard_widgets_prefs);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: highlightedDays = [] } = useQuery({
    queryKey: ['highlightedDays', user?.id, activeEstablishment?.id, selectedDate.getMonth()],
    queryFn: () => fetchClassesForMonth(user!.id, activeEstablishment!.id, selectedDate).then(classes => classes.map(c => parseISO(c.fecha))),
    enabled: !!user && !!activeEstablishment,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id && widgetPrefs) {
      const oldIndex = widgetPrefs.order.indexOf(active.id);
      const newIndex = widgetPrefs.order.indexOf(over.id);
      const newOrder = arrayMove(widgetPrefs.order, oldIndex, newIndex);
      const newPrefs = { ...widgetPrefs, order: newOrder };
      
      setWidgetPrefs(newPrefs); // Optimistic update
      
      try {
        await updateDashboardWidgetsPrefs(user!.id, newPrefs);
      } catch (error: any) {
        showError("No se pudo guardar el nuevo orden.");
        setWidgetPrefs(widgetPrefs); // Revert on error
      }
    }
  };

  const widgetComponents: Record<string, { title: React.ReactNode; description?: string; component: React.ReactNode; className: string }> = {
    acciones_rapidas: { title: 'Accesos Directos', component: <QuickActions />, className: 'lg:col-span-3' },
    agenda: { title: `Agenda para ${format(selectedDate, "EEEE, d 'de' LLLL", { locale: es })}`, component: <DailyAgenda selectedDate={selectedDate} activeEstablishment={activeEstablishment} />, className: 'lg:col-span-3' },
    calendario: { title: 'Calendario', component: <DashboardCalendar selectedDate={selectedDate} onDateSelect={(date) => date && setSelectedDate(date)} highlightedDays={highlightedDays} />, className: 'lg:col-span-1' },
    notificaciones: { title: 'Notificaciones', component: <NotificationsPanel />, className: 'lg:col-span-2' },
    estadisticas: { title: 'Estadísticas Clave', description: 'Rendimiento promedio por habilidad.', component: <StatisticsWidget />, className: 'lg:col-span-2' },
    estudiantes_apoyo: { title: 'Estudiantes que Requieren Apoyo', description: 'Alumnos con el rendimiento más bajo.', component: <StudentsNeedingSupportWidget />, className: 'lg:col-span-1' },
    evaluaciones_recientes: { title: 'Evaluaciones Recientes', description: 'Acceso rápido a los últimos resultados.', component: <RecentEvaluationsWidget />, className: 'lg:col-span-2' },
    anuncios: { title: 'Anuncios del Establecimiento', component: <AnnouncementsWidget />, className: 'lg:col-span-1' },
    bitacoras_pendientes: { title: 'Bitácoras Pendientes', description: 'Clases pasadas sin registro de bitácora.', component: <PendingLogsWidget />, className: 'lg:col-span-2' },
    proyectos_activos: { title: 'Proyectos Activos', description: 'Tus proyectos ABP en curso.', component: <ActiveProjectsWidget />, className: 'lg:col-span-1' },
  };

  const visibleWidgets = widgetPrefs ? widgetPrefs.order.filter(id => widgetPrefs.visible[id]) : [];

  return (
    <div className="container mx-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {visibleWidgets.map(widgetId => {
              const widget = widgetComponents[widgetId];
              if (!widget) return null;
              return (
                <WidgetCard key={widgetId} id={widgetId} title={widget.title} description={widget.description} className={widget.className}>
                  {widget.component}
                </WidgetCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TeacherDashboard;