import React from 'react';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';

const Step4Membership: React.FC = () => {
  return (
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
  );
};

export default Step4Membership;