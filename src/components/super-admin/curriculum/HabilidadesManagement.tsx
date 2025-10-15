import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Habilidad, deleteHabilidad } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import HabilidadEditDialog from '../HabilidadEditDialog';
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

interface HabilidadesManagementProps {
  habilidades: Habilidad[];
  onDataChange: () => void;
  selectedHabilidades: string[];
  setSelectedHabilidades: React.Dispatch<React.SetStateAction<string[]>>;
  openBulkDeleteDialog: (type: 'habilidad') => void;
}

const HabilidadesManagement: React.FC<HabilidadesManagementProps> = ({ habilidades, onDataChange, selectedHabilidades, setSelectedHabilidades, openBulkDeleteDialog }) => {
  const [isHabilidadDialogOpen, setHabilidadDialogOpen] = useState(false);
  const [selectedHabilidad, setSelectedHabilidad] = useState<Habilidad | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [habilidadToDelete, setHabilidadToDelete] = useState<Habilidad | null>(null);

  const handleDeleteClick = (item: Habilidad) => {
    setHabilidadToDelete(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!habilidadToDelete) return;
    try {
      await deleteHabilidad(habilidadToDelete.id);
      showSuccess('Habilidad eliminada.');
      onDataChange();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsAlertOpen(false);
      setHabilidadToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        {selectedHabilidades.length > 0 ? (
          <Button variant="destructive" onClick={() => openBulkDeleteDialog('habilidad')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedHabilidades.length})</Button>
        ) : (
          <Button onClick={() => { setSelectedHabilidad(null); setHabilidadDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Habilidad</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"><Checkbox checked={selectedHabilidades.length === habilidades.length && habilidades.length > 0} onCheckedChange={(checked) => setSelectedHabilidades(checked ? habilidades.map(h => h.id) : [])} /></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {habilidades.map(h => (
            <TableRow key={h.id}>
              <TableCell><Checkbox checked={selectedHabilidades.includes(h.id)} onCheckedChange={(checked) => setSelectedHabilidades(prev => checked ? [...prev, h.id] : prev.filter(id => id !== h.id))} /></TableCell>
              <TableCell>{h.nombre}</TableCell>
              <TableCell className="max-w-xs truncate">{h.descripcion}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedHabilidad(h); setHabilidadDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(h)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <HabilidadEditDialog isOpen={isHabilidadDialogOpen} onClose={() => setHabilidadDialogOpen(false)} onSaved={onDataChange} habilidad={selectedHabilidad} />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la habilidad "{habilidadToDelete?.nombre}".
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

export default HabilidadesManagement;