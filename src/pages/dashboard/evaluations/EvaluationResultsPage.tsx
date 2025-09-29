import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchEvaluationDetails, fetchEvaluationResultsSummary, EvaluationDetail, EvaluationResultSummary, fetchEvaluationStatistics, EvaluationStatistics } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EvaluationStatsCard from '@/components/evaluations/results/EvaluationStatsCard';

const calcularNota = (puntajeObtenido: number | null, puntajeMaximo: number): number => {
  if (puntajeObtenido === null || puntajeMaximo <= 0) return 1.0;
  const puntajeMinimoAprobacion = puntajeMaximo * 0.6;
  let nota;
  if (puntajeObtenido >= puntajeMinimoAprobacion) {
    nota = 4.0 + 3.0 * ((puntajeObtenido - puntajeMinimoAprobacion) / (puntajeMaximo - puntajeMinimoAprobacion));
  } else {
    nota = 1.0 + 3.0 * (puntajeObtenido / puntajeMinimoAprobacion);
  }
  return Math.round(nota * 10) / 10;
};

const EvaluationResultsPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [results, setResults] = useState<EvaluationResultSummary[]>([]);
  const [stats, setStats] = useState<EvaluationStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (evaluationId) {
      setLoading(true);
      Promise.all([
        fetchEvaluationDetails(evaluationId),
        fetchEvaluationResultsSummary(evaluationId),
        fetchEvaluationStatistics(evaluationId)
      ]).then(([evalData, resultsData, statsData]) => {
        setEvaluation(evalData);
        setResults(resultsData);
        setStats(statsData);
      }).catch(err => {
        showError(`Error al cargar los resultados: ${err.message}`);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [evaluationId]);

  const puntajeMaximo = useMemo(() => {
    if (!evaluation) return 0;
    return evaluation.evaluation_content_blocks.reduce((total, block) => {
        return total + block.evaluacion_items.reduce((blockTotal, item) => blockTotal + item.puntaje, 0);
    }, 0);
  }, [evaluation]);

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto text-center">
        <p>No se pudo encontrar la evaluación.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <Link to={`/dashboard/evaluacion/${evaluationId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la Evaluación
      </Link>

      {stats && <EvaluationStatsCard stats={stats} />}

      <Card>
        <CardHeader>
          <CardTitle>Resultados de: {evaluation.titulo}</CardTitle>
          <CardDescription>Resumen de rendimiento de los estudiantes. Puntaje máximo: {puntajeMaximo} puntos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Puntaje</TableHead>
                <TableHead>Nota (60%)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(result => {
                const nota = calcularNota(result.score, puntajeMaximo);
                return (
                  <TableRow key={result.student_id}>
                    <TableCell className="font-medium">{result.student_name}</TableCell>
                    <TableCell>
                      <Badge variant={result.status === 'Completado' ? 'default' : 'secondary'}>{result.status}</Badge>
                    </TableCell>
                    <TableCell>{result.score !== null ? `${result.score} / ${puntajeMaximo}` : 'N/A'}</TableCell>
                    <TableCell>
                      <span className={cn("font-semibold", nota < 4.0 ? "text-destructive" : "text-green-600")}>
                        {result.status === 'Completado' ? nota.toFixed(1) : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {result.status === 'Completado' && (
                        <Button variant="outline" size="sm">Ver Respuestas</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationResultsPage;