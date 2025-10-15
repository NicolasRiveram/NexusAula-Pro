import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { 
  fetchEvaluationDetails, 
  fetchEvaluationResultsSummary, 
  fetchEvaluationStatistics, 
  fetchItemAnalysis, 
  fetchSkillAnalysisForEvaluation
} from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EvaluationStatsCard from '@/components/evaluations/results/EvaluationStatsCard';
import { calculateGrade } from '@/utils/evaluationUtils';
import ScoreDistributionChart from '@/components/evaluations/results/ScoreDistributionChart';
import ItemAnalysis from '@/components/evaluations/results/ItemAnalysis';
import SkillPerformanceChart from '@/components/evaluations/results/SkillPerformanceChart';
import { useQuery } from '@tanstack/react-query';

const EvaluationResultsPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();

  const { data: evaluation, isLoading: isLoadingEvaluation } = useQuery({
    queryKey: ['evaluationDetails', evaluationId],
    queryFn: () => fetchEvaluationDetails(evaluationId!),
    enabled: !!evaluationId,
  });

  const { data: results = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['evaluationResults', evaluationId],
    queryFn: () => fetchEvaluationResultsSummary(evaluationId!),
    enabled: !!evaluationId,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['evaluationStats', evaluationId],
    queryFn: () => fetchEvaluationStatistics(evaluationId!),
    enabled: !!evaluationId,
  });

  const { data: itemAnalysis = [], isLoading: isLoadingItemAnalysis } = useQuery({
    queryKey: ['itemAnalysis', evaluationId],
    queryFn: () => fetchItemAnalysis(evaluationId!),
    enabled: !!evaluationId,
  });

  const { data: skillAnalysis = [], isLoading: isLoadingSkillAnalysis } = useQuery({
    queryKey: ['skillAnalysis', evaluationId],
    queryFn: () => fetchSkillAnalysisForEvaluation(evaluationId!),
    enabled: !!evaluationId,
  });

  const loading = isLoadingEvaluation || isLoadingResults || isLoadingStats || isLoadingItemAnalysis || isLoadingSkillAnalysis;

  const puntajeMaximo = useMemo(() => {
    if (!evaluation) return 0;
    return evaluation.evaluation_content_blocks.reduce((total, block) => {
        return total + block.evaluacion_items.reduce((blockTotal, item) => blockTotal + item.puntaje, 0);
    }, 0);
  }, [evaluation]);

  const allSkillsInData = useMemo(() => {
    if (!evaluation) return [];

    const definedSkills = Array.from(
      new Set(
        evaluation.evaluation_content_blocks
          .flatMap(block => block.evaluacion_items)
          .map(item => item.habilidad_evaluada)
          .filter((skill): skill is string => !!skill)
      )
    );

    const analysisMap = new Map(skillAnalysis.map(sa => [sa.habilidad, sa]));

    return definedSkills.map(skillName => {
      const analysisData = analysisMap.get(skillName);
      if (analysisData) {
        return analysisData;
      }
      return {
        habilidad: skillName,
        correct_answers: 0,
        total_answers: 0,
        achievement_percentage: 0,
      };
    });
  }, [evaluation, skillAnalysis]);

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
      
      {stats && stats.score_distribution.length > 0 && <ScoreDistributionChart stats={stats} />}

      {allSkillsInData.length > 0 && <SkillPerformanceChart analysis={allSkillsInData} />}

      {itemAnalysis.length > 0 && <ItemAnalysis analysis={itemAnalysis} />}

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
                const nota = calculateGrade(result.score, puntajeMaximo);
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
                      {result.response_id && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/dashboard/evaluacion/${evaluationId}/resultados/${result.response_id}`}>
                            Ver Respuestas
                          </Link>
                        </Button>
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