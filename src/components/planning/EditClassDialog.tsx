import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScheduledClass, UpdateClassPayload } from '@/api/planningApi';

const schema = z.object({
  titulo: z.string().min(1, "El título es requerido."),
  objetivos_clase: z.string().min(1, "El objetivo es requerido."),
  objetivo_estudiante: z.string().optional(),
  aporte_proyecto: z.string().optional(),
  actividades_inicio: z.string().min(1, "Se requieren actividades de inicio."),
  actividades_desarrollo: z.string().min(1, "Se requieren actividades de desarrollo."),
  actividades_cierre: z.string().min(1, "Se requieren actividades de cierre."),
  recursos: z.string().min(1, "Los recursos son requeridos."),
  objetivo_aprendizaje_texto: z.string().optional(),
  habilidades: z.string().optional(),
  vinculo_interdisciplinario: z.string().optional(),
  aspectos_valoricos_actitudinales: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clase: ScheduledClass | null;
  onSave: (classId: string, data: UpdateClassPayload) => void;
}

const EditClassDialog: React.FC<EditClassDialogProps> = ({ isOpen, onOpenChange, clase, onSave }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (clase) {
      reset(clase);
    }
  }, [clase, reset]);

  if (!clase) return null;

  const onSubmit = (data: FormData) => {
    onSave(clase.id, data);
  };

  const FormField = ({ name, label, component: Component, ...props }: any) => (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => <Component id={name} {...field} {...props} />}
      />
      {errors[name] && <p className="text-red-500 text-sm mt-1">{(errors as any)[name].message}</p>}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Clase: {clase.titulo}</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la clase y guarda los cambios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 my-4">
              <FormField name="titulo" label="Título de la Clase" component={Input} />
              <FormField name="objetivo_aprendizaje_texto" label="Objetivo de Aprendizaje (OA)" component={Textarea} rows={2} />
              <FormField name="habilidades" label="Habilidades a Desarrollar" component={Input} />
              <FormField name="objetivos_clase" label="Objetivo de la Clase (Docente)" component={Textarea} rows={2} />
              <FormField name="objetivo_estudiante" label="Objetivo para el Estudiante" component={Input} />
              <FormField name="aporte_proyecto" label="Aporte al Proyecto" component={Input} />
              <FormField name="actividades_inicio" label="Actividades de Inicio" component={Textarea} rows={3} />
              <FormField name="actividades_desarrollo" label="Actividades de Desarrollo" component={Textarea} rows={5} />
              <FormField name="actividades_cierre" label="Actividades de Cierre" component={Textarea} rows={3} />
              <FormField name="recursos" label="Recursos" component={Input} />
              <FormField name="vinculo_interdisciplinario" label="Vínculo Interdisciplinario" component={Input} />
              <FormField name="aspectos_valoricos_actitudinales" label="Aspectos Valóricos y Actitudinales" component={Input} />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassDialog;