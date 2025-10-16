import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TeacherCourseDetailPage from './courses/TeacherCourseDetailPage';
import StudentCourseDetailPage from './courses/StudentCourseDetailPage';
import { Loader2 } from 'lucide-react';

interface DashboardContext {
  profile: { rol: string };
}

const CourseDetailPage = () => {
  const { profile } = useOutletContext<DashboardContext>();

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