import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import { Loader2 } from 'lucide-react';

interface Profile {
  nombre_completo: string;
  rol: string;
}

interface DashboardContext {
  profile: Profile | null;
}

const DashboardIndex = () => {
  const { profile } = useOutletContext<DashboardContext>();

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  const isStudent = profile.rol === 'estudiante';

  if (isAdmin) return <AdminDashboard />;
  if (isStudent) return <StudentDashboard />;
  return <TeacherDashboard />;
};

export default DashboardIndex;