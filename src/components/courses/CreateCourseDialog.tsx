import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchNiveles, crearCurso, inscribirYCrearEstudiantes, Nivel } from '@/api/coursesApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  nombre: z.string().min(1, "El nombre o letra del curso es requerido."),
  anio: z.number().int().min(2020, "El año debe ser válido."),
  estudiantesTexto: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: () => void;
}

const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({ isOpen, onClose, onCourseCreated }) => {
  const { activeEstablishment } = useEstablishment();
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { anio: new Date().getFullYear() },
  });

  useEffect(() => {
    if (isOpen) {
      fetchNiveles()
        .then(setNiveles)
        .catch(err => showError(`Error al cargar niveles: ${err.message}`));
    } else {
      reset({ anio: new Date().getFullYear(), estudiantesTexto: '', nombre: '', nivelId: undefined });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    if (!activeEstablishment) {
      showError("No hay un establecimiento activo seleccionado.");
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading("Creando curso...");

    try {
      const nuevoCursoId = await crearCurso(data.nombre, data.nivelId, data.anio, activeEstablishment.id);
      dismissToast(toastId);
      showSuccess(`Curso "${data.nombre}" creado exitosamente.`);

      if (data.estudiantesTexto && data.estudiantesTexto.trim().length > 0) {
        const estudiantes = data.estudiantesTexto.trim().split('\n').map(line => {
          const parts = line.split(',').map(s => s.trim());
          const nombre_completo = parts[0] || null;
          const rut = parts[1] || null;
          const email = parts[2] || null;
          return { nombre_completo, rut, email };
        }).filter(e => e.nombre_completo); // Solo procesar si al menos hay un nombre

        if (estudiantes.length > 0) {
          const studentToastId = showLoading(`Inscribiendo ${estudiantes.length} estudiantes...`);
          await inscribirYCrearEstudiantes(nuevoCursoId, estudiantes);
          dismissToast(studentToastId);
          showSuccess("Proceso de inscripción completado. Puedes descargar las credenciales desde la página de detalles del curso.");
        }
      }

      onCourseCreated();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al crear el curso: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso</DialogTitle>
          <DialogDescription>
            Define los detalles del nuevo curso y, opcionalmente, inscribe a los estudiantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nivelId" className="text-right">Nivel</Label>
            <div className="col-span-3">
              <Controller
                name="nivelId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                    <SelectContent>
                      {niveles.map(nivel => <SelectItem key={nivel.id} value={nivel.id}>{nivel.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.nivelId && <p className="text-red-500 text-sm mt-1">{errors.nivelId.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nombre" className="text-right">Nombre/Letra</Label>
            <div className="col-span-3">
              <Input id="nombre" placeholder="Ej: A, B, Ciencias" {...register('nombre')} />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="anio" className="text-right">Año</Label>
            <div className="col-span-3">
              <Input id="anio" type="number" {...register('anio', { valueAsNumber: true })} />
              {errors.anio && <p className="text-red-500 text-sm mt-1">{errors.anio.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="estudiantesTexto">Inscripción Masiva de Estudiantes (Opcional)</Label>
            <Textarea
              id="estudiantesTexto"
              placeholder="Pega la lista de estudiantes aquí. Formato por línea: Nombre Completo, RUT, correo@ejemplo.com"
              {...register('estudiantesTexto')}
              rows={6}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cada estudiante en una nueva línea. Separa nombre, RUT y correo con comas. El RUT y el correo son opcionales.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Curso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;