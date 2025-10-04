import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  fetchAllNiveles, Nivel, deleteMultipleNiveles,
  fetchAllAsignaturas, Asignatura, deleteMultipleAsignaturas,
  fetchAllEjes, Eje, deleteMultipleEjes,
  fetchAllHabilidades, Habilidad, deleteMultipleHabilidades,
  fetchAllObjetivosAprendizaje, ObjetivoAprendizaje, deleteMultipleObjetivosAprendizaje,
} from '@/api/superAdminApi';
import { showError } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import NivelesManagement from './curriculum/NivelesManagement';
import AsignaturasManagement from './curriculum/AsignaturasManagement';
import EjesManagement from './curriculum/EjesManagement';
import HabilidadesManagement from './curriculum/HabilidadesManagement';
import ObjetivosManagement from './curriculum/ObjetivosManagement';

const CurriculumManagement = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [oas, setOas] = useState<ObjetivoAprendizaje[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>([]);
  const [selectedEjes, setSelectedEjes] = useState<string[]>([]);
  const [selectedHabilidades, setSelectedHabilidades] = useState<string[]>([]);
  const [selectedOas, setSelectedOas] = useState<string[]>([]);

  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfig, setBulkDeleteConfig] = useState<{ type: string; count: number; onConfirm: () => void } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nivelesData, asignaturasData, ejesData, habilidadesData, oasData] = await Promise.all([
        fetchAllNiveles(), 
        fetchAllAsignaturas(),
        fetchAllEjes(),
        fetchAllHabilidades(),
        fetchAllObjetivosAprendizaje(),
      ]);
      setNiveles(nivelesData);
      setAsignaturas(asignaturasData);
      setEjes(ejesData);
      setHabilidades(habilidadesData);
      setOas(oasData);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmBulkDelete = async (
    type: string,
    deleteFn: (ids: string[]) => Promise<void>,
    idsToDelete: string[],
    clearSelectionFn: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    try {
      await deleteFn(idsToDelete);
      showSuccess(`${idsToDelete.length} ${type}(s) eliminados.`);
      clearSelectionFn([]);
      loadData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  const openBulkDeleteDialog = (type: 'nivel' | 'asignatura' | 'eje' | 'habilidad' | 'oa') => {
    let count = 0;
    let onConfirm: () => void;

    switch (type) {
      case 'nivel':
        count = selectedNiveles.length;
        onConfirm = () => handleConfirmBulkDelete('nivel', deleteMultipleNiveles, selectedNiveles, setSelectedNiveles);
        break;
      case 'asignatura':
        count = selectedAsignaturas.length;
        onConfirm = () => handleConfirmBulkDelete('asignatura', deleteMultipleAsignaturas, selectedAsignaturas, setSelectedAsignaturas);
        break;
      case 'eje':
        count = selectedEjes.length;
        onConfirm = () => handleConfirmBulkDelete('eje', deleteMultipleEjes, selectedEjes, setSelectedEjes);
        break;
      case 'habilidad':
        count = selectedHabilidades.length;
        onConfirm = () => handleConfirmBulkDelete('habilidad', deleteMultipleHabilidades, selectedHabilidades, setSelectedHabilidades);
        break;
      case 'oa':
        count = selectedOas.length;
        onConfirm = () => handleConfirmBulkDelete('objetivo de aprendizaje', deleteMultipleObjetivosAprendizaje, selectedOas, setSelectedOas);
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
      <Accordion type="single" collapsible className="w-full mt-6" defaultValue="niveles">
        <AccordionItem value="niveles">
          <AccordionTrigger className="text-lg font-semibold">Niveles Educativos</AccordionTrigger>
          <AccordionContent>
            <NivelesManagement 
              niveles={niveles} 
              onDataChange={loadData} 
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
              onDataChange={loadData}
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
              onDataChange={loadData}
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
              onDataChange={loadData}
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
              onDataChange={loadData}
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