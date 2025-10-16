import React from 'react';
import { Link } from 'react-router-dom';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchStudentCourses, StudentCourse } from '@/api/studentApi';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const StudentCoursesPage = () => {
  const { user } = useAuth();
  const { activeEstablishment } = useEstablishment();

  const { data: studentCourses = [], isLoading: loading } = useQuery({
    queryKey: ['courses', user?.id, activeEstablishment?.id, 'student'],
    queryFn: () => fetchStudentCourses(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Mis Asignaturas</h1>
        <p className="text-muted-foreground">Aquí puedes ver todas las asignaturas en las que estás inscrito.</p>
      </div>
      {loading ? (
        <p>Cargando cursos...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">
            Por favor, elige un establecimiento en la cabecera para ver tus cursos.
          </p>
        </div>
      ) : studentCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentCourses.map(course => (
            <Link to={`/dashboard/cursos/${course.id}`} key={course.id} className="block h-full">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle>{course.asignatura_nombre}</CardTitle>
                  <CardDescription>{course.nivel_nombre} {course.curso_nombre}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Docente: {course.docente_nombre || 'No asignado'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No estás inscrito en ninguna asignatura</h3>
          <p className="text-muted-foreground mt-2">
            Contacta al administrador de tu establecimiento para que te inscriba en tus cursos.
          </p>
        </div>
      )}
    </>
  );
};

export default StudentCoursesPage;