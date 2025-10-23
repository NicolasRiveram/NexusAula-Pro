import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, fetchStudentsForEvaluation, fetchExistingResponsesForEvaluation, fetchStudentAssignmentsForEvaluation, StudentEvaluationAssignment } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import ManualEntryTable from '@/components/evaluations/manual-entry/ManualEntryTable';

const ManualEntryPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [students, setStudents] = useState<{ id: string; nombre_completo: string; curso_nombre: string; apoyo_pie: boolean }[]>([]);
  const [existingResponses, setExistingResponses] = useState<Map<string, { [itemId: string]: string }>>(new Map());
  const [assignments, setAssignments] = useState<StudentEvaluationAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (evaluationId) {
      setLoading(true);
      Promise.all([
        fetchEvaluationDetails(evaluationId),
        fetchStudentsForEvaluation(evaluationId),
        fetchExistingResponsesForEvaluation(evaluationId),
        fetchStudentAssignmentsForEvaluation(evaluationId),
      ]).then(([evalData, studentData, responsesData, assignmentsData]) => {
        setEvaluation(evalData);
        setStudents(studentData);
        setExistingResponses(responsesData);
        setAssignments(assignmentsData);
      }).catch(err => {
        showError(`Error al cargar datos: ${err.message}`);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [evaluationId]);

  if (loading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!evaluation) {
    return <div className="container mx-auto"><p>Evaluación no encontrada.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <Link to={`/dashboard/evaluacion/${evaluationId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la Evaluación
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ingreso Manual de Respuestas: {evaluation.titulo}</CardTitle>
          <CardDescription>
            La fila de cada estudiante se carga automáticamente. Ingresa sus respuestas en la tabla.
          </CardDescription>
        </CardHeader>
      </Card>

      <ManualEntryTable
        evaluation={evaluation}
        students={students}
        existingResponses={existingResponses}
        assignments={assignments}
      />
    </div>
  );
};

export default ManualEntryPage;