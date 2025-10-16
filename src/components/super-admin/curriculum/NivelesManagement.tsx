import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Nivel, deleteNivel } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import NivelEditDialog from '../NivelEditDialog';
import { Checkbox } from '@/components/ui/checkbox';

interface NivelesManagementProps {
  niveles: Nivel[];
  onDataChange: () => void;
  selectedNiveles: string[];
  setSelectedNiveles: React.Dispatch<React.SetStateAction<string[]>>;
  openBulkDeleteDialog: (type: 'nivel') => void;
}

const NivelesManagement: React.FC<NivelesManagementProps> = ({ niveles, onDataChange, selectedNiveles, setSelectedNiveles, openBulkDeleteDialog }) => {
  const [isNivelDialogOpen, setNivelDialogOpen] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);

  const handleDelete = async (item: Nivel) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${item.nombre}"?`)) {
      try {
        await deleteNivel(item.id);
        showSuccess('Nivel eliminado.');
        onDataChange();
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        {selectedNiveles.length > 0 ? (
          <Button variant="destructive" onClick={() => openBulkDeleteDialog('nivel')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedNiveles.length})</Button>
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
                    <DropdownMenuItem onClick={() => handleDelete(n)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <NivelEditDialog isOpen={isNivelDialogOpen} onClose={() => setNivelDialogOpen(false)} onSaved={onDataChange} nivel={selectedNivel} />
    </>
  );
};

export default NivelesManagement;