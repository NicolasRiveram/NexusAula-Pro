import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { inscribirYCrearEstudiantes } from '@/api/coursesApi';
import { showSuccess, showError } from '@/utils/toast';
import { Download, UserPlus, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const schema = z.object({
  estudiantesTexto: z.string().min(1, "Debes ingresar al menos un estudiante."),
});

type FormData = z.infer<typeof schema>;

interface NewCredential {
  name: string;
  email: string;
  pass: string;
}

interface EnrollStudentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentsEnrolled: () => void;
  cursoId: string;
  cursoNombre: string;
}

const EnrollStudentsDialog: React.FC<EnrollStudentsDialogProps> = ({ isOpen, onClose, onStudentsEnrolled, cursoId, cursoNombre }) => {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [newCredentials, setNewCredentials] = useState<NewCredential[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleClose = () => {
    reset({ estudiantesTexto: '' });
    setStep('form');
    setNewCredentials([]);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  const handleDownloadCredentials = () => {
    if (newCredentials.length === 0) return;
    const csvHeader = "Nombre Completo,Email de Acceso,Contraseña Temporal\n";
    const csvRows = newCredentials.map(c => `"${c.name}","${c.email}","${c.pass}"`).join('\n');
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `credenciales-${cursoNombre}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!cursoId) throw new Error("No se ha seleccionado un curso válido.");
      
      const estudiantes = data.estudiantesTexto.trim().split('\n').map(line => {
        const parts = line.split(',').map(s => s.trim());
        return { nombre_completo: parts[0] || null, rut: parts[1] || null, email: parts[2] || null };
      }).filter(e => e.nombre_completo);

      if (estudiantes.length === 0) throw new Error("No se encontraron estudiantes válidos en el texto ingresado.");
      
      return await inscribirYCrearEstudiantes(cursoId, estudiantes);
    },
    onSuccess: (result) => {
      const resultados = result.resultados || [];
      const creados = resultados.filter((r: any) => r.status === 'creado_e_inscrito');
      const inscritos = resultados.filter((r: any) => r.status === 'inscrito_existente').length;
      const yaInscritos = resultados.filter((r: any) => r.status === 'ya_inscrito').length;
      const errores = resultados.filter((r: any) => r.status === 'error');

      let successMessage = `Proceso completado para "${cursoNombre}".`;
      successMessage += `\n- ${creados.length} nuevos estudiantes creados e inscritos.`;
      successMessage += `\n- ${inscritos} estudiantes existentes inscritos.`;
      if (yaInscritos > 0) successMessage += `\n- ${yaInscritos} ya estaban en el curso.`;
      
      showSuccess(successMessage, { duration: 8000 });

      if (creados.length > 0) {
        setNewCredentials(creados.map((c: any) => ({ name: c.nombre_completo, email: c.generated_email, pass: c.generated_password })));
      }

      if (errores.length > 0) {
        let errorMessage = `Se encontraron ${errores.length} errores:`;
        errores.forEach((e: any) => {
          errorMessage += `\n- ${e.nombre_completo}: ${e.mensaje}`;
        });
        showError(errorMessage, { duration: 10000 });
      }

      onStudentsEnrolled();
      setStep('result');
    },
    onError: (error: any) => {
      showError(`Error al inscribir estudiantes: ${error.message}`);
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'form' ? (
          <>
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
                <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {mutation.isPending ? 'Inscribiendo...' : 'Inscribir Estudiantes'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Proceso de Inscripción Completo</DialogTitle>
              <DialogDescription>
                Los estudiantes han sido inscritos en "{cursoNombre}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {newCredentials.length > 0 ? (
                <>
                  <p>Se han creado cuentas para {newCredentials.length} nuevos estudiantes. Puedes descargar sus credenciales de acceso ahora.</p>
                  <Button onClick={handleDownloadCredentials} className="w-full mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Credenciales (CSV)
                  </Button>
                </>
              ) : (
                <p>Todos los estudiantes ya existían en la plataforma y han sido inscritos en el curso.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnrollStudentsDialog;