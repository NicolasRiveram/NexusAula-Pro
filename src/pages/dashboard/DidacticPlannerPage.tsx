import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchUnitPlans, UnitPlan, deleteUnitPlan } from '@/api/planningApi';
import { showError, showSuccess } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const DidacticPlannerPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [planToDelete, setPlanToDelete] = useState<UnitPlan | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { data: unitPlans = [], isLoading: loading } = useQuery({
    queryKey: ['unitPlans', user?.id, activeEstablishment?.id],
    queryFn: () => fetchUnitPlans(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnitPlan,
    onSuccess: () => {
      showSuccess("Plan de unidad eliminado.");
      queryClient.invalidateQueries({ queryKey: ['unitPlans'] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setIsAlertOpen(false);
      setPlanToDelete(null);
    }
  });

  const handleDeleteClick = (plan: UnitPlan) => {
    setPlanToDelete(plan);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      deleteMutation.mutate(planToDelete.id);
    }
  };

  const groupedPlans = unitPlans.reduce((acc, plan) => {
    const levels = new Set<string>();
    plan.unidad_maestra_curso_asignatura_link.forEach(link => {
      if (link.curso_asignaturas?.cursos?.niveles?.nombre) {
        levels.add(link.curso_asignaturas.cursos.niveles.nombre);
      }
    });

    if (levels.size === 0) {
        const key = 'Plantillas sin Asignar';
        if (!acc[key]) acc[key] = [];
        if (!acc[key].some(p => p.id === plan.id)) {
            acc[key].push(plan);
        }
    } else {
        levels.forEach(levelName => {
            if (!acc[levelName]) {
                acc[levelName] = [];
            }
            if (!acc[levelName].some(p => p.id === plan.id)) {
                acc[levelName].push(plan);
            }
        });
    }

    return acc;
  }, {} as Record<string, UnitPlan[]>);

  const sortedLevels = Object.keys(groupedPlans).sort((a, b) => {
    if (a === 'Plantillas sin Asignar') return 1;
    if (b === 'Plantillas sin Asignar') return -1;
    return a.localeCompare(b);
  });

  return (
    <>
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
          <Accordion type="multiple" className="w-full space-y-4" defaultValue={sortedLevels}>
            {sortedLevels.map(levelName => (
              <AccordionItem key={levelName} value={levelName}>
                <AccordionTrigger className="text-xl font-semibold bg-muted/50 px-4 rounded-md">
                  {levelName} ({groupedPlans[levelName].length} planes)
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedPlans[levelName].map(plan => (
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
                                <DropdownMenuItem onClick={() => handleDeleteClick(plan)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
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
                            {plan.unidad_maestra_curso_asignatura_link.length > 0 ? (
                              plan.unidad_maestra_curso_asignatura_link.map((link, index) => (
                                <Badge key={`${plan.id}-${index}`} variant="secondary">
                                  {link.curso_asignaturas.cursos.niveles.nombre} {link.curso_asignaturas.cursos.nombre}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">Ninguno</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Aún no tienes planes de unidad</h3>
            <p className="text-muted-foreground mt-2">
              Haz clic en "Crear Nuevo Plan de Unidad" para empezar a planificar con la ayuda de la IA.
            </p>
          </div>
        )}
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el plan de unidad "{planToDelete?.titulo}" y todas sus clases programadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DidacticPlannerPage;