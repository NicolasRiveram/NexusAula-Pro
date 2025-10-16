import React, { useState, useMemo } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchClassLogsForTeacher, ClassLogEntry } from '@/api/planning';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/courses';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const BitacoraPage = () => {
  const [selectedCurso, setSelectedCurso] = useState<string>('todos');
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['classLogs', user?.id, activeEstablishment?.id],
    queryFn: () => fetchClassLogsForTeacher(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
    onError: (error: any) => showError(`Error al cargar las bitácoras: ${error.message}`),
  });

  const { data: cursos = [], isLoading: isLoadingCursos } = useQuery({
    queryKey: ['teacherCoursesForBitacora', user?.id, activeEstablishment?.id],
    queryFn: () => fetchCursosAsignaturasDocente(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
    onError: (error: any) => showError(`Error al cargar los cursos: ${error.message}`),
  });

  const filteredLogs = useMemo(() => {
    if (selectedCurso === 'todos') {
      return logs;
    }
    return logs.filter(log => log.curso_asignatura_id === selectedCurso);
  }, [logs, selectedCurso]);

  const loading = isLoadingLogs || isLoadingCursos;

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bitácora de Clases</h1>
          <p className="text-muted-foreground">Consulta el historial de tus clases registradas.</p>
        </div>
        <div className="w-64">
          <Select value={selectedCurso} onValueChange={setSelectedCurso}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por curso..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cursos</SelectItem>
              {cursos.map(curso => (
                <SelectItem key={curso.id} value={curso.id}>
                  {curso.curso.nivel.nombre} {curso.curso.nombre} - {curso.asignatura.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p>Cargando bitácoras...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para ver tus bitácoras.</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <Card key={log.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{log.curso_info.nivel} {log.curso_info.nombre} - {log.curso_info.asignatura}</CardTitle>
                    <CardDescription>{format(parseISO(log.fecha), "EEEE, d 'de' LLLL 'de' yyyy", { locale: es })}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">Contenido Cubierto</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{log.bitacora_contenido_cubierto}</p>
                </div>
                {log.bitacora_observaciones && (
                  <div>
                    <h4 className="font-semibold text-sm">Observaciones</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{log.bitacora_observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No hay bitácoras para mostrar</h3>
          <p className="text-muted-foreground mt-2">
            {selectedCurso === 'todos' ? 'Aún no has registrado ninguna bitácora.' : 'No hay bitácoras para el curso seleccionado.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BitacoraPage;