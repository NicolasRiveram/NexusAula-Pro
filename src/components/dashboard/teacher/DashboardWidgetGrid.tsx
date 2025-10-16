import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import WidgetCard from './WidgetCard';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import all widget components
import QuickActions from './QuickActions';
import DailyAgenda from './DailyAgenda';
import DashboardCalendar from './DashboardCalendar';
import NotificationsPanel from './NotificationsPanel';
import StatisticsWidget from './StatisticsWidget';
import StudentsNeedingSupportWidget from './StudentsNeedingSupportWidget';
import ActiveProjectsWidget from './ActiveProjectsWidget';
import PendingLogsWidget from './PendingLogsWidget';
import RecentEvaluationsWidget from './RecentEvaluationsWidget';
import AnnouncementsWidget from './AnnouncementsWidget';
import { Establishment } from '@/contexts/EstablishmentContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardWidgetGridProps {
  widgetOrder: string[];
  widgetVisibility: Record<string, boolean>;
  onOrderChange: (newOrder: string[]) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  highlightedDays: Date[];
  activeEstablishment: Establishment | null;
}

const DashboardWidgetGrid: React.FC<DashboardWidgetGridProps> = ({
  widgetOrder,
  widgetVisibility,
  onOrderChange,
  selectedDate,
  setSelectedDate,
  highlightedDays,
  activeEstablishment,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      onOrderChange(newOrder);
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

  const visibleWidgets = widgetOrder.filter(id => widgetVisibility[id]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={visibleWidgets} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visibleWidgets.map(widgetId => {
            const widget = widgetComponents[widgetId];
            if (!widget) return null;
            return (
              <ErrorBoundary key={widgetId} fallbackMessage={`No se pudo cargar el widget "${widget.title}".`}>
                <WidgetCard id={widgetId} title={widget.title} description={widget.description} className={widget.className}>
                  {widget.component}
                </WidgetCard>
              </ErrorBoundary>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DashboardWidgetGrid;