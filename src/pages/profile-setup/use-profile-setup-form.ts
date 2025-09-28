import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData, step1Schema, step2Schema, step3Schema, step4Schema } from './schemas';
import { showError } from '@/utils/toast';

export const useProfileSetupForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  return {
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
    trigger,
    getValues,
    reset,
    handleNext,
    handleBack,
  };
};