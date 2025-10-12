import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const SuccessPage = () => {
  return (
    <div className="container mx-auto flex items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4">¡Pago Exitoso!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Gracias por tu compra. Tu plan ha sido actualizado a Pro. Recibirás una confirmación por correo electrónico en breve.
          </p>
          <Button asChild>
            <Link to="/dashboard">Volver al Panel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;