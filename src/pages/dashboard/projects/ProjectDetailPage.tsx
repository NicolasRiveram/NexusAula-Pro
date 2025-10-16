import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FullPageLoader from '@/components/layout/FullPageLoader';
import TeacherProjectDetailPage from './teacher/TeacherProjectDetailPage';
import StudentProjectDetailPage from './student/StudentProjectDetailPage';

const ProjectDetailPage = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (profile?.rol === 'estudiante') {
    return <StudentProjectDetailPage />;
  }
  
  return <TeacherProjectDetailPage />;
};

export default ProjectDetailPage;