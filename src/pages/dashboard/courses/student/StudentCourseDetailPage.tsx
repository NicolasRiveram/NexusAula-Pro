import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User, Clock, FileText, Send, CheckCircle, BookOpen } from 'lucide-react';
import { fetchStudentCourseDetails, fetchStudentEvaluationsForCourse, fetchClassesForStudentCourse } from '@/api/student';
import { fetchScheduleForCourse } from '@/api/scheduleApi';
import { showError } from '@/utils/toast';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const StudentCourseDetailPage = () => {
  const { cursoAsignaturaId } = useParams<{ cursoAsignaturaId: string }>();
  const { user } = useAuth();

  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['studentCourseDetails', user?.id, cursoAsignaturaId],
    queryFn: () => fetchStudentCourseDetails(user!.id, cursoAsignaturaId!),
    enabled: !!user && !!cursoAsignaturaId,
    onError: (err: any) => showError(`Error al cargar detalles: ${err.message}`),
  });

  const { data: evaluations = [], isLoading: isLoadingEvals } = useQuery({
    queryKey: ['studentCourseEvals', user?.id, cursoAsignaturaId],
    queryFn: () => fetchStudentEvaluationsForCourse(user!.id, cursoAsignaturaId!),
    enabled: !!user && !!cursoAsignaturaId,
    onError: (err: any) => showError(`Error al cargar evaluaciones: ${err.message}`),
  });

  const { data: schedule = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['courseSchedule', cursoAsignaturaId],
    queryFn: () => fetchScheduleForCourse(cursoAsignaturaId!),
    enabled: !!cursoAsignaturaId,
    onError: (err: any) => showError(`Error al cargar horario: ${err.message}`),
  });

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['studentCourseClasses', cursoAsignaturaId],
    queryFn: () => fetchClassesForStudentCourse(cursoAsignaturaId!),
    enabled: !!cursoAsignaturaId,
    onError: (err: any) => showError(`Error al cargar clases: ${err.message}`),
  });

  const loading = isLoadingCourse || isLoadingEvals || isLoadingSchedule || isLoadingClasses;

  if (loading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!course) {
    return <div className="container mx-auto"><p>No se pudo encontrar la información del curso.</p></div>;
  }

  const pendingEvals = evaluations.filter(e => e.status === 'Pendiente' && e.fecha_aplicacion && !isPast(parseISO(e.fecha_aplicacion)));
  const completedEvals = evaluations.filter(e => e.status === 'Completado');

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/cursos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Mis Asignaturas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{course.asignatura_nombre}</CardTitle>
              <CardDescription>{course.nivel_nombre} {course.curso_nombre}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-muted-foreground">
                <User className="mr-2 h-4 w-4" />
                <span>Docente: {course.docente_nombre}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5" /> Clases y Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {classes.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{c.titulo}</p>
                        <p className="text-xs text-muted-foreground">Fecha: {format(parseISO(c.fecha), 'PPP', { locale: es })}</p>
                      </div>
                      <Badge variant={c.estado === 'realizada' ? 'default' : 'outline'} className="capitalize">{c.estado}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">Aún no hay clases planificadas para esta asignatura.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Evaluaciones Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingEvals.length > 0 ? (
                <div className="space-y-4">
                  {pendingEvals.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                      <div>
                        <p className="font-medium">{e.titulo}</p>
                        <p className="text-sm text-muted-foreground">Fecha: {e.fecha_aplicacion ? format(parseISO(e.fecha_aplicacion), 'PPP', { locale: es }) : 'Sin fecha'}</p>
                      </div>
                      <Button asChild><Link to={`/dashboard/evaluacion/${e.id}/responder`}><Send className="mr-2 h-4 w-4" /> Responder</Link></Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">¡No tienes evaluaciones pendientes en esta asignatura!</p>}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> Horario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {schedule.length > 0 ? schedule.map(s => (
                <div key={s.id} className="text-sm">
                  <p className="font-semibold">{diasSemana[s.dia_semana]}</p>
                  <p className="text-muted-foreground">{s.hora_inicio} - {s.hora_fin}</p>
                </div>
              )) : <p className="text-muted-foreground">No hay horario definido.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluaciones Completadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedEvals.length > 0 ? completedEvals.map(e => (
                <div key={e.id} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>{e.titulo}</span>
                </div>
              )) : <p className="text-muted-foreground text-sm">Aún no has completado evaluaciones.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentCourseDetailPage;