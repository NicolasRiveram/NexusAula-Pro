import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchUnitPlans, UnitPlan } from '@/api/planningApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DidacticPlannerPage = () => {
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadPlans = async () => {
      if (!activeEstablishment) {
        setUnitPlans([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const allPlans = await fetchUnitPlans(user.id);
          const filteredPlans = allPlans.filter(plan =>
            plan.unidad_maestra_curso_asignatura_link.some(link =>
              link.curso_asignaturas?.cursos?.establecimiento_id === activeEstablishment.id
            )
          );
          setUnitPlans(filteredPlans);
        } catch (err: any) {
          showError(err.message);
        }
      }
      setLoading(false);
    };
    loadPlans();
  }, [activeEstablishment]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planificador Didáctico</h1>
          <p className="text-muted-foreground">Crea, visualiza y gestiona tus unidades de planificación.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/planificacion/nueva">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Plan de Unidad
          </Link>
        </Button>
      </div>

      {loading ? (
        <p>Cargando planes de unidad...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento en la cabecera para ver tus planes.</p>
        </div>
      ) : unitPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unitPlans.map(plan => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{plan.titulo}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link to={`/dashboard/planificacion/${plan.id}`} className="flex items-center w-full"><Eye className="mr-2 h-4 w-4" /> Ver Detalles</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to={`/dashboard/planificacion/editar/${plan.id}`} className="flex items-center w-full"><Pencil className="mr-2 h-4 w-4" /> Editar</Link></DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {format(parseISO(plan.fecha_inicio), "d 'de' LLL", { locale: es })} - {format(parseISO(plan.fecha_fin), "d 'de' LLL, yyyy", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">Aplicado en los cursos:</p>
                <div className="flex flex-wrap gap-1">
                  {plan.unidad_maestra_curso_asignatura_link.map(link => (
                    <Badge key={link.curso_asignaturas.cursos.nombre} variant="secondary">
                      {link.curso_asignaturas.cursos.niveles.nombre} {link.curso_asignaturas.cursos.nombre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Aún no tienes planes de unidad</h3>
          <p className="text-muted-foreground mt-2">
            Haz clic en "Crear Nuevo Plan de Unidad" para empezar a planificar con la ayuda de la IA.
          </p>
        </div>
      )}
    </div>
  );
};

export default DidacticPlannerPage;