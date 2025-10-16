import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Nivel, deleteNivel, deleteMultipleNiveles, fetchAllNiveles } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import NivelEditDialog from '../NivelEditDialog';
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

const NivelesManagement = () => {
  const queryClient = useQueryClient();
  const [isNivelDialogOpen, setNivelDialogOpen] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [nivelToDelete, setNivelToDelete] = useState<Nivel | null>(null);
  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);

  const { data: niveles = [], isLoading } = useQuery({
    queryKey: ['niveles'],
    queryFn: fetchAllNiveles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNivel,
    onSuccess: () => {
      showSuccess('Nivel eliminado.');
      queryClient.invalidateQueries({ queryKey: ['niveles'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setIsAlertOpen(false);
      setNivelToDelete(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteMultipleNiveles,
    onSuccess: (_, variables) => {
      showSuccess(`${variables.length} nivel(es) eliminados.`);
      queryClient.invalidateQueries({ queryKey: ['niveles'] });
      setSelectedNiveles([]);
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => setIsAlertOpen(false),
  });

  const handleDeleteClick = (item: Nivel) => {
    setNivelToDelete(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (nivelToDelete) {
      deleteMutation.mutate(nivelToDelete.id);
    } else if (selectedNiveles.length > 0) {
      bulkDeleteMutation.mutate(selectedNiveles);
    }
  };

  if (isLoading) return <p>Cargando niveles...</p>;

  return (
    <>
      <div className="flex justify-end mb-4">
        {selectedNiveles.length > 0 ? (
          <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedNiveles.length})</Button>
        ) : (
          <Button onClick={() => { setSelectedNivel(null); setNivelDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Nivel</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"><Checkbox checked={selectedNiveles.length === niveles.length && niveles.length > 0} onCheckedChange={(checked) => setSelectedNiveles(checked ? niveles.map(n => n.id) : [])} /></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Orden</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {niveles.map(n => (
            <TableRow key={n.id}>
              <TableCell><Checkbox checked={selectedNiveles.includes(n.id)} onCheckedChange={(checked) => setSelectedNiveles(prev => checked ? [...prev, n.id] : prev.filter(id => id !== n.id))} /></TableCell>
              <TableCell>{n.nombre}</TableCell>
              <TableCell>{n.orden}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedNivel(n); setNivelDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(n)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <NivelEditDialog isOpen={isNivelDialogOpen} onClose={() => setNivelDialogOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ['niveles'] })} nivel={selectedNivel} />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {nivelToDelete ? `Se eliminará permanentemente el nivel "${nivelToDelete.nombre}".` : `Se eliminarán permanentemente ${selectedNiveles.length} niveles.`} Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNivelToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NivelesManagement;