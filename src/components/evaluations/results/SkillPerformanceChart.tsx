import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SkillAnalysisResult } from '@/api/evaluationsApi';

interface SkillPerformanceChartProps {
  analysis: SkillAnalysisResult[];
}

const COLORS = {
  SUPPORT: 'hsl(var(--destructive))', // Red
  ACCEPTABLE: '#F59E0B', // Amber 500
  GOOD: '#10B981', // Emerald 500
  NO_DATA: 'hsl(var(--muted))', // Grey
};

const SkillPerformanceChart: React.FC<SkillPerformanceChartProps> = ({ analysis }) => {
  const chartData = analysis.map(item => ({
    name: item.habilidad.substring(0, 15) + (item.habilidad.length > 15 ? '...' : ''),
    Logro: item.achievement_percentage,
    hasData: item.total_answers > 0,
  }));

  const getColor = (value: number, hasData: boolean) => {
    if (!hasData) return COLORS.NO_DATA;
    if (value < 60) return COLORS.SUPPORT;
    if (value < 80) return COLORS.ACCEPTABLE;
    return COLORS.GOOD;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Habilidad</CardTitle>
        <CardDescription>
          Porcentaje de logro promedio. 
          <span className="inline-flex items-center ml-2"><span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.SUPPORT }}></span>Requiere Apoyo (&lt;60%)</span>
          <span className="inline-flex items-center ml-2"><span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.ACCEPTABLE }}></span>Aceptable</span>
          <span className="inline-flex items-center ml-2"><span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.GOOD }}></span>Bueno</span>
        </CardDescription>
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
              formatter={(value: number, name, props) => {
                const payload = props.payload as typeof chartData[0];
                if (!payload.hasData) {
                  return ['Sin datos', 'Logro'];
                }
                return [`${(value as number).toFixed(1)}%`, 'Logro'];
              }}
            />
            <Bar dataKey="Logro" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.Logro, entry.hasData)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SkillPerformanceChart;