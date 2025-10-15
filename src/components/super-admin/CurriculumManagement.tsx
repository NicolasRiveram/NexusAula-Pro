import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  fetchAllNiveles, Nivel, deleteMultipleNiveles,
  fetchAllAsignaturas, Asignatura, deleteMultipleAsignaturas,
  fetchAllEjes, Eje, deleteMultipleEjes,
  fetchAllHabilidades, Habilidad, deleteMultipleHabilidades,
  fetchAllObjetivosAprendizaje, ObjetivoAprendizaje, deleteMultipleObjetivosAprendizaje,
  fetchCurriculumUploadJobs, CurriculumUploadJob
} from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import NivelesManagement from './curriculum/NivelesManagement';
import AsignaturasManagement from './curriculum/AsignaturasManagement';
import EjesManagement from './curriculum/EjesManagement';
import HabilidadesManagement from './curriculum/HabilidadesManagement';
import ObjetivosManagement from './curriculum/ObjetivosManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import UrlUploadForm from './curriculum/UrlUploadForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CurriculumUploadForm = ({ niveles, asignaturas, onUploadSuccess }: { niveles: Nivel[], asignaturas: Asignatura[], onUploadSuccess: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const schema = z.object({
    nivelId: z.string().uuid("Debes seleccionar un nivel."),
    asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
    file: z.any()
      .refine((files) => files && files.length === 1, "Debes seleccionar un archivo PDF.")
      .refine((files) => files?.[0]?.type === 'application/pdf', "El archivo debe ser un PDF."),
  });

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setIsUploading(true);
    const toastId = showLoading("Subiendo archivo y iniciando proceso...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      const file = data.file[0];
      const filePath = `public/${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('curriculum_uploads')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: jobData, error: jobError } = await supabase
        .from('curriculum_upload_jobs')
        .insert({
          file_path: filePath,
          file_name: file.name,
          nivel_id: data.nivelId,
          asignatura_id: data.asignaturaId,
          uploaded_by: user.id,
          status: 'processing',
        })
        .select('id')
        .single();
      if (jobError) throw jobError;

      const { error: functionError } = await supabase.functions.invoke('process-curriculum-upload', {
        body: { jobId: jobData.id },
      });
      if (functionError) throw functionError;

      dismissToast(toastId);
      showSuccess("Archivo subido. El procesamiento ha comenzado en segundo plano. Verás el estado en la tabla de abajo.");
      reset();
      onUploadSuccess();

    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga Masiva desde PDF</CardTitle>
        <CardDescription>Sube un programa de estudio en formato PDF para extraer automáticamente los Objetivos de Aprendizaje.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nivel Educativo</Label>
              <Controller name="nivelId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                  <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.nivelId && <p className="text-red-500 text-sm mt-1">{errors.nivelId.message as string}</p>}
            </div>
            <div>
              <Label>Asignatura</Label>
              <Controller name="asignaturaId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                  <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.asignaturaId && <p className="text-red-500 text-sm mt-1">{errors.asignaturaId.message as string}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="file">Archivo PDF del Programa</Label>
            <Controller name="file" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (
              <Input id="file" type="file" accept=".pdf" onBlur={onBlur} name={name} onChange={(e) => onChange(e.target.files)} ref={ref} />
            )} />
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message as string}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Subir y Procesar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

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

const CurriculumManagement = () => {
  const queryClient = useQueryClient();
  
  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({ queryKey: ['niveles'], queryFn: fetchAllNiveles });
  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({ queryKey: ['asignaturas'], queryFn: fetchAllAsignaturas });
  const { data: ejes = [], isLoading: isLoadingEjes } = useQuery({ queryKey: ['ejes'], queryFn: fetchAllEjes });
  const { data: habilidades = [], isLoading: isLoadingHabilidades } = useQuery({ queryKey: ['habilidades'], queryFn: fetchAllHabilidades });
  const { data: oas = [], isLoading: isLoadingOas } = useQuery({ queryKey: ['oas'], queryFn: fetchAllObjetivosAprendizaje });

  const loading = isLoadingNiveles || isLoadingAsignaturas || isLoadingEjes || isLoadingHabilidades || isLoadingOas;

  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>([]);
  const [selectedEjes, setSelectedEjes] = useState<string[]>([]);
  const [selectedHabilidades, setSelectedHabilidades] = useState<string[]>([]);
  const [selectedOas, setSelectedOas] = useState<string[]>([]);

  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfig, setBulkDeleteConfig] = useState<{ type: string; count: number; onConfirm: () => void } | null>(null);

  const createBulkDeleteMutation = (queryKey: string, deleteFn: (ids: string[]) => Promise<void>, setSelectedFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    return useMutation({
      mutationFn: deleteFn,
      onSuccess: (_, variables) => {
        showSuccess(`${variables.length} item(s) eliminados.`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        setSelectedFn([]);
      },
      onError: (error: any) => showError(error.message),
      onSettled: () => setBulkDeleteOpen(false),
    });
  };

  const bulkDeleteNivelesMutation = createBulkDeleteMutation('niveles', deleteMultipleNiveles, setSelectedNiveles);
  const bulkDeleteAsignaturasMutation = createBulkDeleteMutation('asignaturas', deleteMultipleAsignaturas, setSelectedAsignaturas);
  const bulkDeleteEjesMutation = createBulkDeleteMutation('ejes', deleteMultipleEjes, setSelectedEjes);
  const bulkDeleteHabilidadesMutation = createBulkDeleteMutation('habilidades', deleteMultipleHabilidades, setSelectedHabilidades);
  const bulkDeleteOasMutation = createBulkDeleteMutation('oas', deleteMultipleObjetivosAprendizaje, setSelectedOas);

  const openBulkDeleteDialog = (type: 'nivel' | 'asignatura' | 'eje' | 'habilidad' | 'oa') => {
    let count = 0;
    let onConfirm: () => void;

    switch (type) {
      case 'nivel':
        count = selectedNiveles.length;
        onConfirm = () => bulkDeleteNivelesMutation.mutate(selectedNiveles);
        break;
      case 'asignatura':
        count = selectedAsignaturas.length;
        onConfirm = () => bulkDeleteAsignaturasMutation.mutate(selectedAsignaturas);
        break;
      case 'eje':
        count = selectedEjes.length;
        onConfirm = () => bulkDeleteEjesMutation.mutate(selectedEjes);
        break;
      case 'habilidad':
        count = selectedHabilidades.length;
        onConfirm = () => bulkDeleteHabilidadesMutation.mutate(selectedHabilidades);
        break;
      case 'oa':
        count = selectedOas.length;
        onConfirm = () => bulkDeleteOasMutation.mutate(selectedOas);
        break;
    }

    if (count > 0) {
      setBulkDeleteConfig({ type, count, onConfirm });
      setBulkDeleteOpen(true);
    }
  };

  if (loading) return <p>Cargando currículum...</p>;

  return (
    <>
      <Accordion type="single" collapsible className="w-full mt-6" defaultValue="upload">
        <AccordionItem value="upload">
          <AccordionTrigger className="text-lg font-semibold">Carga Masiva de Currículum</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <UrlUploadForm niveles={niveles} asignaturas={asignaturas} onUploadSuccess={() => queryClient.invalidateQueries()} />
            <CurriculumUploadForm niveles={niveles} asignaturas={asignaturas} onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['curriculumUploadJobs'] })} />
            <CurriculumJobsTable />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="niveles">
          <AccordionTrigger className="text-lg font-semibold">Niveles Educativos</AccordionTrigger>
          <AccordionContent>
            <NivelesManagement 
              niveles={niveles} 
              selectedNiveles={selectedNiveles}
              setSelectedNiveles={setSelectedNiveles}
              openBulkDeleteDialog={() => openBulkDeleteDialog('nivel')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="asignaturas">
          <AccordionTrigger className="text-lg font-semibold">Asignaturas</AccordionTrigger>
          <AccordionContent>
            <AsignaturasManagement
              asignaturas={asignaturas}
              selectedAsignaturas={selectedAsignaturas}
              setSelectedAsignaturas={setSelectedAsignaturas}
              openBulkDeleteDialog={() => openBulkDeleteDialog('asignatura')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="ejes">
          <AccordionTrigger className="text-lg font-semibold">Ejes Temáticos</AccordionTrigger>
          <AccordionContent>
            <EjesManagement
              ejes={ejes}
              asignaturas={asignaturas}
              selectedEjes={selectedEjes}
              setSelectedEjes={setSelectedEjes}
              openBulkDeleteDialog={() => openBulkDeleteDialog('eje')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="habilidades">
          <AccordionTrigger className="text-lg font-semibold">Habilidades</AccordionTrigger>
          <AccordionContent>
            <HabilidadesManagement
              habilidades={habilidades}
              selectedHabilidades={selectedHabilidades}
              setSelectedHabilidades={setSelectedHabilidades}
              openBulkDeleteDialog={() => openBulkDeleteDialog('habilidad')}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="oas">
          <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje (OAs)</AccordionTrigger>
          <AccordionContent>
            <ObjetivosManagement
              oas={oas}
              niveles={niveles}
              asignaturas={asignaturas}
              ejes={ejes}
              selectedOas={selectedOas}
              setSelectedOas={setSelectedOas}
              openBulkDeleteDialog={() => openBulkDeleteDialog('oa')}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente {bulkDeleteConfig?.count} {bulkDeleteConfig?.type}(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDeleteConfig?.onConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CurriculumManagement;