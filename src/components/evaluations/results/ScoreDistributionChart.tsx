import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EvaluationStatistics } from '@/api/evaluationsApi';

interface ScoreDistributionChartProps {
  stats: EvaluationStatistics;
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ stats }) => {
  const chartData = stats.score_distribution.map(item => ({
    name: item.range,
    Estudiantes: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Puntajes</CardTitle>
        <CardDescription>Cantidad de estudiantes por rango de logro.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            <Bar dataKey="Estudiantes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ScoreDistributionChart;