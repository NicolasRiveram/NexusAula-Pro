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
import { useQuery } from '@tanstack/react-query';

const TeacherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { activeEstablishment } = useEstablishment();

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