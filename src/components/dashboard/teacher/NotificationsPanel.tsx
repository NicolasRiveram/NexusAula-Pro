import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, UserCheck, FileWarning, CheckCircle } from 'lucide-react';

const notifications = [
  { icon: UserCheck, text: "5 estudiantes nuevos en '7º A - Matemáticas'.", time: "hace 1 hora" },
  { icon: FileWarning, text: "La evaluación 'Prueba Unidad 1' vence en 2 días.", time: "hace 3 horas" },
  { icon: CheckCircle, text: "Has recibido 10 nuevas entregas de la 'Guía de Fotosíntesis'.", time: "ayer" },
];

const NotificationsPanel = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2" /> Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <div key={index} className="flex items-start">
              <notification.icon className="w-5 h-5 mr-3 mt-1 text-primary" />
              <div>
                <p className="text-sm">{notification.text}</p>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;