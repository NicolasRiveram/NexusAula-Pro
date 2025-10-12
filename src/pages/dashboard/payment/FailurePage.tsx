import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const FailurePage = () => {
  return (
    <div className="container mx-auto flex items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4">Pago Fallido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta a tu banco.
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard/configuracion">Volver a Intentar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FailurePage;