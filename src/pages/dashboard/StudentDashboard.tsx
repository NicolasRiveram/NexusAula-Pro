import React from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentDashboardData, fetchStudentCourses } from '@/api/studentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, Megaphone, Book, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { activeEstablishment } = useEstablishment();
  const { data: { user } } = supabase.auth.getUser();

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['studentDashboard', user?.id, activeEstablishment?.id, new Date().toDateString()],
    queryFn: () => fetchStudentDashboardData(user!.id, activeEstablishment!.id, new Date()),
    enabled: !!user && !!activeEstablishment,
  });

  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['studentCourses', user?.id, activeEstablishment?.id],
    queryFn: () => fetchStudentCourses(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  if (!activeEstablishment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold">Bienvenido/a</h3>
        <p className="text-muted-foreground mt-2">
          Por favor, selecciona tu establecimiento en la parte superior para ver tu información.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? <Loader2 className="animate-spin" /> : (
                <div className="space-y-4">
                  {dashboardData?.agenda.length === 0 && <p className="text-muted-foreground">No tienes actividades para hoy.</p>}
                  {dashboardData?.agenda.map(item => (
                    <div key={item.id} className="flex items-center">
                      {item.type === 'class' ? <Clock className="h-5 w-5 mr-3 text-primary" /> : <FileText className="h-5 w-5 mr-3 text-orange-500" />}
                      <div>
                        <p className="font-medium">{item.titulo}</p>
                        <p className="text-sm text-muted-foreground">{item.curso_info} {item.hora_inicio && `- ${item.hora_inicio}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCourses ? <Loader2 className="animate-spin" /> : (
                <div className="space-y-2">
                  {coursesData?.map(course => (
                    <Link to={`/dashboard/cursos/${course.id}`} key={course.id} className="block p-2 rounded-md hover:bg-muted">
                      <p className="font-semibold">{course.asignatura_nombre}</p>
                      <p className="text-sm text-muted-foreground">{course.nivel_nombre} {course.curso_nombre}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Anuncios</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? <Loader2 className="animate-spin" /> : (
                <div className="space-y-4">
                  {dashboardData?.anuncios.length === 0 && <p className="text-muted-foreground">No hay anuncios.</p>}
                  {dashboardData?.anuncios.map(anuncio => (
                    <div key={anuncio.id}>
                      <p className="font-semibold text-sm">{anuncio.titulo}</p>
                      <p className="text-sm text-muted-foreground">{anuncio.mensaje}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;