import React, { useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Bell, FileWarning, Loader2 } from 'lucide-react';
import { fetchProactiveNotifications, ProactiveNotification } from '@/api/dashboardApi';
import { showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const NotificationsPanel = () => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

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
    <>
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
    </>
  );
};

export default NotificationsPanel;