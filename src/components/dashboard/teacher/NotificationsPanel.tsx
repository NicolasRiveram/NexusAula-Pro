import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, FileWarning, Loader2 } from 'lucide-react';
import { fetchProactiveNotifications, ProactiveNotification } from '@/api/dashboardApi';
import { showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

const NotificationsPanel = () => {
  const { activeEstablishment } = useEstablishment();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: notifications = [], isLoading, isError, error } = useQuery({
    queryKey: ['notifications', user?.id, activeEstablishment?.id],
    queryFn: () => fetchProactiveNotifications(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  useEffect(() => {
    if (isError) {
      showError(`Error al cargar notificaciones: ${(error as Error).message}`);
    }
  }, [isError, error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2" /> Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start">
                <FileWarning className="w-5 h-5 mr-3 mt-1 text-primary" />
                <div>
                  <p className="text-sm">{notification.text}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {formatDistanceToNow(notification.date, { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">No tienes notificaciones nuevas.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;