import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Star, AlertCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

interface TrialBannerProps {
  trialEndsAt: string | null;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ trialEndsAt }) => {
  if (!trialEndsAt) return null;

  const daysLeft = differenceInDays(parseISO(trialEndsAt), new Date());

  if (daysLeft < 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Tu período de prueba ha terminado</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          Para seguir usando todas las funciones, por favor actualiza tu plan.
          <Button asChild size="sm">
            <Link to="/dashboard/configuracion">Mejorar a Pro</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6">
      <Star className="h-4 w-4" />
      <AlertTitle>Período de Prueba</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        Te quedan {daysLeft} días de prueba. ¡Aprovecha al máximo NexusAula!
        <Button asChild size="sm">
          <Link to="/dashboard/configuracion">Mejorar a Pro</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default TrialBanner;