import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, FileSignature } from 'lucide-react';
import { fetchRubrics, Rubric, deleteRubric } from '@/api/rubricsApi';
import { showError, showSuccess } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
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

const RubricsPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rubricToDelete, setRubricToDelete] = useState<Rubric | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { data: rubrics = [], isLoading: loading } = useQuery({
    queryKey: ['rubrics', user?.id, activeEstablishment?.id],
    queryFn: () => fetchRubrics(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRubric,
    onSuccess: () => {
      showSuccess("Rúbrica eliminada.");
      queryClient.invalidateQueries({ queryKey: ['rubrics', user?.id, activeEstablishment?.id] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setIsAlertOpen(false);
      setRubricToDelete(null);
    }
  });

  const handleDeleteClick = (rubric: Rubric) => {
    setRubricToDelete(rubric);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (rubricToDelete) {
      deleteMutation.mutate(rubricToDelete.id);
    }
  };

  const groupedRubrics = rubrics.reduce((acc, rubric) => {
    const category = rubric.categoria || 'Sin Categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rubric);
    return acc;
  }, {} as Record<string, Rubric[]>);

  const sortedCategories = Object.keys(groupedRubrics).sort();

  return (
    <>
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banco de Rúbricas</h1>
            <p className="text-muted-foreground">Crea y gestiona tus rúbricas de evaluación.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" disabled={!activeEstablishment}>
              <Link to="/dashboard/rubricas/evaluar">
                <FileSignature className="mr-2 h-4 w-4" /> Evaluar con Rúbrica
              </Link>
            </Button>
            <Button asChild disabled={!activeEstablishment}>
              <Link to="/dashboard/rubricas/crear">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Rúbrica
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Cargando rúbricas...</p>
        ) : !activeEstablishment ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
            <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus rúbricas.</p>
          </div>
        ) : rubrics.length > 0 ? (
          <div className="space-y-8">
            {sortedCategories.map(category => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedRubrics[category].map(rubric => (
                    <Card key={rubric.id} className="h-full hover:shadow-lg transition-shadow flex flex-col">
                      <div className="flex-grow">
                        <Link to={`/dashboard/rubricas/${rubric.id}`}>
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
                        </Link>
                      </div>
                      <CardFooter className="border-t pt-2 pb-2">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive w-full justify-start" onClick={() => handleDeleteClick(rubric)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
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
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la rúbrica "{rubricToDelete?.nombre}".
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

export default RubricsPage;