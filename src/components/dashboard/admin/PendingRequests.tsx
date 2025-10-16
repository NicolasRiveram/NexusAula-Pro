import React from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchPendingRequests, approveRequest, rejectRequest } from '@/api/admin';
import { showError, showSuccess } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PendingRequests = () => {
  const { activeEstablishment } = useEstablishment();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading: loading } = useQuery({
    queryKey: ['pendingRequests', activeEstablishment?.id],
    queryFn: () => fetchPendingRequests(activeEstablishment!.id),
    enabled: !!activeEstablishment,
  });

  const approveMutation = useMutation({
    mutationFn: ({ perfilId, establecimientoId }: { perfilId: string, establecimientoId: string }) => approveRequest(perfilId, establecimientoId),
    onSuccess: () => {
      showSuccess("Solicitud aprobada.");
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', activeEstablishment?.id] });
      queryClient.invalidateQueries({ queryKey: ['establishmentUsers', activeEstablishment?.id] }); // Invalidate users list as well
      queryClient.invalidateQueries({ queryKey: ['establishmentStats', activeEstablishment?.id] }); // Invalidate stats
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ perfilId, establecimientoId }: { perfilId: string, establecimientoId: string }) => rejectRequest(perfilId, establecimientoId),
    onSuccess: () => {
      showSuccess("Solicitud rechazada.");
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', activeEstablishment?.id] });
      queryClient.invalidateQueries({ queryKey: ['establishmentStats', activeEstablishment?.id] }); // Invalidate stats
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleApprove = (perfilId: string) => {
    if (activeEstablishment) {
      approveMutation.mutate({ perfilId, establecimientoId: activeEstablishment.id });
    }
  };

  const handleReject = (perfilId: string) => {
    if (activeEstablishment) {
      rejectMutation.mutate({ perfilId, establecimientoId: activeEstablishment.id });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes Pendientes</CardTitle>
        <CardDescription>Docentes esperando aprobación para unirse a tu establecimiento.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Cargando solicitudes...</p>
        ) : requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.perfil_id}>
                  <TableCell className="font-medium">{req.nombre_completo}</TableCell>
                  <TableCell>{req.email}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(req.fecha_solicitud), { addSuffix: true, locale: es })}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleApprove(req.perfil_id)} disabled={approveMutation.isPending || rejectMutation.isPending}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleReject(req.perfil_id)} disabled={approveMutation.isPending || rejectMutation.isPending}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-4">No hay solicitudes pendientes.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingRequests;