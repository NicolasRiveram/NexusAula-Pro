import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { fetchEvaluations, Evaluation } from '@/api/evaluationsApi';
import CreateEvaluationDialog from '@/components/evaluations/CreateEvaluationDialog';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const EvaluationPage = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { activeEstablishment } = useEstablishment();

  const loadEvaluations = async () => {
    if (!activeEstablishment) {
      setEvaluations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const data = await fetchEvaluations(user.id, activeEstablishment.id);
        setEvaluations(data);
      } catch (err: any) {
        showError(`Error al cargar evaluaciones: ${err.message}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvaluations();
  }, [activeEstablishment]);

  const handleEvaluationCreated = (newEvaluationId: string) => {
    // Redirigir al usuario a la página de construcción de la evaluación
    navigate(`/dashboard/evaluacion/${newEvaluationId}`);
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Evaluaciones</h1>
          <p className="text-muted-foreground">Crea, gestiona y analiza tus evaluaciones e instrumentos.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={!activeEstablishment}>
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Evaluación
        </Button>
      </div>

      {loading ? (
        <p>Cargando evaluaciones...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus evaluaciones.</p>
        </div>
      ) : evaluations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map(evaluation => (
            <Card key={evaluation.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}`)}>
              <CardHeader>
                <CardTitle>{evaluation.titulo}</CardTitle>
                <CardDescription>
                  Aplicación: {format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">{evaluation.tipo}</Badge>
                  <p className="text-sm text-muted-foreground">
                    {evaluation.curso_asignatura.curso.nivel.nombre} {evaluation.curso_asignatura.curso.nombre} - {evaluation.curso_asignatura.asignatura.nombre}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No tienes evaluaciones creadas</h3>
          <p className="text-muted-foreground mt-2">
            Haz clic en "Crear Nueva Evaluación" para empezar.
          </p>
        </div>
      )}

      <CreateEvaluationDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onEvaluationCreated={handleEvaluationCreated}
      />
    </div>
  );
};

export default EvaluationPage;