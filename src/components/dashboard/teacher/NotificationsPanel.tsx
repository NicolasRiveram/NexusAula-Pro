import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, FileWarning, Loader2 } from 'lucide-react';
import { fetchProactiveNotifications, ProactiveNotification } from '@/api/dashboardApi';
import { showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadNotifications = async () => {
      if (!activeEstablishment) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const data = await fetchProactiveNotifications(user.id, activeEstablishment.id);
          setNotifications(data);
        } catch (err: any) {
          showError(`Error al cargar notificaciones: ${err.message}`);
        }
      }
      setLoading(false);
    };
    loadNotifications();
  }, [activeEstablishment]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2" /> Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
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