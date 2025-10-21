import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, fetchStudentsForEvaluation } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import ManualEntryTable from '@/components/evaluations/manual-entry/ManualEntryTable';

const ManualEntryPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [students, setStudents] = useState<{ id: string; nombre_completo: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState('nexus-2024');

  useEffect(() => {
    if (evaluationId) {
      setLoading(true);
      Promise.all([
        fetchEvaluationDetails(evaluationId),
        fetchStudentsForEvaluation(evaluationId)
      ]).then(([evalData, studentData]) => {
        setEvaluation(evalData);
        setStudents(studentData.map(s => ({ id: s.id, nombre_completo: s.nombre_completo })));
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
            Introduce la misma palabra clave que usaste al imprimir. Luego, selecciona la fila para cada estudiante e ingresa sus respuestas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="seed">Palabra Clave (Semilla)</Label>
            <Input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <ManualEntryTable
        evaluation={evaluation}
        students={students}
        seed={seed}
      />
    </div>
  );
};

export default ManualEntryPage;