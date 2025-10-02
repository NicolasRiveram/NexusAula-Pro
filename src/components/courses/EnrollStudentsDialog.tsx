import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { inscribirYCrearEstudiantes } from '@/api/coursesApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  estudiantesTexto: z.string().min(1, "Debes ingresar al menos un estudiante."),
});

type FormData = z.infer<typeof schema>;

interface EnrollStudentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentsEnrolled: () => void;
  cursoId: string;
  cursoNombre: string;
}

const EnrollStudentsDialog: React.FC<EnrollStudentsDialogProps> = ({ isOpen, onClose, onStudentsEnrolled, cursoId, cursoNombre }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ estudiantesTexto: '' });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    if (!cursoId) {
      showError("No se ha seleccionado un curso válido.");
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading("Procesando lista de estudiantes...");

    try {
      const estudiantes = data.estudiantesTexto.trim().split('\n').map(line => {
        const parts = line.split(',').map(s => s.trim());
        const nombre_completo = parts[0] || null;
        const rut = parts[1] || null;
        const email = parts[2] || null;
        return { nombre_completo, rut, email };
      }).filter(e => e.nombre_completo);

      if (estudiantes.length > 0) {
        const result = await inscribirYCrearEstudiantes(cursoId, estudiantes);
        dismissToast(toastId);

        const resultados = result.resultados || [];
        const creados = resultados.filter((r: any) => r.status === 'creado_e_inscrito').length;
        const inscritos = resultados.filter((r: any) => r.status === 'inscrito_existente').length;
        const yaInscritos = resultados.filter((r: any) => r.status === 'ya_inscrito').length;
        const errores = resultados.filter((r: any) => r.status === 'error');

        let successMessage = `Proceso completado para "${cursoNombre}".`;
        successMessage += `\n- ${creados} nuevos estudiantes creados e inscritos.`;
        successMessage += `\n- ${inscritos} estudiantes existentes inscritos.`;
        if (yaInscritos > 0) successMessage += `\n- ${yaInscritos} ya estaban en el curso.`;
        
        showSuccess(successMessage + "\n\nPuedes descargar las credenciales desde la página de detalles del curso.");

        if (errores.length > 0) {
          let errorMessage = `Se encontraron ${errores.length} errores:`;
          errores.forEach((e: any) => {
            errorMessage += `\n- ${e.nombre_completo}: ${e.mensaje}`;
          });
          showError(errorMessage, { duration: 10000 });
        }

        onStudentsEnrolled();
        onClose();
      } else {
        dismissToast(toastId);
        showError("No se encontraron estudiantes válidos en el texto ingresado.");
      }
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al inscribir estudiantes: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inscribir Estudiantes en "{cursoNombre}"</DialogTitle>
          <DialogDescription>
            Pega la lista de nuevos estudiantes para inscribirlos en este curso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="estudiantesTexto">Lista de Estudiantes</Label>
            <Textarea
              id="estudiantesTexto"
              placeholder="Pega la lista de estudiantes aquí. Formato por línea: Nombre Completo, RUT, correo@ejemplo.com"
              {...register('estudiantesTexto')}
              rows={8}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cada estudiante en una nueva línea. Separa nombre, RUT y correo con comas. El RUT y el correo son opcionales.
            </p>
            {errors.estudiantesTexto && <p className="text-red-500 text-sm mt-1">{errors.estudiantesTexto.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Inscribiendo...' : 'Inscribir Estudiantes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollStudentsDialog;