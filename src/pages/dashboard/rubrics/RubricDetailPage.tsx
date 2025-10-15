import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2, Edit, Trash2, FileSignature } from 'lucide-react';
import { fetchRubricById, deleteRubric } from '@/api/rubricsApi';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { printComponent } from '@/utils/printUtils';
import PrintableRubric from '@/components/rubrics/PrintableRubric';
import PrintableRubricForEvaluation from '@/components/rubrics/PrintableRubricForEvaluation';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const RubricDetailPage = () => {
  const { rubricId } = useParams<{ rubricId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { data: rubric, isLoading: loading } = useQuery({
    queryKey: ['rubric', rubricId],
    queryFn: () => fetchRubricById(rubricId!),
    enabled: !!rubricId,
    onError: (err: any) => {
      showError(err.message);
      navigate('/dashboard/rubricas');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRubric,
    onSuccess: () => {
      showSuccess("Rúbrica eliminada.");
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      navigate('/dashboard/rubricas');
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setIsAlertOpen(false);
    }
  });

  const handleDelete = () => {
    if (rubricId) {
      deleteMutation.mutate(rubricId);
    }
  };

  const handleDownloadPauta = () => {
    if (rubric) {
        printComponent(
            <PrintableRubric rubric={rubric} />,
            `Pauta Rúbrica - ${rubric.nombre}`,
            'landscape'
        );
    }
  };

  const handleDownloadInstrumento = () => {
      if (rubric) {
          printComponent(
              <PrintableRubricForEvaluation rubric={rubric} />,
              `Instrumento Rúbrica - ${rubric.nombre}`,
              'landscape'
          );
      }
  };

  if (loading) return <div className="container mx-auto"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!rubric) return <div className="container mx-auto"><p>Rúbrica no encontrada.</p></div>;

  const criterios = rubric.contenido_json?.criterios;
  const hasCriterios = Array.isArray(criterios) && criterios.length > 0;

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/rubricas" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Banco de Rúbricas
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{rubric.nombre}</CardTitle>
                <CardDescription>Actividad: {rubric.actividad_a_evaluar}</CardDescription>
                {rubric.categoria && <Badge variant="outline" className="mt-2">{rubric.categoria}</Badge>}
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Descargar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPauta}>Descargar Pauta de Rúbrica</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadInstrumento}>Descargar Instrumento para Evaluar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => navigate(`/dashboard/rubricas/editar/${rubric.id}`)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{rubric.descripcion}</p>
          </CardContent>
        </Card>

        <Card className="text-center">
            <CardHeader>
                <CardTitle>¿Listo para Evaluar?</CardTitle>
                <CardDescription>Usa esta rúbrica para evaluar a uno de tus estudiantes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg">
                    <Link to={`/dashboard/rubricas/evaluar/${rubric.id}`}>
                        <FileSignature className="mr-2 h-5 w-5" /> Evaluar con esta Rúbrica
                    </Link>
                </Button>
            </CardContent>
        </Card>

        {hasCriterios && (
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de la Rúbrica</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr>
                    <th className="border p-2 w-1/4 align-top text-left">Criterio de Evaluación</th>
                    {criterios[0]?.niveles?.map((level: any, levelIndex: number) => (
                      <th key={levelIndex} className="border p-2 align-top text-left">
                        <p className="font-bold">{level.nombre}</p>
                        <p className="font-normal text-sm">({level.puntaje} pts)</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criterios.map((criterion: any, critIndex: number) => (
                    <tr key={critIndex}>
                      <td className="border p-2 align-top">
                        <p className="font-semibold">{criterion.nombre}</p>
                        <Badge variant="secondary" className="mt-1">{criterion.habilidad}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">{criterion.descripcion}</p>
                      </td>
                      {Array.isArray(criterion.niveles) && criterion.niveles.map((level: any, levelIndex: number) => (
                        <td key={levelIndex} className="border p-2 align-top">
                          <p className="text-sm">{level.descripcion}</p>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la rúbrica "{rubric?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RubricDetailPage;