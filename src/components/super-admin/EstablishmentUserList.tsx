import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, UserCog, Book, FileText, FileSignature, RefreshCw, Move } from 'lucide-react';
import { fetchEstablishmentUsersSuperAdmin, superAdminRemoveUserFromEstablishment, fetchAllEstablishments, Establishment } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import UserRoleInEstablishmentDialog from './UserRoleInEstablishmentDialog';
import MoveUserDialog from './MoveUserDialog';
import { cn } from '@/lib/utils';

interface EstablishmentUser {
  perfil_id: string;
  nombre_completo: string;
  email: string;
  rol_en_establecimiento: string;
  stats: {
    planificaciones: number;
    evaluaciones: number;
    rubricas: number;
  };
}

interface EstablishmentUserListProps {
  establishmentId: string;
}

const EstablishmentUserList: React.FC<EstablishmentUserListProps> = ({ establishmentId }) => {
  const [users, setUsers] = useState<EstablishmentUser[]>([]);
  const [allEstablishments, setAllEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EstablishmentUser | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, establishmentsData] = await Promise.all([
        fetchEstablishmentUsersSuperAdmin(establishmentId),
        fetchAllEstablishments()
      ]);
      setUsers(usersData);
      setAllEstablishments(establishmentsData);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (user: EstablishmentUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleMove = (user: EstablishmentUser) => {
    setSelectedUser(user);
    setMoveDialogOpen(true);
  };

  const handleRemove = async (user: EstablishmentUser) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a ${user.nombre_completo} del establecimiento?`)) return;
    try {
      await superAdminRemoveUserFromEstablishment(user.perfil_id, establishmentId);
      showSuccess(`${user.nombre_completo} ha sido eliminado del establecimiento.`);
      loadData();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Usuarios del Establecimiento</CardTitle>
              <CardDescription>Gestiona los usuarios aprobados.</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
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
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}><UserCog className="mr-2 h-4 w-4" /> Editar Rol</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMove(user)}><Move className="mr-2 h-4 w-4" /> Mover Usuario</DropdownMenuItem>
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
      <UserRoleInEstablishmentDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={selectedUser}
        onUserUpdated={loadData}
        establishmentId={establishmentId}
      />
      <MoveUserDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMoved={loadData}
        userToMove={selectedUser ? { id: selectedUser.perfil_id, nombre_completo: selectedUser.nombre_completo } : null}
        fromEstablishment={{ id: establishmentId, nombre: allEstablishments.find(e => e.id === establishmentId)?.nombre || '' }}
        allEstablishments={allEstablishments}
      />
    </>
  );
};

export default EstablishmentUserList;