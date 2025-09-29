import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { fetchEvaluations, Evaluation } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EvaluationPage = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
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

  const renderEvaluations = (filterType?: string) => {
    const filtered = filterType ? evaluations.filter(e => e.tipo === filterType) : evaluations;
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg mt-4">
          <h3 className="text-xl font-semibold">No hay evaluaciones de este tipo</h3>
          <p className="text-muted-foreground mt-2">Crea una nueva evaluación para empezar.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {filtered.map(evaluation => (
          <Card key={evaluation.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}`)}>
            <CardHeader>
              <CardTitle>{evaluation.titulo}</CardTitle>
              <CardDescription>
                Aplicación: {format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary" className="capitalize">{evaluation.tipo.replace('_', ' ')}</Badge>
                <div className="flex flex-wrap gap-1">
                  {evaluation.curso_asignaturas.map((ca, index) => (
                    <Badge key={index} variant="outline">
                      {ca.curso.nivel.nombre} {ca.curso.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Banco de Evaluaciones</h1>
          <p className="text-muted-foreground">Crea, gestiona y comparte tus instrumentos de evaluación.</p>
        </div>
        <Button asChild disabled={!activeEstablishment}>
          <Link to="/dashboard/evaluacion/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Evaluación
          </Link>
        </Button>
      </div>

      {loading ? (
        <p>Cargando evaluaciones...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus evaluaciones.</p>
        </div>
      ) : (
        <Tabs defaultValue="todas" className="w-full">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="Prueba">Pruebas</TabsTrigger>
            <TabsTrigger value="Guia de trabajo">Guías</TabsTrigger>
            <TabsTrigger value="Disertación">Disertaciones</TabsTrigger>
            <TabsTrigger value="Otro">Otras</TabsTrigger>
          </TabsList>
          <TabsContent value="todas">{renderEvaluations()}</TabsContent>
          <TabsContent value="Prueba">{renderEvaluations('Prueba')}</TabsContent>
          <TabsContent value="Guia de trabajo">{renderEvaluations('Guia de trabajo')}</TabsContent>
          <TabsContent value="Disertación">{renderEvaluations('Disertación')}</TabsContent>
          <TabsContent value="Otro">{renderEvaluations('Otro')}</TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default EvaluationPage;