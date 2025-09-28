import React from 'react';
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormData } from '../schemas';
import { Asignatura, Nivel } from '../api';

interface Step3PedagogicalSetupProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  setValue: UseFormSetValue<FormData>;
  watch: UseFormWatch<FormData>;
  asignaturas: Asignatura[];
  niveles: Nivel[];
}

const Step3PedagogicalSetup: React.FC<Step3PedagogicalSetupProps> = ({
  control,
  errors,
  setValue,
  watch,
  asignaturas,
  niveles,
}) => {
  const selectedAsignaturaIds = watch('asignatura_ids');
  const selectedNivelIds = watch('nivel_ids');

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-2 block">Asignaturas que impartes:</Label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-3 rounded-md">
          {asignaturas.map((asignatura) => (
            <div key={asignatura.id} className="flex items-center space-x-2">
              <Checkbox
                id={`asignatura-${asignatura.id}`}
                checked={selectedAsignaturaIds.includes(asignatura.id)}
                onCheckedChange={(checked) => {
                  const current = selectedAsignaturaIds;
                  if (checked) {
                    setValue('asignatura_ids', [...current, asignatura.id]);
                  } else {
                    setValue('asignatura_ids', current.filter((id) => id !== asignatura.id));
                  }
                }}
              />
              <label
                htmlFor={`asignatura-${asignatura.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {asignatura.nombre}
              </label>
            </div>
          ))}
        </div>
        {errors.asignatura_ids && <p className="text-red-500 text-sm mt-1">{errors.asignatura_ids.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-semibold mb-2 block">Niveles en los que trabajas:</Label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-3 rounded-md">
          {niveles.map((nivel) => (
            <div key={nivel.id} className="flex items-center space-x-2">
              <Checkbox
                id={`nivel-${nivel.id}`}
                checked={selectedNivelIds.includes(nivel.id)}
                onCheckedChange={(checked) => {
                  const current = selectedNivelIds;
                  if (checked) {
                    setValue('nivel_ids', [...current, nivel.id]);
                  } else {
                    setValue('nivel_ids', current.filter((id) => id !== nivel.id));
                  }
                }}
              />
              <label
                htmlFor={`nivel-${nivel.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {nivel.nombre}
              </label>
            </div>
          ))}
        </div>
        {errors.nivel_ids && <p className="text-red-500 text-sm mt-1">{errors.nivel_ids.message}</p>}
      </div>
    </div>
  );
};

export default Step3PedagogicalSetup;