import React from 'react';
import TeacherCourseDetailPage from './courses/TeacherCourseDetailPage';
import StudentCourseDetailPage from './courses/StudentCourseDetailPage';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CourseDetailPage = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (profile.rol === 'estudiante') {
    return <StudentCourseDetailPage />;
  }
  
  return <TeacherCourseDetailPage />;
};

export default CourseDetailPage;