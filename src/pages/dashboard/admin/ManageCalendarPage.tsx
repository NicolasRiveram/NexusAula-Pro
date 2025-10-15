import React, { useState, useMemo } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchNonSchoolDays, deleteNonSchoolDay, NonSchoolDay } from '@/api/adminApi';
import { showError, showSuccess } from '@/utils/toast';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import NonSchoolDayDialog from '@/components/dashboard/admin/NonSchoolDayDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const ManageCalendarPage = () => {
  const { activeEstablishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<NonSchoolDay | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<NonSchoolDay | null>(null);

  const { data: days = [], isLoading: loading } = useQuery({
    queryKey: ['nonSchoolDays', activeEstablishment?.id],
    queryFn: () => fetchNonSchoolDays(activeEstablishment!.id),
    enabled: !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNonSchoolDay,
    onSuccess: () => {
      showSuccess("Día no lectivo eliminado.");
      queryClient.invalidateQueries({ queryKey: ['nonSchoolDays', activeEstablishment?.id] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setAlertOpen(false);
      setDayToDelete(null);
    }
  });

  const calendarDays = useMemo(() => days.map(d => parseISO(d.fecha)), [days]);
  const upcomingDays = useMemo(() => days.filter(d => isFuture(parseISO(d.fecha)) || format(parseISO(d.fecha), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')), [days]);

  const handleAdd = () => {
    setSelectedDay(null);
    setDialogOpen(true);
  };

  const handleEdit = (day: NonSchoolDay) => {
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const handleDelete = (day: NonSchoolDay) => {
    setDayToDelete(day);
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (dayToDelete) {
      deleteMutation.mutate(dayToDelete.id);
    }
  };

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel de Administración
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Próximos Días No Lectivos</CardTitle>
                  <CardDescription>Gestiona los próximos feriados, vacaciones y eventos.</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Día</Button>
              </CardHeader>
              <CardContent>
                {loading ? <p>Cargando...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingDays.map(day => (
                        <TableRow key={day.id}>
                          <TableCell>{format(parseISO(day.fecha), 'PPP', { locale: es })}</TableCell>
                          <TableCell>{day.descripcion}</TableCell>
                          <TableCell className="capitalize">{day.tipo}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(day)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(day)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Calendario Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="multiple"
                  selected={calendarDays}
                  className="p-0"
                  locale={es}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <NonSchoolDayDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['nonSchoolDays', activeEstablishment?.id] })}
        day={selectedDay}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar "{dayToDelete?.descripcion}" del calendario?
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

export default ManageCalendarPage;