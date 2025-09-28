import React, { useState, useEffect } from 'react';
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FormData } from '../schemas';
import { Asignatura, Nivel } from '../api';
import { MultiSelect } from '@/components/MultiSelect'; // Importar el nuevo componente MultiSelect

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
  const selectedRol = watch('rol_seleccionado');
  const selectedAsignaturaIds = watch('asignatura_ids');
  const selectedNivelIds = watch('nivel_ids');

  const [asignaturaSearchTerm, setAsignaturaSearchTerm] = useState('');
  const [filteredAsignaturas, setFilteredAsignaturas] = useState<Asignatura[]>(asignaturas);

  useEffect(() => {
    setFilteredAsignaturas(
      asignaturas.filter((asignatura) =>
        asignatura.nombre.toLowerCase().includes(asignaturaSearchTerm.toLowerCase())
      )
    );
  }, [asignaturaSearchTerm, asignaturas]);

  const handleAsignaturaSelect = (asignaturaId: string) => {
    const current = selectedAsignaturaIds;
    if (current.includes(asignaturaId)) {
      setValue('asignatura_ids', current.filter((id) => id !== asignaturaId));
    } else {
      setValue('asignatura_ids', [...current, asignaturaId]);
    }
  };

  const handleNivelChange = (newSelectedNivelIds: string[]) => {
    setValue('nivel_ids', newSelectedNivelIds);
  };

  const handleCoordinadorAccessChange = (checked: boolean) => {
    if (checked) {
      setValue('asignatura_ids', ['coordinador_access']);
      setValue('nivel_ids', ['coordinador_access']);
    } else {
      setValue('asignatura_ids', []);
      setValue('nivel_ids', []);
    }
  };

  const isCoordinadorAccessSelected = selectedAsignaturaIds.includes('coordinador_access') && selectedNivelIds.includes('coordinador_access');

  return (
    <div className="space-y-6">
      {selectedRol === 'coordinador' ? (
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-blue-50">
          <Checkbox
            id="coordinador-access"
            checked={isCoordinadorAccessSelected}
            onCheckedChange={handleCoordinadorAccessChange}
          />
          <label
            htmlFor="coordinador-access"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Soy un coordinador (acceso total a asignaturas y niveles del establecimiento)
          </label>
        </div>
      ) : (
        <>
          <div>
            <Label className="text-lg font-semibold mb-2 block">Asignaturas que impartes:</Label>
            <Input
              placeholder="Buscar asignaturas..."
              value={asignaturaSearchTerm}
              onChange={(e) => setAsignaturaSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedAsignaturaIds.length > 0 ? (
                selectedAsignaturaIds.map((id) => {
                  const asignatura = asignaturas.find(a => a.id === id);
                  return asignatura ? (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {asignatura.nombre}
                      <button
                        type="button"
                        onClick={() => handleAsignaturaSelect(id)}
                        className="ml-1 h-3 w-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      >
                        &times;
                      </button>
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-muted-foreground text-sm">Ninguna asignatura seleccionada.</span>
              )}
            </div>
            <Command className="rounded-lg border shadow-md max-h-60 overflow-y-auto">
              <CommandList>
                <CommandEmpty>No se encontraron asignaturas.</CommandEmpty>
                <CommandGroup heading="Asignaturas disponibles">
                  {filteredAsignaturas.map((asignatura) => (
                    <CommandItem
                      key={asignatura.id}
                      onSelect={() => handleAsignaturaSelect(asignatura.id)}
                      className={cn(
                        "cursor-pointer flex items-center justify-between",
                        selectedAsignaturaIds.includes(asignatura.id) && "bg-accent text-accent-foreground"
                      )}
                    >
                      {asignatura.nombre}
                      {selectedAsignaturaIds.includes(asignatura.id) && <Check className="h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {errors.asignatura_ids && <p className="text-red-500 text-sm mt-1">{errors.asignatura_ids.message}</p>}
          </div>

          <div>
            <Label className="text-lg font-semibold mb-2 block">Niveles en los que trabajas:</Label>
            <MultiSelect
              options={niveles.map(n => ({ value: n.id, label: n.nombre }))}
              selected={selectedNivelIds}
              onValueChange={handleNivelChange}
              placeholder="Selecciona uno o más niveles"
            />
            {errors.nivel_ids && <p className="text-red-500 text-sm mt-1">{errors.nivel_ids.message}</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default Step3PedagogicalSetup;