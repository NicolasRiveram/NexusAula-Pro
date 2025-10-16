import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchAllPendingRequests, superAdminUpdateRequestStatus } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PendingRequestsManagement = () => {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['allPendingRequests'],
    queryFn: fetchAllPendingRequests,
    onError: (error: any) => showError(error.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ perfilId, establecimientoId, status }: { perfilId: string, establecimientoId: string, status: 'aprobado' | 'rechazado' }) =>
      superAdminUpdateRequestStatus(perfilId, establecimientoId, status),
    onSuccess: (_, variables) => {
      showSuccess(`Solicitud ${variables.status === 'aprobado' ? 'aprobada' : 'rechazada'}.`);
      queryClient.invalidateQueries({ queryKey: ['allPendingRequests'] });
    },
    onError: (error: any) => showError(error.message),
  });

  const handleAction = (perfilId: string, establecimientoId: string, status: 'aprobado' | 'rechazado') => {
    updateStatusMutation.mutate({ perfilId, establecimientoId, status });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Solicitudes Pendientes Globales</CardTitle>
            <CardDescription>Usuarios esperando aprobación para unirse a establecimientos.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Cargando solicitudes...</p>
        ) : requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Establecimiento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={`${req.perfil_id}-${req.establecimiento_id}`}>
                  <TableCell className="font-medium">{req.nombre_completo}</TableCell>
                  <TableCell>{req.email}</TableCell>
                  <TableCell>{req.establecimiento_nombre}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(req.fecha_solicitud), { addSuffix: true, locale: es })}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleAction(req.perfil_id, req.establecimiento_id, 'aprobado')} disabled={updateStatusMutation.isPending}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleAction(req.perfil_id, req.establecimiento_id, 'rechazado')} disabled={updateStatusMutation.isPending}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-4">No hay solicitudes pendientes en la plataforma.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingRequestsManagement;