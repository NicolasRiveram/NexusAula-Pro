import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit } from 'lucide-react';
import { fetchAllUsers, GlobalUser } from '@/api/superAdminApi';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import UserEditDialog from './UserEditDialog';

const UsersManagement = () => {
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (user: GlobalUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios Globales</CardTitle>
          <CardDescription>Administra todos los usuarios de la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando usuarios...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol Global</TableHead>
                  <TableHead>Establecimientos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nombre_completo}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.rol.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.establecimientos.map((est, index) => (
                          <Badge key={index} variant="secondary">{est.nombre}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}><Edit className="mr-2 h-4 w-4" /> Editar Rol Global</DropdownMenuItem>
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
      <UserEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadUsers}
        user={selectedUser}
      />
    </>
  );
};

export default UsersManagement;