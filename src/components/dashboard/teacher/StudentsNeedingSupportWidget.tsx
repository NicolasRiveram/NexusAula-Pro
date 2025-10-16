import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchStudentPerformance } from '@/api/analyticsApi';
import { Loader2, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const StudentsNeedingSupportWidget = () => {
  const { activeEstablishment } = useEstablishment();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: async () => (await supabase.auth.getUser()).data.user });

  const { data: students, isLoading } = useQuery({
    queryKey: ['studentsNeedingSupport', user?.id, activeEstablishment?.id],
    queryFn: () => fetchStudentPerformance(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
    select: (data) => data.sort((a, b) => a.average_score - b.average_score).slice(0, 5),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>;
  }

  if (!students || students.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No hay datos de rendimiento suficientes.</p>;
  }

  return (
    <ul className="space-y-4">
      {students.map(student => (
        <li key={student.student_id}>
          <Link to={`/dashboard/estudiante/${student.student_id}`} className="block hover:bg-muted/50 p-2 rounded-md">
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm">{student.student_name}</p>
              <p className="font-semibold text-sm text-destructive">{student.average_score.toFixed(1)}%</p>
            </div>
            <Progress value={student.average_score} className="mt-1 h-2" />
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default StudentsNeedingSupportWidget;