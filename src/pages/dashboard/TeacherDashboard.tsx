import React from 'react';
import UpcomingClasses from '@/components/dashboard/teacher/UpcomingClasses';
import QuickActions from '@/components/dashboard/teacher/QuickActions';
import NotificationsPanel from '@/components/dashboard/teacher/NotificationsPanel';
import StatisticsWidget from '@/components/dashboard/teacher/StatisticsWidget';

const TeacherDashboard = () => {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingClasses />
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