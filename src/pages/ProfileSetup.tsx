"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { completeDocenteProfile, completeCoordinatorProfile, fetchAsignaturas, fetchNiveles } from './profile-setup/api';
import { useProfileSetupForm } from './profile-setup/use-profile-setup-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Importar los componentes de los pasos
import Step1UserProfile from './profile-setup/steps/Step1UserProfile';
import Step2Establishment from './profile-setup/steps/Step2Establishment';
import Step3PedagogicalSetup from './profile-setup/steps/Step3PedagogicalSetup';
import Step4Membership from './profile-setup/steps/Step4Membership';
import Step5Finalization from './profile-setup/steps/Step5Finalization';

const ProfileSetupSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  </div>
);

const ProfileSetup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    currentStep,
    setCurrentStep,
    control,
    handleSubmit,
    watch,
    setValue,
    errors,
    handleNext,
    handleBack,
    getValues,
  }
  = useProfileSetupForm();

  const { user, profile, loading: authLoading } = useAuth();

  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: fetchAsignaturas,
  });

  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({
    queryKey: ['niveles'],
    queryFn: fetchNiveles,
  });

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.perfil_completo) {
        showSuccess("Tu perfil ya está configurado. Redirigiendo al dashboard.");
        navigate('/dashboard');
      } else {
        setValue('nombre_completo', profile.nombre_completo || user?.email?.split('@')[0] || '');
        setValue('rol_seleccionado', profile.rol || undefined);
      }
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [profile, authLoading, navigate, setValue, user]);

  const docenteMutation = useMutation({
    mutationFn: completeDocenteProfile,
    onSuccess: () => {
      showSuccess("¡Configuración de perfil completada exitosamente!");
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      showError("Error al completar la configuración del perfil: " + error.message);
    },
  });

  const coordinatorMutation = useMutation({
    mutationFn: completeCoordinatorProfile,
    onSuccess: () => {
      showSuccess("¡Configuración de perfil completada exitosamente!");
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      showError("Error al completar la configuración del perfil: " + error.message);
    },
  });

  const selectedRol = watch('rol_seleccionado');

  const handleCompleteSetup = handleSubmit(async (data) => {
    const { nombre_completo, rol_seleccionado, asignatura_ids, nivel_ids } = data;

    if (rol_seleccionado === 'docente') {
      docenteMutation.mutate({
        p_nombre_completo: nombre_completo,
        p_rol_seleccionado: rol_seleccionado,
        p_asignatura_ids: asignatura_ids as string[],
        p_nivel_ids: nivel_ids as string[],
      });
    } else if (rol_seleccionado === 'coordinador') {
      coordinatorMutation.mutate({
        p_nombre_completo: nombre_completo,
      });
    }
  });

  const loadingData = authLoading || isLoadingAsignaturas || isLoadingNiveles;
  const finalSubmitting = docenteMutation.isPending || coordinatorMutation.isPending;

  if (loadingData) {
    return <ProfileSetupSkeleton />;
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
          {currentStep === 1 && <Step1UserProfile control={control} errors={errors} />}
          {currentStep === 2 && (
            <Step2Establishment
              control={control}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
              watch={watch}
              setCurrentStep={setCurrentStep}
            />
          )}
          {currentStep === 3 && (
            <Step3PedagogicalSetup
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              asignaturas={asignaturas}
              niveles={niveles}
            />
          )}
          {currentStep === 4 && <Step4Membership control={control} errors={errors} />}
          {currentStep === 5 && <Step5Finalization />}
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={finalSubmitting}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
          )}
          {currentStep < 5 && (
            <Button onClick={handleNext} disabled={finalSubmitting} className={currentStep === 1 ? 'ml-auto' : ''}>
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {currentStep === 5 && (
            <Button onClick={handleCompleteSetup} disabled={finalSubmitting} className="ml-auto">
              {finalSubmitting ? 'Completando...' : 'Completar Configuración'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileSetup;