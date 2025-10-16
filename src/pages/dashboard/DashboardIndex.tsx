import React from 'react';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DashboardIndex = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isSuperAdmin = profile.rol === 'super_administrador';
  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  const isStudent = profile.rol === 'estudiante';

  if (isSuperAdmin) return <SuperAdminDashboard />;
  if (isAdmin) return <AdminDashboard />;
  if (isStudent) return <StudentDashboard />;
  return <TeacherDashboard />;
};

export default DashboardIndex;