import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UploadJob {
  id: string;
  created_at: string;
  file_name: string;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  niveles: { nombre: string } | null;
  asignaturas: { nombre: string } | null;
}

const fetchUploadJobs = async (): Promise<UploadJob[]> => {
  const { data, error } = await supabase
    .from('curriculum_upload_jobs')
    .select(`
      id,
      created_at,
      file_name,
      status,
      error_message,
      niveles ( nombre ),
      asignaturas ( nombre )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  return data as UploadJob[];
};

const StatusIndicator = ({ status, errorMessage }: { status: string, errorMessage?: string | null }) => {
  switch (status) {
    case 'processing':
      return <Badge variant="outline" className="text-blue-600 border-blue-600"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando</Badge>;
    case 'completed':
      return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="mr-2 h-4 w-4" /> Completado</Badge>;
    case 'failed':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Error</Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{errorMessage || 'Ocurrió un error desconocido.'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const CurriculumUploadStatus = () => {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['curriculumUploadJobs'],
    queryFn: fetchUploadJobs,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Cargas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Cargando historial...</p>}
        {error && <p className="text-destructive">Error al cargar el historial: {error.message}</p>}
        {jobs && jobs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Hace</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium max-w-xs truncate">{job.file_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.niveles?.nombre || 'N/A'} - {job.asignaturas?.nombre || 'N/A'}
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: es })}</TableCell>
                  <TableCell>
                    <StatusIndicator status={job.status} errorMessage={job.error_message} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoading && <p className="text-center text-muted-foreground py-4">No hay cargas recientes.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CurriculumUploadStatus;