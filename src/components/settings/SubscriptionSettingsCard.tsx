import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const SubscriptionManager = () => {
    return (
        <Dialog>
            <Card>
                <CardHeader>
                    <CardTitle>Suscripción</CardTitle>
                    <CardDescription>Gestiona tu plan y facturación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-md">
                        <div>
                            <p className="font-semibold">Plan Actual</p>
                            <p className="text-muted-foreground">Estás en el <Badge variant="secondary">Plan Pro</Badge></p>
                        </div>
                        <DialogTrigger asChild>
                            <Button variant="outline">Gestionar Suscripción</Button>
                        </DialogTrigger>
                    </div>
                </CardContent>
            </Card>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Suscripción</DialogTitle>
                    <DialogDescription>
                        La gestión de suscripciones y pagos se habilitará próximamente.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>Gracias por tu interés. Estamos trabajando para integrar un portal de cliente donde podrás actualizar tu método de pago, ver facturas y cambiar tu plan.</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SubscriptionManager;