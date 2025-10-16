import React, { useState, useMemo } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAnnouncements, deleteAnnouncement, Announcement } from '@/api/admin';
import { showError, showSuccess } from '@/utils/toast';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { format, parseISO, isWithinInterval, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import AnnouncementEditDialog from './AnnouncementEditDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AnnouncementsManagement = () => {
  const { activeEstablishment } = useEstablishment();
  const queryClient = useQueryClient();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  const { data: announcements = [], isLoading: loading } = useQuery({
    queryKey: ['announcements', activeEstablishment?.id],
    queryFn: () => fetchAnnouncements(activeEstablishment!.id),
    enabled: !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      showSuccess("Anuncio eliminado.");
      queryClient.invalidateQueries({ queryKey: ['announcements', activeEstablishment?.id] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setAlertOpen(false);
      setAnnouncementToDelete(null);
    }
  });

  const { active, scheduled, past } = useMemo(() => {
    const now = new Date();
    return announcements.reduce((acc, ann) => {
      const interval = { start: parseISO(ann.fecha_inicio), end: parseISO(ann.fecha_fin) };
      if (isWithinInterval(now, interval)) acc.active.push(ann);
      else if (isFuture(interval.start)) acc.scheduled.push(ann);
      else if (isPast(interval.end)) acc.past.push(ann);
      return acc;
    }, { active: [] as Announcement[], scheduled: [] as Announcement[], past: [] as Announcement[] });
  }, [announcements]);

  const handleAdd = () => {
    setSelectedAnnouncement(null);
    setDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (announcementToDelete) {
      deleteMutation.mutate(announcementToDelete.id);
    }
  };

  const AnnouncementTable = ({ data }: { data: Announcement[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Fechas de Visibilidad</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((ann) => (
          <TableRow key={ann.id}>
            <TableCell className="font-medium">{ann.titulo}</TableCell>
            <TableCell>{format(parseISO(ann.fecha_inicio), 'P', { locale: es })} - {format(parseISO(ann.fecha_fin), 'P', { locale: es })}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(ann)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(ann)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Anuncios</CardTitle>
            <CardDescription>Crea y administra los anuncios para todo el establecimiento.</CardDescription>
          </div>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Crear Anuncio</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando anuncios...</p>
          ) : (
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Activos ({active.length})</TabsTrigger>
                <TabsTrigger value="scheduled">Programados ({scheduled.length})</TabsTrigger>
                <TabsTrigger value="past">Pasados ({past.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="active">{active.length > 0 ? <AnnouncementTable data={active} /> : <p className="text-center text-muted-foreground py-4">No hay anuncios activos.</p>}</TabsContent>
              <TabsContent value="scheduled">{scheduled.length > 0 ? <AnnouncementTable data={scheduled} /> : <p className="text-center text-muted-foreground py-4">No hay anuncios programados.</p>}</TabsContent>
              <TabsContent value="past">{past.length > 0 ? <AnnouncementTable data={past} /> : <p className="text-center text-muted-foreground py-4">No hay anuncios pasados.</p>}</TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      <AnnouncementEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['announcements', activeEstablishment?.id] })}
        announcement={selectedAnnouncement}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el anuncio "{announcementToDelete?.titulo}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AnnouncementsManagement;