import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  fetchAllNiveles, Nivel, deleteMultipleNiveles,
  fetchAllAsignaturas, Asignatura, deleteMultipleAsignaturas,
  fetchAllEjes, Eje, deleteMultipleEjes,
  fetchAllHabilidades, Habilidad, deleteMultipleHabilidades,
  fetchAllObjetivosAprendizaje, ObjetivoAprendizaje, deleteMultipleObjetivosAprendizaje,
} from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import NivelesManagement from './curriculum/NivelesManagement';
import AsignaturasManagement from './curriculum/AsignaturasManagement';
import EjesManagement from './curriculum/EjesManagement';
import HabilidadesManagement from './curriculum/HabilidadesManagement';
import ObjetivosManagement from './curriculum/ObjetivosManagement';
import CurriculumUploadForm from './curriculum/CurriculumUploadForm';
import UrlUploadForm from './curriculum/UrlUploadForm';
import CurriculumJobsTable from './curriculum/CurriculumJobsTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CurriculumManagement = () => {
  const queryClient = useQueryClient();
  
  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({ queryKey: ['niveles'], queryFn: fetchAllNiveles });
  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({ queryKey: ['asignaturas'], queryFn: fetchAllAsignaturas });
  const { data: ejes = [], isLoading: isLoadingEjes } = useQuery({ queryKey: ['ejes'], queryFn: fetchAllEjes });
  const { data: habilidades = [], isLoading: isLoadingHabilidades } = useQuery({ queryKey: ['habilidades'], queryFn: fetchAllHabilidades });
  const { data: oas = [], isLoading: isLoadingOas } = useQuery({ queryKey: ['oas'], queryFn: fetchAllObjetivosAprendizaje });

  const loading = isLoadingNiveles || isLoadingAsignaturas || isLoadingEjes || isLoadingHabilidades || isLoadingOas;

  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>([]);
  const [selectedEjes, setSelectedEjes] = useState<string[]>([]);
  const [selectedHabilidades, setSelectedHabilidades] = useState<string[]>([]);
  const [selectedOas, setSelectedOas] = useState<string[]>([]);

  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfig, setBulkDeleteConfig] = useState<{ type: string; count: number; onConfirm: () => void } | null>(null);

  const createBulkDeleteMutation = (queryKey: string, deleteFn: (ids: string[]) => Promise<void>, setSelectedFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    return useMutation({
      mutationFn: deleteFn,
      onSuccess: (_, variables) => {
        showSuccess(`${variables.length} item(s) eliminados.`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        setSelectedFn([]);
      },
      onError: (error: any) => showError(error.message),
      onSettled: () => setBulkDeleteOpen(false),
    });
  };

  const bulkDeleteNivelesMutation = createBulkDeleteMutation('niveles', deleteMultipleNiveles, setSelectedNiveles);
  const bulkDeleteAsignaturasMutation = createBulkDeleteMutation('asignaturas', deleteMultipleAsignaturas, setSelectedAsignaturas);
  const bulkDeleteEjesMutation = createBulkDeleteMutation('ejes', deleteMultipleEjes, setSelectedEjes);
  const bulkDeleteHabilidadesMutation = createBulkDeleteMutation('habilidades', deleteMultipleHabilidades, setSelectedHabilidades);
  const bulkDeleteOasMutation = createBulkDeleteMutation('oas', deleteMultipleObjetivosAprendizaje, setSelectedOas);

  const openBulkDeleteDialog = (type: 'nivel' | 'asignatura' | 'eje' | 'habilidad' | 'oa') => {
    let count = 0;
    let onConfirm: () => void;

    switch (type) {
      case 'nivel':
        count = selectedNiveles.length;
        onConfirm = () => bulkDeleteNivelesMutation.mutate(selectedNiveles);
        break;
      case 'asignatura':
        count = selectedAsignaturas.length;
        onConfirm = () => bulkDeleteAsignaturasMutation.mutate(selectedAsignaturas);
        break;
      case 'eje':
        count = selectedEjes.length;
        onConfirm = () => bulkDeleteEjesMutation.mutate(selectedEjes);
        break;
      case 'habilidad':
        count = selectedHabilidades.length;
        onConfirm = () => bulkDeleteHabilidadesMutation.mutate(selectedHabilidades);
        break;
      case 'oa':
        count = selectedOas.length;
        onConfirm = () => bulkDeleteOasMutation.mutate(selectedOas);
        break;
    }

    if (count > 0) {
      setBulkDeleteConfig({ type, count, onConfirm });
      setBulkDeleteOpen(true);
    }
  };

  if (loading) return <p>Cargando currículum...</p>;

  return (
    <>
      <Accordion type="single" collapsible className="w-full mt-6" defaultValue="upload">
        <AccordionItem value="upload">
          <AccordionTrigger className="text-lg font-semibold">Carga Masiva de Currículum</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <UrlUploadForm niveles={niveles} asignaturas={asignaturas} onUploadSuccess={() => queryClient.invalidateQueries()} />
            <CurriculumUploadForm niveles={niveles} asignaturas={asignaturas} onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['curriculumUploadJobs'] })} />
            <CurriculumJobsTable />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="niveles">
          <AccordionTrigger className="text-lg font-semibold">Niveles Educativos</AccordionTrigger>
          <AccordionContent>
            <NivelesManagement 
              niveles={niveles} 
              selectedNiveles={selectedNiveles}
              setSelectedNiveles={setSelectedNiveles}
              openBulkDeleteDialog={() => openBulkDeleteDialog('nivel')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="asignaturas">
          <AccordionTrigger className="text-lg font-semibold">Asignaturas</AccordionTrigger>
          <AccordionContent>
            <AsignaturasManagement
              asignaturas={asignaturas}
              selectedAsignaturas={selectedAsignaturas}
              setSelectedAsignaturas={setSelectedAsignaturas}
              openBulkDeleteDialog={() => openBulkDeleteDialog('asignatura')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="ejes">
          <AccordionTrigger className="text-lg font-semibold">Ejes Temáticos</AccordionTrigger>
          <AccordionContent>
            <EjesManagement
              ejes={ejes}
              asignaturas={asignaturas}
              selectedEjes={selectedEjes}
              setSelectedEjes={setSelectedEjes}
              openBulkDeleteDialog={() => openBulkDeleteDialog('eje')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="habilidades">
          <AccordionTrigger className="text-lg font-semibold">Habilidades</AccordionTrigger>
          <AccordionContent>
            <HabilidadesManagement
              habilidades={habilidades}
              selectedHabilidades={selectedHabilidades}
              setSelectedHabilidades={setSelectedHabilidades}
              openBulkDeleteDialog={() => openBulkDeleteDialog('habilidad')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="oas">
          <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje (OAs)</AccordionTrigger>
          <AccordionContent>
            <ObjetivosManagement
              oas={oas}
              niveles={niveles}
              asignaturas={asignaturas}
              ejes={ejes}
              selectedOas={selectedOas}
              setSelectedOas={setSelectedOas}
              openBulkDeleteDialog={() => openBulkDeleteDialog('oa')}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente {bulkDeleteConfig?.count} {bulkDeleteConfig?.type}(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDeleteConfig?.onConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CurriculumManagement;