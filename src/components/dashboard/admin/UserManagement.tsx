import React, { useState } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchEstablishmentUsers, removeUserFromEstablishment, EstablishmentUser } from '@/api/admin';
import { showError, showSuccess } from '@/utils/toast';
import { MoreHorizontal, Trash2, UserCog, Book, FileText, FileSignature } from 'lucide-react';
import EditUserRoleDialog from './EditUserRoleDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const UserManagement = () => {
  const { activeEstablishment } = useEstablishment();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EstablishmentUser | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<EstablishmentUser | null>(null);

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['establishmentUsers', activeEstablishment?.id],
    queryFn: () => fetchEstablishmentUsers(activeEstablishment!.id),
    enabled: !!activeEstablishment,
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ perfilId, establecimientoId }: { perfilId: string, establecimientoId: string }) => removeUserFromEstablishment(perfilId, establecimientoId),
    onSuccess: (_, variables) => {
      const user = users.find(u => u.perfil_id === variables.perfilId);
      showSuccess(`${user?.nombre_completo || 'Usuario'} ha sido eliminado del establecimiento.`);
      queryClient.invalidateQueries({ queryKey: ['establishmentUsers', activeEstablishment?.id] });
      queryClient.invalidateQueries({ queryKey: ['establishmentStats', activeEstablishment?.id] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setAlertOpen(false);
      setUserToDelete(null);
    }
  });

  const handleEdit = (user: EstablishmentUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleRemove = (user: EstablishmentUser) => {
    setUserToDelete(user);
    setAlertOpen(true);
  };

  const confirmRemove = () => {
    if (userToDelete && activeEstablishment) {
      removeUserMutation.mutate({ perfilId: userToDelete.perfil_id, establecimientoId: activeEstablishment.id });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Administra los usuarios aprobados en tu establecimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando usuarios...</p>
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-center">Planificaciones</TableHead>
                  <TableHead className="text-center">Evaluaciones</TableHead>
                  <TableHead className="text-center">Rúbricas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.perfil_id}>
                    <TableCell className="font-medium">{user.nombre_completo}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.rol_en_establecimiento.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Book className="h-4 w-4 text-muted-foreground" />
                        {user.stats?.planificaciones ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {user.stats?.evaluaciones ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FileSignature className="h-4 w-4 text-muted-foreground" />
                        {user.stats?.rubricas ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}><UserCog className="mr-2 h-4 w-4" /> Editar Rol</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemove(user)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay usuarios aprobados en este establecimiento.</p>
          )}
        </CardContent>
      </Card>
      <EditUserRoleDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={selectedUser}
        onUserUpdated={() => queryClient.invalidateQueries({ queryKey: ['establishmentUsers', activeEstablishment?.id] })}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar a {userToDelete?.nombre_completo} del establecimiento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;