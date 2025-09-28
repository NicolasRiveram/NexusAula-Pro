import React from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormData } from '../schemas';

interface Step4MembershipProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const Step4Membership: React.FC<Step4MembershipProps> = ({ control, errors }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center">Elige tu Membresía</h3>
      <p className="text-muted-foreground text-center">
        Comienza con un plan de prueba o accede a todas las funcionalidades con el Plan Pro.
      </p>
      <Controller
        name="membership_plan"
        control={control}
        render={({ field }) => (
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"
          >
            <Label htmlFor="plan-prueba" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors">
              <RadioGroupItem value="prueba" id="plan-prueba" className="sr-only" />
              <span className="font-semibold text-lg">Plan de Prueba</span>
              <p className="text-sm text-muted-foreground">Explora las funcionalidades básicas.</p>
            </Label>
            <Label htmlFor="plan-pro" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors">
              <RadioGroupItem value="pro" id="plan-pro" className="sr-only" />
              <span className="font-semibold text-lg">Plan Pro</span>
              <p className="text-sm text-muted-foreground">Acceso completo y sin límites.</p>
            </Label>
          </RadioGroup>
        )}
      />
      {errors.membership_plan && <p className="text-red-500 text-sm mt-1 text-center">{errors.membership_plan.message}</p>}
    </div>
  );
};

export default Step4Membership;