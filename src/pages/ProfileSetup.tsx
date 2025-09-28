"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { completeDocenteProfile } from './profile-setup/api';
import { useProfileSetupForm } from './profile-setup/use-profile-setup-form';
import { useProfileData } from './profile-setup/use-profile-data';

// Importar los componentes de los pasos
import Step1UserProfile from './profile-setup/steps/Step1UserProfile';
import Step2Establishment from './profile-setup/steps/Step2Establishment';
import Step3PedagogicalSetup from './profile-setup/steps/Step3PedagogicalSetup';
import Step4Membership from './profile-setup/steps/Step4Membership';
import Step5Finalization from './profile-setup/steps/Step5Finalization';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    setCurrentStep,
    isActionLoading,
    setIsActionLoading,
    control,
    handleSubmit,
    watch,
    setValue,
    errors,
    isSubmitting,
    handleNext,
    handleBack,
    getValues,
  } = useProfileSetupForm();

  const { asignaturas, niveles, loadingData, profileComplete } = useProfileData(setValue);

  const selectedRol = watch('rol_seleccionado');

  // Redireccionar si el perfil ya está completo
  if (profileComplete === true) {
    return null; // El hook useProfileData ya maneja la navegación
  }

  const handleCompleteSetup = handleSubmit(async (data) => {
    const { nombre_completo, rol_seleccionado, asignatura_ids, nivel_ids } = data;

    if (!nombre_completo || !rol_seleccionado || asignatura_ids.length === 0 || nivel_ids.length === 0) {
      showError("Por favor, completa todos los pasos antes de finalizar.");
      return;
    }

    setIsActionLoading(true);
    try {
      await completeDocenteProfile({
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
    } finally {
      setIsActionLoading(false);
    }
  });

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Cargando datos de configuración...</p>
      </div>
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
          {currentStep === 1 && <Step1UserProfile control={control} errors={errors} />}
          {currentStep === 2 && (
            <Step2Establishment
              control={control}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
              watch={watch}
              setCurrentStep={setCurrentStep}
              isActionLoading={isActionLoading}
              setIsActionLoading={setIsActionLoading}
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
          {currentStep === 4 && <Step4Membership />}
          {currentStep === 5 && <Step5Finalization />}
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