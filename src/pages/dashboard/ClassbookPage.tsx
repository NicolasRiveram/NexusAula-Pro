import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCursosAsignaturasDocente, fetchCursosPorEstablecimiento, CursoAsignatura, CursoBase } from '@/api/coursesApi';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import ClassbookTable from '@/components/classbook/ClassbookTable';
import { ClassbookData, fetchClassbookData } from '@/api/classbookApi';

interface DashboardContext {
  profile: { rol: string };
}

const ClassbookPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  
  const [courses, setCourses] = useState<(CursoAsignatura | CursoBase)[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [classbookData, setClassbookData] = useState<ClassbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClassbook, setLoadingClassbook] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      if (!activeEstablishment) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          if (isAdmin) {
            const data = await fetchCursosPorEstablecimiento(activeEstablishment.id);
            setCourses(data);
          } else {
            const data = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
            setCourses(data);
          }
        } catch (err: any) { showError(err.message); }
      }
      setLoading(false);
    };
    loadCourses();
  }, [activeEstablishment, isAdmin]);

  useEffect(() => {
    const loadClassbook = async () => {
      if (selectedCourseId) {
        setLoadingClassbook(true);
        try {
          const data = await fetchClassbookData(selectedCourseId);
          setClassbookData(data);
        } catch (err: any) {
          showError(err.message);
        } finally {
          setLoadingClassbook(false);
        }
      } else {
        setClassbookData(null);
      }
    };
    loadClassbook();
  }, [selectedCourseId]);

  const getCourseLabel = (course: CursoAsignatura | CursoBase) => {
    if ('asignatura' in course) {
      return `${course.curso.nivel.nombre} ${course.curso.nombre} - ${course.asignatura.nombre}`;
    }
    return `${course.nivel.nombre} ${course.nombre}`;
  };

  const getCourseId = (course: CursoAsignatura | CursoBase) => {
    if ('asignatura' in course) {
      return course.curso.id;
    }
    return course.id;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Libro de Clases Digital</h1>
          <p className="text-muted-foreground">Vista consolidada de las calificaciones de tus cursos.</p>
        </div>
        <div className="w-72">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un curso..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={getCourseId(course)}>
                  {getCourseLabel(course)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p>Cargando cursos...</p>
          ) : !activeEstablishment ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
              <p className="text-muted-foreground mt-2">Elige un establecimiento para ver el libro de clases.</p>
            </div>
          ) : loadingClassbook ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : classbookData ? (
            <ClassbookTable data={classbookData} />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold">Selecciona un curso</h3>
              <p className="text-muted-foreground mt-2">Elige un curso para ver las calificaciones de los estudiantes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassbookPage;