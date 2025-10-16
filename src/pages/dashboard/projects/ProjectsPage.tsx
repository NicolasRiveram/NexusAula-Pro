import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FullPageLoader from '@/components/layout/FullPageLoader';
import TeacherProjectsPage from './teacher/TeacherProjectsPage';
import StudentProjectsPage from './student/StudentProjectsPage';

const ProjectsPage = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (profile?.rol === 'estudiante') {
    return <StudentProjectsPage />;
  }
  
  return <TeacherProjectsPage />;
};

export default ProjectsPage;