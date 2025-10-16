import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Eje, Asignatura, deleteEje, deleteMultipleEjes, fetchAllEjes, fetchAllAsignaturas } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import EjeEditDialog from '../EjeEditDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const EjesManagement = () => {
  const queryClient = useQueryClient();
  const [isEjeDialogOpen, setEjeDialogOpen] = useState(false);
  const [selectedEje, setSelectedEje] = useState<Eje | null>(null);
  const [ejeAsignaturaFilter, setEjeAsignaturaFilter] = useState<string>('all');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [ejeToDelete, setEjeToDelete] = useState<Eje | null>(null);
  const [selectedEjes, setSelectedEjes] = useState<string[]>([]);

  const { data: ejes = [], isLoading: isLoadingEjes } = useQuery({ queryKey: ['ejes'], queryFn: fetchAllEjes });
  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({ queryKey: ['asignaturas'], queryFn: fetchAllAsignaturas });

  const filteredEjes = useMemo(() => {
    if (ejeAsignaturaFilter === 'all') return ejes;
    return ejes.filter(eje => eje.asignatura_id === ejeAsignaturaFilter);
  }, [ejes, ejeAsignaturaFilter]);

  const deleteMutation = useMutation({
    mutationFn: deleteEje,
    onSuccess: () => {
      showSuccess('Eje eliminado.');
      queryClient.invalidateQueries({ queryKey: ['ejes'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setIsAlertOpen(false);
      setEjeToDelete(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteMultipleEjes,
    onSuccess: (_, variables) => {
      showSuccess(`${variables.length} eje(s) eliminados.`);
      queryClient.invalidateQueries({ queryKey: ['ejes'] });
      setSelectedEjes([]);
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => setIsAlertOpen(false),
  });

  const handleDeleteClick = (item: Eje) => {
    setEjeToDelete(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (ejeToDelete) {
      deleteMutation.mutate(ejeToDelete.id);
    } else if (selectedEjes.length > 0) {
      bulkDeleteMutation.mutate(selectedEjes);
    }
  };

  if (isLoadingEjes || isLoadingAsignaturas) return <p>Cargando ejes...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="w-64">
          <Select value={ejeAsignaturaFilter} onValueChange={setEjeAsignaturaFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por Asignatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las asignaturas</SelectItem>
              {asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedEjes.length > 0 ? (
          <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedEjes.length})</Button>
        ) : (
          <Button onClick={() => { setSelectedEje(null); setEjeDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Eje</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"><Checkbox checked={selectedEjes.length === filteredEjes.length && filteredEjes.length > 0} onCheckedChange={(checked) => setSelectedEjes(checked ? filteredEjes.map(e => e.id) : [])} /></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Asignatura</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEjes.map(e => (
            <TableRow key={e.id}>
              <TableCell><Checkbox checked={selectedEjes.includes(e.id)} onCheckedChange={(checked) => setSelectedEjes(prev => checked ? [...prev, e.id] : prev.filter(id => id !== e.id))} /></TableCell>
              <TableCell>{e.nombre}</TableCell>
              <TableCell>{e.asignaturas?.nombre}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedEje(e); setEjeDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(e)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EjeEditDialog isOpen={isEjeDialogOpen} onClose={() => setEjeDialogOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ['ejes'] })} eje={selectedEje} asignaturas={asignaturas} />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {ejeToDelete ? `Se eliminará permanentemente el eje "${ejeToDelete.nombre}".` : `Se eliminarán permanentemente ${selectedEjes.length} ejes.`} Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEjeToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EjesManagement;