import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchActiveAnnouncements } from '@/api/adminApi';
import { Loader2, Megaphone } from 'lucide-react';

const AnnouncementsWidget = () => {
  const { activeEstablishment } = useEstablishment();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['activeAnnouncements', activeEstablishment?.id],
    queryFn: () => fetchActiveAnnouncements(activeEstablishment!.id),
    enabled: !!activeEstablishment,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>;
  }

  if (!announcements || announcements.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No hay anuncios activos hoy.</p>;
  }

  return (
    <div className="space-y-3">
      {announcements.map(anuncio => (
        <div key={anuncio.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="font-bold text-sm text-blue-800 dark:text-blue-300">{anuncio.titulo}</p>
          <p className="text-sm text-blue-700 dark:text-blue-400">{anuncio.mensaje}</p>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsWidget;