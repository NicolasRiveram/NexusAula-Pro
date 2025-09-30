import React, { useState, useEffect, useMemo } from 'react';
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

const ManageCalendarPage = () => {
  const { activeEstablishment } = useEstablishment();
  const [days, setDays] = useState<NonSchoolDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<NonSchoolDay | null>(null);

  const loadDays = async () => {
    if (!activeEstablishment) {
      setDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNonSchoolDays(activeEstablishment.id);
      setDays(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDays();
  }, [activeEstablishment]);

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

  const handleDelete = async (day: NonSchoolDay) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${day.descripcion}" del calendario?`)) return;
    try {
      await deleteNonSchoolDay(day.id);
      showSuccess("Día no lectivo eliminado.");
      loadDays();
    } catch (error: any) {
      showError(error.message);
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
        onSaved={loadDays}
        day={selectedDay}
      />
    </>
  );
};

export default ManageCalendarPage;