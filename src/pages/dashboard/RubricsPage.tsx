import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { fetchRubrics, Rubric } from '@/api/rubricsApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const RubricsPage = () => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadRubrics = async () => {
      if (!activeEstablishment) {
        setRubrics([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const data = await fetchRubrics(user.id, activeEstablishment.id);
          setRubrics(data);
        } catch (err: any) {
          showError(`Error al cargar rúbricas: ${err.message}`);
        }
      }
      setLoading(false);
    };
    loadRubrics();
  }, [activeEstablishment]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Banco de Rúbricas</h1>
          <p className="text-muted-foreground">Crea y gestiona tus rúbricas de evaluación.</p>
        </div>
        <Button asChild disabled={!activeEstablishment}>
          <Link to="/dashboard/rubricas/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Rúbrica
          </Link>
        </Button>
      </div>

      {loading ? (
        <p>Cargando rúbricas...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus rúbricas.</p>
        </div>
      ) : rubrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rubrics.map(rubric => (
            <Link to={`/dashboard/rubricas/${rubric.id}`} key={rubric.id}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{rubric.nombre}</CardTitle>
                  <CardDescription>
                    Actividad: {rubric.actividad_a_evaluar}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Creada el {format(parseISO(rubric.created_at), "d 'de' LLLL, yyyy", { locale: es })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No tienes rúbricas</h3>
          <p className="text-muted-foreground mt-2">
            Crea tu primera rúbrica para este establecimiento.
          </p>
        </div>
      )}
    </div>
  );
};

export default RubricsPage;