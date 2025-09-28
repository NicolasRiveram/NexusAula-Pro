"use client";

    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useForm, Controller } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import * as z from 'zod';
    import { supabase } from '@/integrations/supabase/client';
    import { showSuccess, showError } from '@/utils/toast';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
    import { ChevronLeft, ChevronRight } from 'lucide-react';
    import { cn } from '@/lib/utils';

    // --- Schemas de validación para cada paso ---
    const step1Schema = z.object({
      nombre_completo: z.string().min(3, "El nombre completo es requerido."),
      rol_seleccionado: z.enum(['docente', 'coordinador'], {
        required_error: "Debes seleccionar un rol.",
      }),
    });

    const step2Schema = z.object({
      establecimiento_id: z.string().uuid().optional(),
      establecimiento_nombre: z.string().optional(), // Para el buscador
      new_establecimiento_nombre: z.string().optional(),
      new_establecimiento_direccion: z.string().optional(),
      new_establecimiento_comuna: z.string().optional(),
      new_establecimiento_region: z.string().optional(),
      new_establecimiento_telefono: z.string().optional(),
      new_establecimiento_email_contacto: z.string().email().optional().or(z.literal('')),
    }).superRefine((data, ctx) => {
      if (!data.establecimiento_id && !data.new_establecimiento_nombre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes seleccionar un establecimiento o crear uno nuevo.",
          path: ['establecimiento_id'],
        });
      }
      if (data.new_establecimiento_nombre) {
        if (!data.new_establecimiento_direccion) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La dirección es requerida para un nuevo establecimiento.", path: ['new_establecimiento_direccion'] });
        }
        if (!data.new_establecimiento_comuna) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La comuna es requerida para un nuevo establecimiento.", path: ['new_establecimiento_comuna'] });
        }
        if (!data.new_establecimiento_region) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La región es requerida para un nuevo establecimiento.", path: ['new_establecimiento_region'] });
        }
      }
    });

    const step3Schema = z.object({
      asignatura_ids: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos una asignatura."),
      nivel_ids: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos un nivel."),
    });

    const step4Schema = z.object({}); // No hay campos de formulario para este paso

    type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema> & z.infer<typeof step4Schema>;

    interface Asignatura {
      id: string;
      nombre: string;
    }

    interface Nivel {
      id: string;
      nombre: string;
    }

    interface Establecimiento {
      id: string;
      nombre: string;
    }

    const ProfileSetup = () => {
      const navigate = useNavigate();
      const [currentStep, setCurrentStep] = useState(1);
      const [isCreatingEstablishment, setIsCreatingEstablishment] = useState(false);
      const [isEstablishmentDialogOpen, setIsEstablishmentDialogOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const [searchResults, setSearchResults] = useState<Establecimiento[]>([]);
      const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
      const [niveles, setNiveles] = useState<Nivel[]>([]);
      const [loadingData, setLoadingData] = useState(true);
      const [isActionLoading, setIsActionLoading] = useState(false); // Nuevo estado de carga para acciones

      const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        trigger,
        getValues,
        reset,
      } = useForm<FormData>({
        resolver: zodResolver(
          currentStep === 1 ? step1Schema :
          currentStep === 2 ? step2Schema :
          currentStep === 3 ? step3Schema :
          step4Schema
        ),
        defaultValues: {
          nombre_completo: '',
          rol_seleccionado: undefined,
          establecimiento_id: undefined,
          establecimiento_nombre: '',
          new_establecimiento_nombre: '',
          new_establecimiento_direccion: '',
          new_establecimiento_comuna: '',
          new_establecimiento_region: '',
          new_establecimiento_telefono: '',
          new_establecimiento_email_contacto: '',
          asignatura_ids: [],
          nivel_ids: [],
        },
      });

      const selectedRol = watch('rol_seleccionado');
      const selectedEstablishmentId = watch('establecimiento_id');
      const selectedAsignaturaIds = watch('asignatura_ids');
      const selectedNivelIds = watch('nivel_ids');

      // Cargar datos iniciales (perfil, asignaturas, niveles)
      useEffect(() => {
        const loadInitialData = async () => {
          setLoadingData(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            showError("No se encontró usuario autenticado.");
            navigate('/login');
            return;
          }

          // Cargar perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from('perfiles')
            .select('nombre_completo, rol, perfil_completo')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error("Error al cargar perfil:", profileError);
            showError("Error al cargar tu perfil.");
            // Si el perfil no existe, el trigger handle_new_user debería haberlo creado.
            // Podríamos intentar crearlo aquí o redirigir. Por ahora, asumimos que existe.
          } else if (profileData.perfil_completo) {
            showSuccess("Tu perfil ya está configurado. Redirigiendo al dashboard.");
            navigate('/dashboard');
            return;
          } else {
            setValue('nombre_completo', profileData.nombre_completo || user.email?.split('@')[0] || '');
            setValue('rol_seleccionado', profileData.rol || undefined);
          }

          // Cargar asignaturas
          const { data: asignaturasData, error: asignaturasError } = await supabase
            .from('asignaturas')
            .select('id, nombre')
            .order('nombre');
          if (asignaturasError) {
            console.error("Error al cargar asignaturas:", asignaturasError);
            showError("Error al cargar las asignaturas.");
          } else {
            setAsignaturas(asignaturasData);
          }

          // Cargar niveles
          const { data: nivelesData, error: nivelesError } = await supabase
            .from('niveles')
            .select('id, nombre')
            .order('orden');
          if (nivelesError) {
            console.error("Error al cargar niveles:", nivelesError);
            showError("Error al cargar los niveles.");
          } else {
            setNiveles(nivelesData);
          }
          setLoadingData(false);
        };

        loadInitialData();
      }, [navigate, setValue]);

      // Buscar establecimientos
      useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
          if (searchTerm.length > 2) {
            const { data, error } = await supabase.rpc('buscar_establecimientos', { query_text: searchTerm });
            if (error) {
              console.error("Error buscando establecimientos:", error);
              showError("Error al buscar establecimientos.");
              setSearchResults([]);
            } else {
              setSearchResults(data || []);
            }
          } else {
            setSearchResults([]);
          }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
      }, [searchTerm]);

      const handleNext = async () => {
        const isValid = await trigger();
        if (isValid) {
          setCurrentStep((prev) => prev + 1);
        } else {
          showError("Por favor, completa todos los campos requeridos antes de continuar.");
        }
      };

      const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
      };

      const handleCreateEstablishment = async () => {
        const newEstData = getValues();
        const { new_establecimiento_nombre, new_establecimiento_direccion, new_establecimiento_comuna, new_establecimiento_region, new_establecimiento_telefono, new_establecimiento_email_contacto } = newEstData;

        if (!new_establecimiento_nombre || !new_establecimiento_direccion || !new_establecimiento_comuna || !new_establecimiento_region) {
          showError("Por favor, completa todos los campos obligatorios para crear un establecimiento.");
          return;
        }

        setIsActionLoading(true); // Usar el nuevo estado de carga
        try {
          const { data, error } = await supabase.rpc('crear_establecimiento_y_promover_a_coordinador', {
            p_nombre: new_establecimiento_nombre,
            p_direccion: new_establecimiento_direccion,
            p_comuna: new_establecimiento_comuna,
            p_region: new_establecimiento_region,
            p_telefono: new_establecimiento_telefono || null,
            p_email_contacto: new_establecimiento_email_contacto || null,
          });

          if (error) {
            console.error("Error al crear establecimiento:", error);
            showError("Error al crear el establecimiento: " + error.message);
          } else {
            showSuccess("Establecimiento creado y vinculado exitosamente. Tu rol es ahora Coordinador.");
            setValue('establecimiento_id', data as string); // El RPC devuelve el ID del nuevo establecimiento
            setValue('establecimiento_nombre', new_establecimiento_nombre);
            setIsEstablishmentDialogOpen(false);
            setIsCreatingEstablishment(false); // Resetear el estado de creación
            setCurrentStep((prev) => prev + 1); // Avanzar al siguiente paso
          }
        } catch (error: any) {
          console.error("Error inesperado al crear establecimiento:", error);
          showError("Error inesperado: " + error.message);
        } finally {
          setIsActionLoading(false); // Restablecer el estado de carga
        }
      };

      const handleSolicitarUnion = async () => {
        if (!selectedEstablishmentId) {
          showError("Por favor, selecciona un establecimiento para solicitar unirte.");
          return;
        }

        setIsActionLoading(true); // Usar el nuevo estado de carga
        try {
          const { error } = await supabase.rpc('solicitar_union_a_establecimiento', {
            p_establecimiento_id: selectedEstablishmentId,
          });

          if (error) {
            console.error("Error al solicitar unión:", error);
            showError("Error al solicitar unión al establecimiento: " + error.message);
          } else {
            showSuccess("Solicitud de unión enviada. Espera la aprobación del administrador.");
            setCurrentStep((prev) => prev + 1); // Avanzar al siguiente paso
          }
        } catch (error: any) {
          console.error("Error inesperado al solicitar unión:", error);
          showError("Error inesperado: " + error.message);
        } finally {
          setIsActionLoading(false); // Restablecer el estado de carga
        }
      };

      const handleCompleteSetup = handleSubmit(async (data) => {
        const { nombre_completo, rol_seleccionado, asignatura_ids, nivel_ids } = data;

        if (!nombre_completo || !rol_seleccionado || asignatura_ids.length === 0 || nivel_ids.length === 0) {
          showError("Por favor, completa todos los pasos antes de finalizar.");
          return;
        }

        try {
          await supabase.rpc('completar_perfil_docente', {
            p_nombre_completo: nombre_completo,
            p_rol_seleccionado: rol_seleccionado,
            p_asignatura_ids: asignatura_ids,
            p_nivel_ids: nivel_ids,
          });
          showSuccess("¡Configuración de perfil completada exitosamente!");
          navigate('/dashboard');
        } catch (error: any) {
          console.error("Error al completar perfil:", error);
          showError("Error al completar la configuración del perfil: " + error.message);
        }
      });

      if (loadingData) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Cargando datos de configuración...</p>
          </div>
        );
      );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Configuración de Perfil ({currentStep}/5)</CardTitle>
              <CardDescription className="text-center">
                Completa los siguientes pasos para configurar tu perfil de {selectedRol || 'usuario'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Paso 1: Perfil de Usuario */}
              {currentStep === 1 && (
                <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
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
                </form>
              )}

              {/* Paso 2: Establecimiento */}
              {currentStep === 2 && (
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
                    {searchTerm.length > 2 && searchResults.length > 0 && (
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
                                  setSearchTerm(est.nombre); // Para mostrar el nombre seleccionado en el input
                                  setSearchResults([]); // Limpiar resultados
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
                      <p className="text-sm text-muted-foreground">Establecimiento seleccionado: <span className="font-medium">{watch('establecimiento_nombre')}</span></p>
                    )}
                    {errors.establecimiento_id && <p className="text-red-500 text-sm mt-1">{errors.establecimiento_id.message}</p>}
                  </div>

                  <Button onClick={handleSolicitarUnion} disabled={!selectedEstablishmentId || isActionLoading} className="w-full">
                    {isActionLoading ? 'Solicitando...' : 'Solicitar Unirme'}
                  </Button>

                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O</span>
                  </div>

                  <Dialog open={isEstablishmentDialogOpen} onOpenChange={setIsEstablishmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" onClick={() => setIsCreatingEstablishment(true)}>
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
                          {isActionLoading ? 'Creando...' : 'Crear Establecimiento'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Paso 3: Configuración Pedagógica */}
              {currentStep === 3 && (
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
              )}

              {/* Paso 4: Membresía */}
              {currentStep === 4 && (
                <div className="space-y-6 text-center">
                  <h3 className="text-xl font-semibold">Tu Membresía</h3>
                  <p className="text-muted-foreground">Actualmente estás en un plan de prueba.</p>
                  <p>
                    Explora todas las funcionalidades y decide el plan que mejor se adapte a tus necesidades.
                  </p>
                  <Button variant="link" onClick={() => showSuccess("Esta funcionalidad se implementará pronto.")}>
                    Ver planes de suscripción
                  </Button>
                </div>
              )}

              {/* Paso 5: Finalización */}
              {currentStep === 5 && (
                <div className="space-y-6 text-center">
                  <h3 className="text-xl font-semibold">¡Casi listo!</h3>
                  <p className="text-muted-foreground">
                    Has completado la configuración inicial de tu perfil. Haz clic en "Completar Configuración" para finalizar y acceder a la aplicación.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} disabled={isActionLoading || isSubmitting}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
              )}
              {currentStep < 5 && (
                <Button onClick={handleNext} disabled={isActionLoading || isSubmitting} className={currentStep === 1 ? 'ml-auto' : ''}>
                  Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {currentStep === 5 && (
                <Button onClick={handleCompleteSetup} disabled={isActionLoading || isSubmitting} className="ml-auto">
                  {isSubmitting ? 'Completando...' : 'Completar Configuración'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    };

    export default ProfileSetup;