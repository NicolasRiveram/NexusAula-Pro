import React, { useState, useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchPendingRequests, approveRequest, rejectRequest, PendingRequest } from '@/api/adminApi';
import { showError, showSuccess } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X } from 'lucide-react';

const PendingRequests = () => {
  const { activeEstablishment } = useEstablishment();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!activeEstablishment) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPendingRequests(activeEstablishment.id);
      setRequests(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activeEstablishment]);

  const handleApprove = async (perfilId: string) => {
    if (!activeEstablishment) return;
    try {
      await approveRequest(perfilId, activeEstablishment.id);
      showSuccess("Solicitud aprobada.");
      loadRequests();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleReject = async (perfilId: string) => {
    if (!activeEstablishment) return;
    try {
      await rejectRequest(perfilId, activeEstablishment.id);
      showSuccess("Solicitud rechazada.");
      loadRequests();
    } catch (error: any) {
      showError(error.message);
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
                    <Button variant="outline" size="icon" onClick={() => handleApprove(req.perfil_id)}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleReject(req.perfil_id)}>
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