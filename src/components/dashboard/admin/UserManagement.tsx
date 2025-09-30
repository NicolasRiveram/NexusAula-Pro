import React, { useState, useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchEstablishmentUsers, removeUserFromEstablishment, EstablishmentUser } from '@/api/adminApi';
import { showError, showSuccess } from '@/utils/toast';
import { MoreHorizontal, Trash2, UserCog } from 'lucide-react';
import EditUserRoleDialog from './EditUserRoleDialog';

const UserManagement = () => {
  const { activeEstablishment } = useEstablishment();
  const [users, setUsers] = useState<EstablishmentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EstablishmentUser | null>(null);

  const loadUsers = async () => {
    if (!activeEstablishment) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchEstablishmentUsers(activeEstablishment.id);
      setUsers(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeEstablishment]);

  const handleEdit = (user: EstablishmentUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleRemove = async (user: EstablishmentUser) => {
    if (!activeEstablishment || !window.confirm(`¿Estás seguro de que quieres eliminar a ${user.nombre_completo} del establecimiento?`)) return;
    try {
      await removeUserFromEstablishment(user.perfil_id, activeEstablishment.id);
      showSuccess(`${user.nombre_completo} ha sido eliminado del establecimiento.`);
      loadUsers();
    } catch (error: any) {
      showError(error.message);
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.perfil_id}>
                    <TableCell className="font-medium">{user.nombre_completo}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.rol_en_establecimiento.replace(/_/g, ' ')}</TableCell>
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
        onUserUpdated={loadUsers}
      />
    </>
  );
};

export default UserManagement;