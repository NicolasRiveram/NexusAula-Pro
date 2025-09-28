import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  { name: "Análisis", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Síntesis", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Evaluación", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Aplicación", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Comprensión", total: Math.floor(Math.random() * 5000) + 1000 },
];

const StatisticsWidget = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Estadísticas Clave</CardTitle>
          <Badge variant="default">Pro</Badge>
        </div>
        <CardDescription>Resumen de habilidades en tus cursos.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StatisticsWidget;