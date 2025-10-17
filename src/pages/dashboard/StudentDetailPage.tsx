import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail, User, Hash, FileSignature, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { fetchStudentProfile, Estudiante, fetchStudentEnrollments, StudentEnrollment, fetchStudentEvaluationHistory, StudentEvaluationHistory, fetchStudentPerformanceStats, StudentPerformanceStats, fetchStudentSkillPerformance, StudentSkillPerformance, fetchStudentResponseDetailsForHistory, StudentResponseDetail } from '@/api/coursesApi';
import { fetchEvaluationsForStudent, StudentRubricEvaluation } from '@/api/rubricsApi';
import { showError } from '@/utils/toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateGrade } from '@/utils/evaluationUtils';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

interface ResponseDetailViewProps {
  studentId: string;
  evaluationId: string;
}

const ResponseDetailView: React.FC<ResponseDetailViewProps> = ({ studentId, evaluationId }) => {
  const [details, setDetails] = useState<StudentResponseDetail[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentResponseDetailsForHistory(studentId, evaluationId)
      .then(setDetails)
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  }, [studentId, evaluationId]);

  if (loading) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!details || details.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No se encontraron detalles para esta evaluación.</p>;
  }

  const correctCount = details.filter(d => d.es_correcto).length;
  const errorCount = details.length - correctCount;

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-4">
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">Aciertos: {correctCount}</Badge>
        <Badge variant="destructive">Errores: {errorCount}</Badge>
      </div>
      {details.map((detail, index) => (
        <div key={detail.id}>
          <p className="font-semibold">{index + 1}. {detail.evaluacion_items.enunciado}</p>
          {detail.evaluacion_items.habilidad_evaluada && <Badge variant="outline" className="mt-1">{detail.evaluacion_items.habilidad_evaluada}</Badge>}
          <ul className="mt-2 space-y-1 text-sm">
            {detail.evaluacion_items.item_alternativas.map((alt, altIndex) => {
              const isSelected = alt.id === detail.alternativa_seleccionada_id;
              const isCorrect = alt.es_correcta;
              return (
                <li key={alt.id} className={cn("flex items-center p-2 rounded-md", isSelected && "bg-blue-100 dark:bg-blue-900/30", isCorrect && "font-bold")}>
                  <span className="mr-2">{String.fromCharCode(97 + altIndex)})</span>
                  <span>{alt.texto}</span>
                  {isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />}
                  {isSelected && !isCorrect && <XCircle className="h-4 w-4 ml-auto text-destructive" />}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

const StudentDetailPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Estudiante | null>(null);
  const [rubricEvaluations, setRubricEvaluations] = useState<StudentRubricEvaluation[]>([]);
  const [evaluationHistory, setEvaluationHistory] = useState<StudentEvaluationHistory[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [stats, setStats] = useState<StudentPerformanceStats | null>(null);
  const [skillPerformance, setSkillPerformance] = useState<StudentSkillPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>();

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      Promise.all([
        fetchStudentProfile(studentId),
        fetchEvaluationsForStudent(studentId),
        fetchStudentEnrollments(studentId),
        fetchStudentEvaluationHistory(studentId),
        fetchStudentPerformanceStats(studentId),
        fetchStudentSkillPerformance(studentId)
      ]).then(([studentData, rubricData, enrollmentsData, historyData, statsData, skillData]) => {
        setStudent(studentData);
        setRubricEvaluations(rubricData);
        setEnrollments(enrollmentsData);
        setEvaluationHistory(historyData);
        setStats(statsData);
        setSkillPerformance(skillData);
      }).catch(err => {
        showError(`Error al cargar datos del estudiante: ${err.message}`);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [studentId]);

  if (loading) {
    return <div className="container mx-auto"><p>Cargando perfil del estudiante...</p></div>;
  }

  if (!student) {
    return <div className="container mx-auto"><p>No se pudo encontrar al estudiante.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
       <div className="flex justify-between items-center">
        <Link to="/dashboard/cursos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Cursos
        </Link>
        <Button asChild>
          <Link to={`/dashboard/informes/generar?studentId=${studentId}`}>
            <FileSignature className="mr-2 h-4 w-4" /> Generar Informe Pedagógico
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{student.nombre_completo}</CardTitle>
          <CardDescription>Perfil del Estudiante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Nombre:</span>
              <span className="ml-2">{student.nombre_completo}</span>
            </div>
            <div className="flex items-center">
              <Hash className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">RUT:</span>
              <span className="ml-2">{student.rut || 'No especificado'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span className="ml-2">{student.email || 'No especificado'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
              <CardHeader>
                  <CardTitle>Rendimiento General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <p className="text-sm font-medium">Promedio General</p>
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
                  <CardDescription>Promedio de logro en las habilidades evaluadas.</CardDescription>
              </CardHeader>
              <CardContent>
                  {skillPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={skillPerformance.map(s => ({ name: s.habilidad_nombre, Logro: s.promedio_logro }))}>
                              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Logro']} />
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
          {evaluationHistory.length > 0 ? (
            <Accordion type="single" collapsible value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
              {evaluationHistory.map(ev => {
                const nota = calculateGrade(ev.score_obtained, ev.max_score);
                return (
                  <AccordionItem key={ev.evaluation_id} value={ev.evaluation_id}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4 items-center">
                        <div className="text-left">
                          <p className="font-semibold">{ev.evaluation_title}</p>
                          <p className="text-sm text-muted-foreground">{format(parseISO(ev.response_date), "d LLL, yyyy", { locale: es })}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge>Puntaje: {ev.score_obtained} / {ev.max_score}</Badge>
                          <Badge variant="outline" className={cn("text-base", nota < 4.0 ? "text-destructive border-destructive" : "text-green-600 border-green-600")}>
                            Nota: {nota.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {activeAccordionItem === ev.evaluation_id && <ResponseDetailView studentId={studentId} evaluationId={ev.evaluation_id} />}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center">No hay historial de evaluaciones para mostrar.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Evaluaciones con Rúbrica</CardTitle>
        </CardHeader>
        <CardContent>
          {rubricEvaluations.length > 0 ? (
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
            <p className="text-muted-foreground text-center">Este estudiante aún no tiene evaluaciones con rúbrica registradas.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inscripción en Cursos</CardTitle>
          <CardDescription>Lista de cursos y asignaturas en los que el estudiante está inscrito.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Año</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Asignatura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.curso_asignatura_id}>
                    <TableCell>{enrollment.anio}</TableCell>
                    <TableCell>{enrollment.nivel_nombre} {enrollment.curso_nombre}</TableCell>
                    <TableCell>{enrollment.asignatura_nombre}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No hay inscripciones en cursos.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDetailPage;