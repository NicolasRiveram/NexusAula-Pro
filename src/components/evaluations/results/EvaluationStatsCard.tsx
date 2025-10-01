import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EvaluationStatistics } from '@/api/evaluations';

interface EvaluationStatsCardProps {
  stats: EvaluationStatistics;
}

const EvaluationStatsCard: React.FC<EvaluationStatsCardProps> = ({ stats }) => {
  const averagePercentage = stats.puntaje_maximo > 0 ? (stats.average_score / stats.puntaje_maximo) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed_students} / {stats.total_students}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completion_rate.toFixed(1)}% de los estudiantes han completado la evaluación.
          </p>
          <Progress value={stats.completion_rate} className="mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Puntaje Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.average_score.toFixed(1)} / {stats.puntaje_maximo}</div>
          <p className="text-xs text-muted-foreground">
            Logro promedio del {averagePercentage.toFixed(1)}%.
          </p>
          <Progress value={averagePercentage} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationStatsCard;