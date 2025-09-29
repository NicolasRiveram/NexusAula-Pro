import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchSkillStatistics, SkillStatistic } from '@/api/statisticsApi';
import { Loader2 } from 'lucide-react';

const StatisticsWidget = () => {
  const [stats, setStats] = useState<SkillStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadStats = async () => {
      if (!activeEstablishment) {
        setStats([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await fetchSkillStatistics(user.id, activeEstablishment.id);
        setStats(data);
      }
      setLoading(false);
    };
    loadStats();
  }, [activeEstablishment]);

  const chartData = stats.map(stat => ({
    name: stat.habilidad_nombre.substring(0, 12) + (stat.habilidad_nombre.length > 12 ? '...' : ''), // Truncate long names
    total: Math.round(stat.promedio_logro),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Estadísticas Clave</CardTitle>
          <Badge variant="default">Pro</Badge>
        </div>
        <CardDescription>Rendimiento promedio por habilidad en tus cursos.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
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
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value) => [`${value}%`, 'Logro']}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col justify-center items-center h-[200px] text-center">
            <p className="text-sm font-medium">No hay datos de rendimiento aún.</p>
            <p className="text-xs text-muted-foreground">Aplica evaluaciones para ver las estadísticas aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsWidget;