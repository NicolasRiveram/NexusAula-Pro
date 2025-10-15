import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Nivel, Asignatura } from '@/api/superAdminApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const schema = z.object({
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
  file: z.any()
    .refine((files) => files && files.length === 1, "Debes seleccionar un archivo PDF.")
    .refine((files) => files?.[0]?.type === 'application/pdf', "El archivo debe ser un PDF."),
});

type FormData = z.infer<typeof schema>;

interface CurriculumUploadFormProps {
  niveles: Nivel[];
  asignaturas: Asignatura[];
  onUploadSuccess: () => void;
}

const CurriculumUploadForm: React.FC<CurriculumUploadFormProps> = ({ niveles, asignaturas, onUploadSuccess }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
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
    },
    onMutate: () => {
      return showLoading("Subiendo archivo y iniciando proceso...");
    },
    onSuccess: (_, __, toastId) => {
      dismissToast(toastId);
      showSuccess("Archivo subido. El procesamiento ha comenzado en segundo plano. Verás el estado en la tabla de abajo.");
      reset();
      onUploadSuccess();
    },
    onError: (error: any, _, toastId) => {
      if (toastId) dismissToast(toastId);
      showError(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {mutation.isPending ? 'Subiendo...' : 'Subir y Procesar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CurriculumUploadForm;