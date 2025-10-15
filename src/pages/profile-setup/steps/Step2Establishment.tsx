import React, { useState } from 'react';
import { Control, FieldErrors, UseFormSetValue, UseFormGetValues, UseFormWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Controller } from 'react-hook-form';
import { FormData } from '../schemas';
import { createEstablishmentAndPromoteCoordinator, requestJoinEstablishment, searchEstablishments } from '../api';
import { showSuccess, showError } from '@/utils/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

interface Step2EstablishmentProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  setValue: UseFormSetValue<FormData>;
  getValues: UseFormGetValues<FormData>;
  watch: UseFormWatch<FormData>;
  setCurrentStep: (step: number) => void;
}

const Step2Establishment: React.FC<Step2EstablishmentProps> = ({
  control,
  errors,
  setValue,
  getValues,
  watch,
  setCurrentStep,
}) => {
  const [isEstablishmentDialogOpen, setIsEstablishmentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: searchResults = [] } = useQuery({
    queryKey: ['searchEstablishments', debouncedSearchTerm],
    queryFn: () => searchEstablishments(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length > 2,
  });

  const selectedEstablishmentId = watch('establecimiento_id');
  const selectedEstablishmentName = watch('establecimiento_nombre');

  const createEstablishmentMutation = useMutation({
    mutationFn: createEstablishmentAndPromoteCoordinator,
    onSuccess: (newEstablishmentId) => {
      const newEstData = getValues();
      showSuccess("Establecimiento creado y vinculado exitosamente. Tu rol es ahora Coordinador.");
      setValue('establecimiento_id', newEstablishmentId as string);
      setValue('establecimiento_nombre', newEstData.new_establecimiento_nombre);
      setIsEstablishmentDialogOpen(false);
      setCurrentStep(3);
    },
    onError: (error: any) => {
      showError("Error al crear el establecimiento: " + error.message);
    },
  });

  const joinRequestMutation = useMutation({
    mutationFn: requestJoinEstablishment,
    onSuccess: () => {
      showSuccess("Solicitud de unión enviada. Espera la aprobación del administrador.");
      setCurrentStep(3);
    },
    onError: (error: any) => {
      showError("Error al solicitar unión al establecimiento: " + error.message);
    },
  });

  const handleCreateEstablishment = () => {
    const newEstData = getValues();
    const { new_establecimiento_nombre, new_establecimiento_direccion, new_establecimiento_comuna, new_establecimiento_region, new_establecimiento_telefono, new_establecimiento_email_contacto } = newEstData;

    if (!new_establecimiento_nombre || !new_establecimiento_direccion || !new_establecimiento_comuna || !new_establecimiento_region) {
      showError("Por favor, completa todos los campos obligatorios para crear un establecimiento.");
      return;
    }

    createEstablishmentMutation.mutate({
      p_nombre: new_establecimiento_nombre,
      p_direccion: new_establecimiento_direccion,
      p_comuna: new_establecimiento_comuna,
      p_region: new_establecimiento_region,
      p_telefono: new_establecimiento_telefono || null,
      p_email_contacto: new_establecimiento_email_contacto || null,
    });
  };

  const handleSolicitarUnion = () => {
    if (!selectedEstablishmentId) {
      showError("Por favor, selecciona un establecimiento para solicitar unirte.");
      return;
    }
    joinRequestMutation.mutate(selectedEstablishmentId);
  };

  const isActionLoading = createEstablishmentMutation.isPending || joinRequestMutation.isPending;

  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold">Vincula tu perfil a un establecimiento:</p>
      <div className="space-y-2">
        <Label htmlFor="establecimiento_search">Buscar Establecimiento</Label>
        <Input
          id="establecimiento_search"
          placeholder="Escribe el nombre del establecimiento"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {debouncedSearchTerm.length > 2 && searchResults.length > 0 && (
          <Command className="rounded-lg border shadow-md">
            <CommandList>
              <CommandEmpty>No se encontraron establecimientos.</CommandEmpty>
              <CommandGroup heading="Resultados de búsqueda">
                {searchResults.map((est) => (
                  <CommandItem
                    key={est.id}
                    onSelect={() => {
                      setValue('establecimiento_id', est.id);
                      setValue('establecimiento_nombre', est.nombre);
                      setSearchTerm(est.nombre);
                    }}
                    className={cn(
                      "cursor-pointer",
                      selectedEstablishmentId === est.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    {est.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
        {selectedEstablishmentId && (
          <p className="text-sm text-muted-foreground">Establecimiento seleccionado: <span className="font-medium">{selectedEstablishmentName}</span></p>
        )}
        {errors.establecimiento_id && <p className="text-red-500 text-sm mt-1">{errors.establecimiento_id.message}</p>}
      </div>

      <Button onClick={handleSolicitarUnion} disabled={!selectedEstablishmentId || isActionLoading} className="w-full">
        {joinRequestMutation.isPending ? 'Solicitando...' : 'Solicitar Unirme'}
      </Button>

      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">O</span>
      </div>

      <Dialog open={isEstablishmentDialogOpen} onOpenChange={setIsEstablishmentDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Crear mi Establecimiento
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Establecimiento</DialogTitle>
            <DialogDescription>
              Ingresa los detalles de tu nuevo establecimiento. Serás asignado como coordinador.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_establecimiento_nombre" className="text-right">Nombre</Label>
              <Controller
                name="new_establecimiento_nombre"
                control={control}
                render={({ field }) => (
                  <Input id="new_establecimiento_nombre" placeholder="Nombre del colegio" className="col-span-3" {...field} />
                )}
              />
              {errors.new_establecimiento_nombre && <p className="col-span-4 col-start-2 text-red-500 text-sm mt-1">{errors.new_establecimiento_nombre.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_establecimiento_direccion" className="text-right">Dirección</Label>
              <Controller
                name="new_establecimiento_direccion"
                control={control}
                render={({ field }) => (
                  <Input id="new_establecimiento_direccion" placeholder="Dirección completa" className="col-span-3" {...field} />
                )}
              />
              {errors.new_establecimiento_direccion && <p className="col-span-4 col-start-2 text-red-500 text-sm mt-1">{errors.new_establecimiento_direccion.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_establecimiento_comuna" className="text-right">Comuna</Label>
              <Controller
                name="new_establecimiento_comuna"
                control={control}
                render={({ field }) => (
                  <Input id="new_establecimiento_comuna" placeholder="Comuna" className="col-span-3" {...field} />
                )}
              />
              {errors.new_establecimiento_comuna && <p className="col-span-4 col-start-2 text-red-500 text-sm mt-1">{errors.new_establecimiento_comuna.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_establecimiento_region" className="text-right">Región</Label>
              <Controller
                name="new_establecimiento_region"
                control={control}
                render={({ field }) => (
                  <Input id="new_establecimiento_region" placeholder="Región" className="col-span-3" {...field} />
                )}
              />
              {errors.new_establecimiento_region && <p className="col-span-4 col-start-2 text-red-500 text-sm mt-1">{errors.new_establecimiento_region.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_establecimiento_telefono" className="text-right">Teléfono (Opcional)</Label>
              <Controller
                name="new_establecimiento_telefono"
                control={control}
                render={({ field }) => (
                  <Input id="new_establecimiento_telefono" placeholder="Teléfono de contacto" className="col-span-3" {...field} />
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_establecimiento_email_contacto" className="text-right">Email (Opcional)</Label>
              <Controller
                name="new_establecimiento_email_contacto"
                control={control}
                render={({ field }) => (
                  <Input id="new_establecimiento_email_contacto" placeholder="Email de contacto" className="col-span-3" {...field} />
                )}
              />
              {errors.new_establecimiento_email_contacto && <p className="col-span-4 col-start-2 text-red-500 text-sm mt-1">{errors.new_establecimiento_email_contacto.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCreateEstablishment} disabled={isActionLoading}>
              {createEstablishmentMutation.isPending ? 'Creando...' : 'Crear Establecimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step2Establishment;