import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentEvaluationHistory } from '@/api/student';
import { fetchEvaluationsForStudent } from '@/api/rubricsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateGrade } from '@/utils/evaluationUtils';
import { cn } from '@/lib/utils';

interface RecentPerformanceProps {
  studentId: string;
}

const RecentPerformance: React.FC<RecentPerformanceProps> = ({ studentId }) => {
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['studentEvaluationHistory', studentId],
    queryFn: () => fetchStudentEvaluationHistory(studentId),
    enabled: !!studentId,
  });

  const { data: rubricData, isLoading: isLoadingRubrics } = useQuery({
    queryKey: ['studentRubricEvaluations', studentId],
    queryFn: () => fetchEvaluationsForStudent(studentId),
    enabled: !!studentId,
  });

  const combinedResults = React.useMemo(() => {
    if (!historyData || !rubricData) return [];

    const standardEvals = historyData.map(item => ({
      id: item.evaluation_id,
      title: item.evaluation_title,
      date: parseISO(item.response_date),
      grade: calculateGrade(item.score_obtained, item.max_score),
      type: 'standard'
    }));

    const rubricEvals = rubricData.map(item => ({
      id: item.id,
      title: item.rubrica.nombre,
      date: parseISO(item.created_at),
      grade: item.calificacion_final,
      type: 'rubric'
    }));

    return [...standardEvals, ...rubricEvals]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [historyData, rubricData]);

  const isLoading = isLoadingHistory || isLoadingRubrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="animate-spin" />
          </div>
        ) : combinedResults.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center">Aún no tienes evaluaciones completadas.</p>
        ) : (
          <div className="space-y-4">
            {combinedResults.map(result => (
              <div key={`${result.type}-${result.id}`} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{result.title}</p>
                  <p className="text-xs text-muted-foreground">{format(result.date, "d 'de' LLL, yyyy", { locale: es })}</p>
                </div>
                <div className={cn(
                  "font-bold text-lg",
                  result.grade < 4.0 ? "text-destructive" : "text-green-600"
                )}>
                  {result.grade.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPerformance;