import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveObjetivoAprendizaje, ObjetivoAprendizaje, Nivel, Asignatura, Eje } from '@/api/superAdminApi';
import { showSuccess, showError } from '@/utils/toast';

const schema = z.object({
  codigo: z.string().min(1, "El código es requerido."),
  descripcion: z.string().min(10, "La descripción es requerida."),
  nivel_id: z.string().uuid("Debes seleccionar un nivel."),
  asignatura_id: z.string().uuid("Debes seleccionar una asignatura."),
  eje_id: z.string().uuid("Debes seleccionar un eje."),
});

type FormData = z.infer<typeof schema>;

interface ObjetivoAprendizajeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  oa?: ObjetivoAprendizaje | null;
  niveles: Nivel[];
  asignaturas: Asignatura[];
  ejes: Eje[];
}

const ObjetivoAprendizajeEditDialog: React.FC<ObjetivoAprendizajeEditDialogProps> = ({ isOpen, onClose, onSaved, oa, niveles, asignaturas, ejes }) => {
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [filteredEjes, setFilteredEjes] = useState<Eje[]>([]);
  const selectedAsignaturaId = watch('asignatura_id');

  useEffect(() => {
    if (selectedAsignaturaId) {
      setFilteredEjes(ejes.filter(eje => eje.asignatura_id === selectedAsignaturaId));
    } else {
      setFilteredEjes([]);
    }
  }, [selectedAsignaturaId, ejes]);

  useEffect(() => {
    if (isOpen) {
      if (oa) {
        reset({
          codigo: oa.codigo,
          descripcion: oa.descripcion,
          nivel_id: oa.nivel_id,
          asignatura_id: oa.asignatura_id,
          eje_id: oa.eje_id,
        });
      } else {
        reset({ codigo: '', descripcion: '', nivel_id: undefined, asignatura_id: undefined, eje_id: undefined });
      }
    }
  }, [isOpen, oa, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await saveObjetivoAprendizaje(data, oa?.id);
      showSuccess(`OA ${oa ? 'actualizado' : 'creado'} correctamente.`);
      onSaved();
      onClose();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{oa ? 'Editar' : 'Crear'} Objetivo de Aprendizaje</DialogTitle>
          <DialogDescription>
            Define un OA y sus relaciones con el currículum.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nivel_id">Nivel</Label>
              <Controller name="nivel_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.nivel_id && <p className="text-red-500 text-sm mt-1">{errors.nivel_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="asignatura_id">Asignatura</Label>
              <Controller name="asignatura_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.asignatura_id && <p className="text-red-500 text-sm mt-1">{errors.asignatura_id.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eje_id">Eje</Label>
              <Controller name="eje_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedAsignaturaId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{filteredEjes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.eje_id && <p className="text-red-500 text-sm mt-1">{errors.eje_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="codigo">Código (Ej: OA 1)</Label>
              <Controller name="codigo" control={control} render={({ field }) => <Input id="codigo" {...field} />} />
              {errors.codigo && <p className="text-red-500 text-sm mt-1">{errors.codigo.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción del OA</Label>
            <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" {...field} />} />
            {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ObjetivoAprendizajeEditDialog;