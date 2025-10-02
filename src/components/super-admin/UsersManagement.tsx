import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit } from 'lucide-react';
import { fetchAllUsers, GlobalUser, fetchAllEstablishments, Establishment } from '@/api/superAdminApi';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import UserEditDialog from './UserEditDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UsersManagement = () => {
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, establishmentsData] = await Promise.all([fetchAllUsers(), fetchAllEstablishments()]);
      setUsers(usersData);
      setEstablishments(establishmentsData);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (selectedEstablishment === 'all') {
      return users;
    }
    return users.filter(user => user.establecimientos.some(est => est.id === selectedEstablishment));
  }, [users, selectedEstablishment]);

  const handleEdit = (user: GlobalUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestión de Usuarios Globales</CardTitle>
              <CardDescription>Administra todos los usuarios de la plataforma.</CardDescription>
            </div>
            <div className="w-64">
              <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por establecimiento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los establecimientos</SelectItem>
                  {establishments.map(est => (
                    <SelectItem key={est.id} value={est.id}>{est.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
                {filteredUsers.map((user) => (
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
        onSaved={loadData}
        user={selectedUser}
      />
    </>
  );
};

export default UsersManagement;