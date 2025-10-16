import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchCurriculumUploadJobs } from '@/api/superAdminApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const CurriculumJobsTable = () => {
  const { data: jobs = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['curriculumUploadJobs'],
    queryFn: fetchCurriculumUploadJobs,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Historial de Cargas</CardTitle>
            <CardDescription>Estado de los archivos PDF y URLs procesados.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archivo/URL</TableHead>
              <TableHead>Nivel/Asignatura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>
            ) : jobs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No hay cargas recientes.</TableCell></TableRow>
            ) : (
              jobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium max-w-xs truncate">{job.file_name}</TableCell>
                  <TableCell>{job.niveles?.nombre} / {job.asignaturas?.nombre}</TableCell>
                  <TableCell>{format(parseISO(job.created_at), 'Pp', { locale: es })}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{job.error_message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CurriculumJobsTable;