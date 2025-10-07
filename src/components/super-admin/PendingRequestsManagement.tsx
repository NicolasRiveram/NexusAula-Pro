import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchAllPendingRequests, superAdminUpdateRequestStatus, AllPendingRequest } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const PendingRequestsManagement = () => {
  const [requests, setRequests] = useState<AllPendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllPendingRequests();
      setRequests(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (perfilId: string, establecimientoId: string, status: 'aprobado' | 'rechazado') => {
    try {
      await superAdminUpdateRequestStatus(perfilId, establecimientoId, status);
      showSuccess(`Solicitud ${status === 'aprobado' ? 'aprobada' : 'rechazada'}.`);
      loadRequests();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Solicitudes Pendientes Globales</CardTitle>
            <CardDescription>Usuarios esperando aprobación para unirse a establecimientos.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={loadRequests} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
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
                    <Button variant="outline" size="icon" onClick={() => handleAction(req.perfil_id, req.establecimiento_id, 'aprobado')}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleAction(req.perfil_id, req.establecimiento_id, 'rechazado')}>
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