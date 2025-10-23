import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Star, Move } from 'lucide-react';
import { fetchAllUsers, GlobalUser, fetchAllEstablishments, Establishment } from '@/api/superAdminApi';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import UserEditDialog from './UserEditDialog';
import SubscriptionEditDialog from './SubscriptionEditDialog';
import MoveUserDialog from './MoveUserDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const UsersManagement = () => {
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isUserDialogOpen, setUserDialogOpen] = useState(false);
  const [isSubDialogOpen, setSubDialogOpen] = useState(false);
  const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [fromEstablishment, setFromEstablishment] = useState<{id: string, nombre: string} | null>(null);

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
    let filtered = users;

    if (selectedEstablishment !== 'all') {
      filtered = filtered.filter(user => user.establecimientos.some(est => est.id === selectedEstablishment));
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.rol === roleFilter);
    }

    return filtered;
  }, [users, selectedEstablishment, roleFilter]);

  const handleEditRole = (user: GlobalUser) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleEditSub = (user: GlobalUser) => {
    setSelectedUser(user);
    setSubDialogOpen(true);
  };

  const handleMove = (user: GlobalUser, fromEst: {id: string, nombre: string}) => {
    setSelectedUser(user);
    setFromEstablishment(fromEst);
    setMoveDialogOpen(true);
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
            <div className="flex gap-2">
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
              <div className="w-56">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="super_administrador">Super Administrador</SelectItem>
                    <SelectItem value="coordinador">Coordinador</SelectItem>
                    <SelectItem value="docente">Docente</SelectItem>
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <TableHead>Suscripción</TableHead>
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
                      <Badge variant={user.subscription_plan === 'pro' ? 'default' : 'secondary'} className="capitalize">
                        {user.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.establecimientos.map((est, index) => (
                          <div key={index} className="flex items-center gap-1 bg-muted p-1 rounded">
                            <Badge variant="outline">{est.nombre}</Badge>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(user, est)}>
                              <Move className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRole(user)}><Edit className="mr-2 h-4 w-4" /> Editar Rol Global</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSub(user)}><Star className="mr-2 h-4 w-4" /> Cambiar Suscripción</DropdownMenuItem>
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
        isOpen={isUserDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        onSaved={loadData}
        user={selectedUser}
      />
      <SubscriptionEditDialog
        isOpen={isSubDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        onSaved={loadData}
        user={selectedUser}
      />
      <MoveUserDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMoved={loadData}
        userToMove={selectedUser}
        fromEstablishment={fromEstablishment}
        allEstablishments={establishments}
      />
    </>
  );
};

export default UsersManagement;