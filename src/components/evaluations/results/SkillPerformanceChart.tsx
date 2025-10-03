import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SkillAnalysisResult } from '@/api/evaluationsApi';

interface SkillPerformanceChartProps {
  analysis: SkillAnalysisResult[];
}

const SkillPerformanceChart: React.FC<SkillPerformanceChartProps> = ({ analysis }) => {
  const chartData = analysis.map(item => ({
    name: item.habilidad.substring(0, 15) + (item.habilidad.length > 15 ? '...' : ''),
    Logro: item.achievement_percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Habilidad</CardTitle>
        <CardDescription>Porcentaje de logro promedio para cada habilidad evaluada.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Logro']}
            />
            <Legend />
            <Bar dataKey="Logro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SkillPerformanceChart;