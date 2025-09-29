import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Loader2, TrendingDown, TrendingUp, UserCheck } from 'lucide-react';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { fetchStudentPerformance, fetchSkillPerformance, StudentPerformance, SkillPerformance } from '@/api/analyticsApi';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const AnalyticsPage = () => {
  const { activeEstablishment } = useEstablishment();
  const [cursos, setCursos] = useState<CursoAsignatura[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>('todos');
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [skillPerformance, setSkillPerformance] = useState<SkillPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      if (activeEstablishment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const cursosData = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
            setCursos(cursosData);
          } catch (err: any) {
            showError(`Error al cargar filtros: ${err.message}`);
          }
        }
      }
    };
    loadFilters();
  }, [activeEstablishment]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (activeEstablishment) {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const cursoFilter = selectedCursoId === 'todos' ? null : selectedCursoId;
            const [studentData, skillData] = await Promise.all([
              fetchStudentPerformance(user.id, activeEstablishment.id, cursoFilter),
              fetchSkillPerformance(user.id, activeEstablishment.id, cursoFilter),
            ]);
            setStudentPerformance(studentData);
            setSkillPerformance(skillData);
          } catch (err: any) {
            showError(`Error al cargar analíticas: ${err.message}`);
          }
        }
        setLoading(false);
      } else {
        setLoading(false);
        setStudentPerformance([]);
        setSkillPerformance([]);
      }
    };
    loadAnalytics();
  }, [activeEstablishment, selectedCursoId]);

  const topStudents = useMemo(() => [...studentPerformance].sort((a, b) => b.average_score - a.average_score).slice(0, 5), [studentPerformance]);
  const studentsToWatch = useMemo(() => [...studentPerformance].sort((a, b) => a.average_score - b.average_score).slice(0, 5), [studentPerformance]);

  const chartData = skillPerformance.map(stat => ({
    name: stat.habilidad_nombre.substring(0, 15) + (stat.habilidad_nombre.length > 15 ? '...' : ''),
    Logro: Math.round(stat.promedio_logro),
  }));

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analíticas de Rendimiento</h1>
          <p className="text-muted-foreground">Visualiza el progreso de tus estudiantes y el desarrollo de habilidades.</p>
        </div>
        <div className="w-64">
          <Select value={selectedCursoId} onValueChange={setSelectedCursoId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por curso..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cursos</SelectItem>
              {cursos.map(curso => (
                <SelectItem key={curso.id} value={curso.curso.id}>
                  {curso.curso.nivel.nombre} {curso.curso.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
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

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><TrendingUp className="mr-2 text-green-500" /> Estudiantes Destacados</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentTable students={topStudents} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><TrendingDown className="mr-2 text-destructive" /> Estudiantes a Observar</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentTable students={studentsToWatch} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentTable = ({ students }: { students: StudentPerformance[] }) => {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay datos de estudiantes.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estudiante</TableHead>
          <TableHead className="text-right">Promedio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map(student => (
          <TableRow key={student.student_id}>
            <TableCell>
              <Link to={`/dashboard/estudiante/${student.student_id}`} className="font-medium hover:underline">
                {student.student_name}
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={student.average_score >= 60 ? "default" : "destructive"}>
                {student.average_score.toFixed(1)}%
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AnalyticsPage;