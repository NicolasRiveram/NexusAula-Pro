import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, fetchStudentsForEvaluation } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import ManualEntryTable from '@/components/evaluations/manual-entry/ManualEntryTable';
import { generateBalancedShuffledAlternatives } from '@/utils/shuffleUtils';

const ManualEntryPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [students, setStudents] = useState<{ id: string; nombre_completo: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState('nexus-2024');
  const [rowLabel, setRowLabel] = useState('A');

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

  const shuffledAlternativesMap = useMemo(() => {
    if (!evaluation) return {};
    const allItems = evaluation.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
    return generateBalancedShuffledAlternatives(allItems, seed, rowLabel);
  }, [evaluation, seed, rowLabel]);

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
            Introduce la misma configuración que usaste al imprimir para asegurar la correcta correspondencia de las alternativas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="rowLabel">Fila (Versión)</Label>
            <Select value={rowLabel} onValueChange={setRowLabel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Fila A</SelectItem>
                <SelectItem value="B">Fila B</SelectItem>
                <SelectItem value="C">Fila C</SelectItem>
                <SelectItem value="D">Fila D</SelectItem>
                <SelectItem value="E">Fila E</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="seed">Palabra Clave (Semilla)</Label>
            <Input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <ManualEntryTable
        evaluation={evaluation}
        students={students}
        shuffledAlternativesMap={shuffledAlternativesMap}
      />
    </div>
  );
};

export default ManualEntryPage;