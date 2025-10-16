import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchEvaluations } from '@/api/evaluationsApi';
import { Loader2, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const RecentEvaluationsWidget = () => {
  const { activeEstablishment } = useEstablishment();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: async () => (await supabase.auth.getUser()).data.user });

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['recentEvaluations', user?.id, activeEstablishment?.id],
    queryFn: () => fetchEvaluations(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
    select: (data) => data.slice(0, 4),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>;
  }

  if (!evaluations || evaluations.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No has creado evaluaciones recientemente.</p>;
  }

  return (
    <div className="space-y-2">
      {evaluations.map(evaluation => (
        <div key={evaluation.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
          <div>
            <p className="font-medium">{evaluation.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {evaluation.fecha_aplicacion ? format(parseISO(evaluation.fecha_aplicacion), "d LLL, yyyy", { locale: es }) : 'Sin fecha'}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/dashboard/evaluacion/${evaluation.id}/resultados`}>
              <BarChart className="h-4 w-4 mr-2" /> Ver Resultados
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
};

export default RecentEvaluationsWidget;