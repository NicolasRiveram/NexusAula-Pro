import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FullPageLoader from '@/components/layout/FullPageLoader';
import TeacherCoursesPage from './courses/TeacherCoursesPage';
import StudentCoursesPage from './courses/StudentCoursesPage';

const CoursesPage = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (profile?.rol === 'estudiante') {
    return <StudentCoursesPage />;
  }
  
  return <TeacherCoursesPage />;
};

export default CoursesPage;