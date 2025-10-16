import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FullPageLoader from '@/components/layout/FullPageLoader';
import TeacherEvaluationPage from './teacher/TeacherEvaluationPage';
import StudentEvaluationPage from './student/StudentEvaluationPage';

const EvaluationPage = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (profile?.rol === 'estudiante') {
    return <StudentEvaluationPage />;
  }

  return <TeacherEvaluationPage />;
};

export default EvaluationPage;