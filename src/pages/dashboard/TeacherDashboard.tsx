import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import DashboardCalendar from '@/components/dashboard/teacher/DashboardCalendar';
import DailyAgenda from '@/components/dashboard/teacher/DailyAgenda';
import QuickActions from '@/components/dashboard/teacher/QuickActions';
import NotificationsPanel from '@/components/dashboard/teacher/NotificationsPanel';
import StatisticsWidget from '@/components/dashboard/teacher/StatisticsWidget';
import { fetchClassesForMonth } from '@/api/planningApi';
import { parseISO } from 'date-fns';

const TeacherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [highlightedDays, setHighlightedDays] = useState<Date[]>([]);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadHighlights = async () => {
      if (!activeEstablishment) {
        setHighlightedDays([]);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          // Podríamos expandir esto para incluir evaluaciones también
          const classes = await fetchClassesForMonth(user.id, activeEstablishment.id, selectedDate);
          const daysWithClasses = classes.map(c => parseISO(c.fecha));
          setHighlightedDays(daysWithClasses);
        } catch (error) {
          console.error("Error loading highlights:", error);
        }
      }
    };
    loadHighlights();
  }, [selectedDate, activeEstablishment]);

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCalendar
              selectedDate={selectedDate}
              onDateSelect={(date) => date && setSelectedDate(date)}
              highlightedDays={highlightedDays}
            />
            <DailyAgenda
              selectedDate={selectedDate}
              activeEstablishment={activeEstablishment}
            />
          </div>
          <QuickActions />
        </div>

        {/* Columna lateral */}
        <div className="lg:col-span-1 space-y-6">
          <NotificationsPanel />
          <StatisticsWidget />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;