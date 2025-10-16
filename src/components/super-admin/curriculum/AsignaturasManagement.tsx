import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Asignatura, deleteAsignatura, deleteMultipleAsignaturas, fetchAllAsignaturas } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import AsignaturaEditDialog from '../AsignaturaEditDialog';
import { Checkbox } from '@/components/ui/checkbox';
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

const AsignaturasManagement = () => {
  const queryClient = useQueryClient();
  const [isAsignaturaDialogOpen, setAsignaturaDialogOpen] = useState(false);
  const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [asignaturaToDelete, setAsignaturaToDelete] = useState<Asignatura | null>(null);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>([]);

  const { data: asignaturas = [], isLoading } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: fetchAllAsignaturas,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsignatura,
    onSuccess: () => {
      showSuccess('Asignatura eliminada.');
      queryClient.invalidateQueries({ queryKey: ['asignaturas'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setIsAlertOpen(false);
      setAsignaturaToDelete(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteMultipleAsignaturas,
    onSuccess: (_, variables) => {
      showSuccess(`${variables.length} asignatura(s) eliminadas.`);
      queryClient.invalidateQueries({ queryKey: ['asignaturas'] });
      setSelectedAsignaturas([]);
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => setIsAlertOpen(false),
  });

  const handleDeleteClick = (item: Asignatura) => {
    setAsignaturaToDelete(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (asignaturaToDelete) {
      deleteMutation.mutate(asignaturaToDelete.id);
    } else if (selectedAsignaturas.length > 0) {
      bulkDeleteMutation.mutate(selectedAsignaturas);
    }
  };

  if (isLoading) return <p>Cargando asignaturas...</p>;

  return (
    <>
      <div className="flex justify-end mb-4">
        {selectedAsignaturas.length > 0 ? (
          <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedAsignaturas.length})</Button>
        ) : (
          <Button onClick={() => { setSelectedAsignatura(null); setAsignaturaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Asignatura</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"><Checkbox checked={selectedAsignaturas.length === asignaturas.length && asignaturas.length > 0} onCheckedChange={(checked) => setSelectedAsignaturas(checked ? asignaturas.map(a => a.id) : [])} /></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asignaturas.map(a => (
            <TableRow key={a.id}>
              <TableCell><Checkbox checked={selectedAsignaturas.includes(a.id)} onCheckedChange={(checked) => setSelectedAsignaturas(prev => checked ? [...prev, a.id] : prev.filter(id => id !== a.id))} /></TableCell>
              <TableCell>{a.nombre}</TableCell>
              <TableCell className="max-w-xs truncate">{a.descripcion}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedAsignatura(a); setAsignaturaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(a)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AsignaturaEditDialog isOpen={isAsignaturaDialogOpen} onClose={() => setAsignaturaDialogOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ['asignaturas'] })} asignatura={selectedAsignatura} />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {asignaturaToDelete ? `Se eliminará permanentemente la asignatura "${asignaturaToDelete.nombre}".` : `Se eliminarán permanentemente ${selectedAsignaturas.length} asignaturas.`} Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAsignaturaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AsignaturasManagement;