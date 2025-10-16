import React, { useState } from 'react';
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
import { Loader2, Link } from 'lucide-react';

const schema = z.object({
  url: z.string().url("Debe ser una URL válida."),
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
});

type FormData = z.infer<typeof schema>;

interface UrlUploadFormProps {
  niveles: Nivel[];
  asignaturas: Asignatura[];
  onUploadSuccess: () => void;
}

const UrlUploadForm: React.FC<UrlUploadFormProps> = ({ niveles, asignaturas, onUploadSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsProcessing(true);
    const toastId = showLoading("Accediendo a la URL y analizando con IA... Esto puede tardar un momento.");
    try {
      const { data: result, error } = await supabase.functions.invoke('process-curriculum-url', {
        body: {
          url: data.url,
          nivelId: data.nivelId,
          asignaturaId: data.asignaturaId,
        },
      });

      if (error) throw error;

      dismissToast(toastId);
      showSuccess(result.message);
      reset();
      onUploadSuccess();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga por URL</CardTitle>
        <CardDescription>
          Pega un enlace a un programa de estudio (PDF o página web) para que la IA extraiga los datos curriculares.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="url">URL del Documento</Label>
            <Controller name="url" control={control} render={({ field }) => <Input id="url" placeholder="https://www.curriculumnacional.cl/..." {...field} />} />
            {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nivel Educativo</Label>
              <Controller name="nivelId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                  <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.nivelId && <p className="text-red-500 text-sm mt-1">{errors.nivelId.message}</p>}
            </div>
            <div>
              <Label>Asignatura</Label>
              <Controller name="asignaturaId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                  <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.asignaturaId && <p className="text-red-500 text-sm mt-1">{errors.asignaturaId.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
              Analizar y Guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UrlUploadForm;