import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { fetchAllEstablishments, deleteEstablishment, Establishment } from '@/api/super-admin';
import { showError, showSuccess } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import EstablishmentEditDialog from './EstablishmentEditDialog';
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

const EstablishmentsManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [establishmentToDelete, setEstablishmentToDelete] = useState<Establishment | null>(null);

  const { data: establishments = [], isLoading: loading } = useQuery({
    queryKey: ['allEstablishments'],
    queryFn: fetchAllEstablishments,
    onError: (error: any) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEstablishment,
    onSuccess: () => {
      showSuccess("Establecimiento eliminado.");
      queryClient.invalidateQueries({ queryKey: ['allEstablishments'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setAlertOpen(false);
      setEstablishmentToDelete(null);
    }
  });

  const handleAdd = () => {
    setSelectedEstablishment(null);
    setDialogOpen(true);
  };

  const handleEdit = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setDialogOpen(true);
  };

  const handleDelete = (establishment: Establishment) => {
    setEstablishmentToDelete(establishment);
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (establishmentToDelete) {
      deleteMutation.mutate(establishmentToDelete.id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Establecimientos</CardTitle>
            <CardDescription>Administra todos los establecimientos de la plataforma.</CardDescription>
          </div>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Crear Establecimiento</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando establecimientos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Comuna</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {establishments.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell className="font-medium">{est.nombre}</TableCell>
                    <TableCell>{est.comuna || 'N/A'}</TableCell>
                    <TableCell>{format(parseISO(est.created_at), 'P', { locale: es })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(est)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(est)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <EstablishmentEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['allEstablishments'] })}
        establishment={selectedEstablishment}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el establecimiento "{establishmentToDelete?.nombre}" y todos sus datos asociados.
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

export default EstablishmentsManagement;