import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchCursosAsignaturasDocente, fetchCursosPorEstablecimiento, CursoAsignatura, CursoBase } from '@/api/coursesApi';
import { 
  fetchStudentPerformance, 
  fetchSkillPerformance, 
  fetchEstablishmentStudentPerformance,
  fetchEstablishmentSkillPerformance,
  StudentPerformance, 
  SkillPerformance 
} from '@/api/analyticsApi';
import { showError } from '@/utils/toast';
import PerformanceSummaryCard from '@/components/analytics/PerformanceSummaryCard';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface DashboardContext {
  profile: { rol: string };
}

const AnalyticsPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  const [selectedCursoId, setSelectedCursoId] = useState<string>('todos');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: cursos = [] } = useQuery({
    queryKey: ['analyticsCourses', user?.id, activeEstablishment?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return await fetchCursosPorEstablecimiento(activeEstablishment!.id);
      } else {
        const cursosData = await fetchCursosAsignaturasDocente(user!.id, activeEstablishment!.id);
        return Array.from(new Map(cursosData.map(item => [item.curso.id, item.curso])).values());
      }
    },
    enabled: !!user && !!activeEstablishment,
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analyticsData', user?.id, activeEstablishment?.id, selectedCursoId, isAdmin],
    queryFn: async () => {
      const cursoFilter = selectedCursoId === 'todos' ? null : selectedCursoId;
      let studentData, skillData;
      if (isAdmin) {
        [studentData, skillData] = await Promise.all([
          fetchEstablishmentStudentPerformance(activeEstablishment!.id, cursoFilter),
          fetchEstablishmentSkillPerformance(activeEstablishment!.id, cursoFilter),
        ]);
      } else {
        [studentData, skillData] = await Promise.all([
          fetchStudentPerformance(user!.id, activeEstablishment!.id, cursoFilter),
          fetchSkillPerformance(user!.id, activeEstablishment!.id, cursoFilter),
        ]);
      }
      return { studentPerformance: studentData, skillPerformance: skillData };
    },
    enabled: !!user && !!activeEstablishment,
    placeholderData: { studentPerformance: [], skillPerformance: [] },
  });

  const { studentPerformance, skillPerformance } = analyticsData || { studentPerformance: [], skillPerformance: [] };

  const { topPerformers, needsSupport } = useMemo(() => {
    const sortedStudents = [...studentPerformance].sort((a, b) => a.average_score - b.average_score);
    return {
      needsSupport: sortedStudents.slice(0, 5),
      topPerformers: sortedStudents.slice(-5).reverse(),
    };
  }, [studentPerformance]);

  const chartData = useMemo(() => skillPerformance.map(stat => ({
    name: stat.habilidad_nombre.substring(0, 15) + (stat.habilidad_nombre.length > 15 ? '...' : ''),
    Logro: Math.round(stat.promedio_logro),
  })), [skillPerformance]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analíticas de Rendimiento</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Visualiza el progreso de todo el establecimiento.' : 'Visualiza el progreso de tus estudiantes y el desarrollo de habilidades.'}
          </p>
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedCursoId} onValueChange={setSelectedCursoId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por curso..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cursos</SelectItem>
              {cursos.map(curso => (
                <SelectItem key={curso.id} value={curso.id}>
                  {curso.nivel.nombre} {curso.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para ver las analíticas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Habilidad</CardTitle>
              <CardDescription>Promedio de logro en las habilidades evaluadas.</CardDescription>
            </CardHeader>
            <CardContent>
              {skillPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="Logro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No hay datos de habilidades para mostrar.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceSummaryCard
              title="Estudiantes con Mejor Desempeño"
              description="Los 5 estudiantes con el rendimiento promedio más alto."
              icon={<TrendingUp className="h-6 w-6 text-green-500" />}
              students={topPerformers}
            />
            <PerformanceSummaryCard
              title="Estudiantes que Requieren Apoyo"
              description="Los 5 estudiantes con el rendimiento promedio más bajo."
              icon={<TrendingDown className="h-6 w-6 text-destructive" />}
              students={needsSupport}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;