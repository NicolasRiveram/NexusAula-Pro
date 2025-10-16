import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { fetchStudentEvaluationHistory, fetchStudentPerformanceStats, fetchStudentSkillPerformance } from '@/api/student';
import { fetchEvaluationsForStudent, StudentRubricEvaluation } from '@/api/rubricsApi';
import { showError } from '@/utils/toast';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateGrade } from '@/utils/evaluationUtils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const MyProgressPage = () => {
  const { user } = useAuth();
  const studentId = user?.id;

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['studentPerformanceStats', studentId],
    queryFn: () => fetchStudentPerformanceStats(studentId!),
    enabled: !!studentId,
  });

  const { data: skillPerformance, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['studentSkillPerformance', studentId],
    queryFn: () => fetchStudentSkillPerformance(studentId!),
    enabled: !!studentId,
  });

  const { data: evaluationHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['studentEvaluationHistory', studentId],
    queryFn: () => fetchStudentEvaluationHistory(studentId!),
    enabled: !!studentId,
  });

  const { data: rubricEvaluations, isLoading: isLoadingRubrics } = useQuery({
    queryKey: ['studentRubricEvaluations', studentId],
    queryFn: () => fetchEvaluationsForStudent(studentId!),
    enabled: !!studentId,
  });

  const isLoading = isLoadingStats || isLoadingSkills || isLoadingHistory || isLoadingRubrics;

  if (isLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Progreso</h1>
        <p className="text-muted-foreground">Un resumen de tu rendimiento académico.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
              <CardHeader>
                  <CardTitle>Rendimiento General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <p className="text-sm font-medium">Promedio General de Logro</p>
                      <p className="text-2xl font-bold">{stats?.average_score?.toFixed(1) ?? 'N/A'}%</p>
                      <Progress value={stats?.average_score ?? 0} className="mt-1" />
                  </div>
                  <div>
                      <p className="text-sm font-medium">Evaluaciones Completadas</p>
                      <p className="text-2xl font-bold">{stats?.completed_evaluations ?? 0} / {stats?.total_evaluations ?? 0}</p>
                  </div>
              </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
              <CardHeader>
                  <CardTitle>Desempeño por Habilidad</CardTitle>
                  <CardDescription>Tu promedio de logro en las diferentes habilidades evaluadas.</CardDescription>
              </CardHeader>
              <CardContent>
                  {skillPerformance && skillPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={skillPerformance.map(s => ({ name: s.habilidad_nombre, Logro: s.promedio_logro }))}>
                              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Logro']} />
                              <Legend />
                              <Bar dataKey="Logro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <p className="text-center text-muted-foreground py-10">No hay datos de habilidades para mostrar.</p>
                  )}
              </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Evaluaciones (Pruebas)</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluationHistory && evaluationHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evaluación</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Nota (60%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluationHistory.map(ev => {
                  const nota = calculateGrade(ev.score_obtained, ev.max_score);
                  return (
                    <TableRow key={ev.evaluation_id}>
                      <TableCell className="font-medium">{ev.evaluation_title}</TableCell>
                      <TableCell>{format(parseISO(ev.response_date), "d LLL, yyyy", { locale: es })}</TableCell>
                      <TableCell>{ev.score_obtained} / {ev.max_score}</TableCell>
                      <TableCell>
                        <span className={cn("font-semibold", nota < 4.0 ? "text-destructive" : "text-green-600")}>
                          {nota.toFixed(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center">No hay historial de pruebas para mostrar.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Evaluaciones (Rúbricas)</CardTitle>
        </CardHeader>
        <CardContent>
          {rubricEvaluations && rubricEvaluations.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {rubricEvaluations.map(evaluation => (
                <AccordionItem key={evaluation.id} value={evaluation.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4 items-center">
                      <div className="text-left">
                        <p className="font-semibold">{evaluation.rubrica.nombre}</p>
                        <p className="text-sm text-muted-foreground">{evaluation.curso_asignatura.asignaturas.nombre} - {format(parseISO(evaluation.created_at), "d LLL, yyyy", { locale: es })}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={cn("text-base", evaluation.calificacion_final < 4.0 ? "text-destructive border-destructive" : "text-green-600 border-green-600")}>
                          Nota: {evaluation.calificacion_final.toFixed(1)}
                        </Badge>
                        <Badge>Puntaje: {evaluation.puntaje_obtenido}/{evaluation.puntaje_maximo}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left">
                            <th className="p-2 border-b font-medium">Criterio</th>
                            <th className="p-2 border-b font-medium">Nivel Logrado</th>
                            <th className="p-2 border-b font-medium text-right">Puntaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluation.rubrica.contenido_json.criterios.map((criterion, critIndex) => {
                            const selectedLevelIndex = evaluation.resultados_json[critIndex];
                            const selectedLevel = criterion.niveles[selectedLevelIndex];
                            return (
                              <tr key={critIndex}>
                                <td className="p-2 border-b">{criterion.nombre}</td>
                                <td className="p-2 border-b">{selectedLevel?.nombre || 'N/A'}</td>
                                <td className="p-2 border-b text-right">{selectedLevel?.puntaje || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {evaluation.comentarios && (
                        <div className="pt-4">
                          <h4 className="font-semibold">Comentarios del Docente</h4>
                          <p className="text-muted-foreground italic bg-muted/50 p-3 rounded-md">"{evaluation.comentarios}"</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center">No tienes evaluaciones con rúbrica registradas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProgressPage;