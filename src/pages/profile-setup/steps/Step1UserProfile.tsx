import React from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import { FormData } from '../schemas';

interface Step1UserProfileProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const Step1UserProfile: React.FC<Step1UserProfileProps> = ({ control, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="nombre_completo">Nombre Completo</Label>
        <Controller
          name="nombre_completo"
          control={control}
          render={({ field }) => (
            <Input id="nombre_completo" placeholder="Tu nombre completo" {...field} />
          )}
        />
        {errors.nombre_completo && <p className="text-red-500 text-sm mt-1">{errors.nombre_completo.message}</p>}
      </div>
      <div>
        <Label htmlFor="rol_seleccionado">Rol</Label>
        <Controller
          name="rol_seleccionado"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona tu rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="coordinador">Coordinador</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.rol_seleccionado && <p className="text-red-500 text-sm mt-1">{errors.rol_seleccionado.message}</p>}
      </div>
    </div>
  );
};

export default Step1UserProfile;