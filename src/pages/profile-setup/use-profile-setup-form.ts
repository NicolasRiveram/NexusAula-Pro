import { useState } from 'react';
import { useForm, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData, profileSetupSchema } from './schemas';
import { showError } from '@/utils/toast';

// Define qué campos validar en cada paso
const stepFields: FieldPath<FormData>[][] = [
  ['nombre_completo', 'rol_seleccionado'], // Paso 1
  ['establecimiento_id', 'new_establecimiento_nombre', 'new_establecimiento_direccion', 'new_establecimiento_comuna', 'new_establecimiento_region'], // Paso 2
  ['asignatura_ids', 'nivel_ids'], // Paso 3
  ['membership_plan'], // Paso 4
];

export const useProfileSetupForm = () => {
  const [currentStep, setCurrentStep] = useState(1);

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
    resolver: zodResolver(profileSetupSchema),
    mode: 'onChange', // Revalidar al cambiar para una mejor experiencia de usuario
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
      membership_plan: 'prueba', // Valor por defecto para el plan
    },
  });

  const handleNext = async () => {
    // Valida solo los campos del paso actual
    const fieldsToValidate = stepFields[currentStep - 1];
    const isValid = await trigger(fieldsToValidate);
    
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