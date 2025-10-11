import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import DashboardCalendar from '@/components/dashboard/teacher/DashboardCalendar';
import DailyAgenda from '@/components/dashboard/teacher/DailyAgenda';
import QuickActions from '@/components/dashboard/teacher/QuickActions';
import NotificationsPanel from '@/components/dashboard/teacher/NotificationsPanel';
import StatisticsWidget from '@/components/dashboard/teacher/StatisticsWidget';
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

const WIDGETS = [
  'agenda',
  'calendario',
  'acciones_rapidas',
  'notificaciones',
  'estadisticas',
];

const TeacherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { activeEstablishment } = useEstablishment();
  const [widgetOrder, setWidgetOrder] = useState<string[]>(WIDGETS);

  useEffect(() => {
    const savedOrder = localStorage.getItem('teacherDashboardOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Validar que el orden guardado contenga todos los widgets esperados
        if (WIDGETS.every(widget => parsedOrder.includes(widget))) {
          setWidgetOrder(parsedOrder);
        }
      } catch (e) {
        console.error("Failed to parse widget order from localStorage", e);
      }
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: highlightedDays = [] } = useQuery({
    queryKey: ['highlightedDays', user?.id, activeEstablishment?.id, selectedDate.getMonth()],
    queryFn: async () => {
      const classes = await fetchClassesForMonth(user!.id, activeEstablishment!.id, selectedDate);
      return classes.map(c => parseISO(c.fecha));
    },
    enabled: !!user && !!activeEstablishment,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('teacherDashboardOrder', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const widgetComponents: Record<string, { title: React.ReactNode; description?: string; component: React.ReactNode }> = {
    agenda: {
      title: `Agenda para ${format(selectedDate, "EEEE, d 'de' LLLL", { locale: es })}`,
      component: <DailyAgenda selectedDate={selectedDate} activeEstablishment={activeEstablishment} />,
    },
    calendario: {
      title: 'Calendario',
      component: <DashboardCalendar selectedDate={selectedDate} onDateSelect={(date) => date && setSelectedDate(date)} highlightedDays={highlightedDays} />,
    },
    acciones_rapidas: {
      title: 'Accesos Directos',
      component: <QuickActions />,
    },
    notificaciones: {
      title: 'Notificaciones',
      component: <NotificationsPanel />,
    },
    estadisticas: {
      title: 'Estadísticas Clave',
      description: 'Rendimiento promedio por habilidad en tus cursos.',
      component: <StatisticsWidget />,
    },
  };

  return (
    <div className="container mx-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 gap-6">
            {widgetOrder.map(widgetId => {
              const widget = widgetComponents[widgetId];
              if (!widget) return null;
              return (
                <WidgetCard key={widgetId} id={widgetId} title={widget.title} description={widget.description}>
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