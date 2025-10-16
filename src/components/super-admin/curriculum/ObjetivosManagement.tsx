import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle, Loader2, Save } from 'lucide-react';
import { ObjetivoAprendizaje, Nivel, Asignatura, Eje, deleteObjetivoAprendizaje, bulkInsertObjectives, fetchAllObjetivosAprendizaje, fetchAllNiveles, fetchAllAsignaturas, fetchAllEjes, deleteMultipleObjetivosAprendizaje } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import ObjetivoAprendizajeEditDialog from '../ObjetivoAprendizajeEditDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const ObjetivosManagement = () => {
  const queryClient = useQueryClient();
  const [isOaDialogOpen, setOaDialogOpen] = useState(false);
  const [selectedOa, setSelectedOa] = useState<ObjetivoAprendizaje | null>(null);
  const [oaNivelFilter, setOaNivelFilter] = useState<string>('all');
  const [oaAsignaturaFilter, setOaAsignaturaFilter] = useState<string>('all');
  const [selectedBulkNivel, setSelectedBulkNivel] = useState('');
  const [selectedBulkAsignatura, setSelectedBulkAsignatura] = useState('');
  const [selectedBulkEje, setSelectedBulkEje] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [filteredBulkEjes, setFilteredBulkEjes] = useState<Eje[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [oaToDelete, setOaToDelete] = useState<ObjetivoAprendizaje | null>(null);
  const [selectedOas, setSelectedOas] = useState<string[]>([]);

  const { data: oas = [], isLoading: isLoadingOas } = useQuery({ queryKey: ['oas'], queryFn: fetchAllObjetivosAprendizaje });
  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({ queryKey: ['niveles'], queryFn: fetchAllNiveles });
  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({ queryKey: ['asignaturas'], queryFn: fetchAllAsignaturas });
  const { data: ejes = [], isLoading: isLoadingEjes } = useQuery({ queryKey: ['ejes'], queryFn: fetchAllEjes });

  useEffect(() => {
    if (selectedBulkAsignatura) {
      setFilteredBulkEjes(ejes.filter(eje => eje.asignatura_id === selectedBulkAsignatura));
      setSelectedBulkEje('');
    } else {
      setFilteredBulkEjes([]);
    }
  }, [selectedBulkAsignatura, ejes]);

  const filteredOas = useMemo(() => {
    return oas.filter(oa => {
      const nivelMatch = oaNivelFilter === 'all' || oa.nivel_id === oaNivelFilter;
      const asignaturaMatch = oaAsignaturaFilter === 'all' || oa.asignatura_id === oaAsignaturaFilter;
      return nivelMatch && asignaturaMatch;
    });
  }, [oas, oaNivelFilter, oaAsignaturaFilter]);

  const bulkInsertMutation = useMutation({
    mutationFn: (vars: { nivelId: string, asignaturaId: string, ejeId: string, text: string }) => 
      bulkInsertObjectives(vars.nivelId, vars.asignaturaId, vars.ejeId, vars.text),
    onSuccess: (result) => {
      showSuccess(result.message);
      setBulkText('');
      queryClient.invalidateQueries({ queryKey: ['oas'] });
    },
    onError: (error: any) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObjetivoAprendizaje,
    onSuccess: () => {
      showSuccess('OA eliminado.');
      queryClient.invalidateQueries({ queryKey: ['oas'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setIsAlertOpen(false);
      setOaToDelete(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteMultipleObjetivosAprendizaje,
    onSuccess: (_, variables) => {
      showSuccess(`${variables.length} OA(s) eliminados.`);
      queryClient.invalidateQueries({ queryKey: ['oas'] });
      setSelectedOas([]);
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => setIsAlertOpen(false),
  });

  const handleBulkSave = () => {
    if (!selectedBulkNivel || !selectedBulkAsignatura || !selectedBulkEje || !bulkText) {
      showError("Por favor, completa todos los campos: Nivel, Asignatura, Eje y pega los objetivos.");
      return;
    }
    bulkInsertMutation.mutate({
      nivelId: selectedBulkNivel,
      asignaturaId: selectedBulkAsignatura,
      ejeId: selectedBulkEje,
      text: bulkText,
    });
  };

  const handleDeleteClick = (item: ObjetivoAprendizaje) => {
    setOaToDelete(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (oaToDelete) {
      deleteMutation.mutate(oaToDelete.id);
    } else if (selectedOas.length > 0) {
      bulkDeleteMutation.mutate(selectedOas);
    }
  };

  if (isLoadingOas || isLoadingNiveles || isLoadingAsignaturas || isLoadingEjes) return <p>Cargando objetivos...</p>;

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Carga Rápida de Objetivos por Texto</CardTitle>
          <CardDescription>
            Pega una lista de objetivos de aprendizaje en formato "CÓDIGO: Descripción" para guardarlos en lote.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nivel Educativo</Label>
              <Select value={selectedBulkNivel} onValueChange={setSelectedBulkNivel}>
                <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asignatura</Label>
              <Select value={selectedBulkAsignatura} onValueChange={setSelectedBulkAsignatura}>
                <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Eje Temático</Label>
              <Select value={selectedBulkEje} onValueChange={setSelectedBulkEje} disabled={!selectedBulkAsignatura}>
                <SelectTrigger><SelectValue placeholder="Selecciona un eje" /></SelectTrigger>
                <SelectContent>{filteredBulkEjes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Lista de Objetivos de Aprendizaje</Label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Pega aquí los objetivos, uno por línea. Ejemplo:&#10;OA 1: Leer y familiarizarse...&#10;OA 2: Comprender textos..."
              rows={10}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleBulkSave} disabled={bulkInsertMutation.isPending}>
              {bulkInsertMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {bulkInsertMutation.isPending ? 'Guardando...' : 'Guardar Objetivos'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center my-4">
        <div className="flex gap-2">
          <Select value={oaNivelFilter} onValueChange={setOaNivelFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por Nivel" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos los niveles</SelectItem>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={oaAsignaturaFilter} onValueChange={setOaAsignaturaFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por Asignatura" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas las asignaturas</SelectItem>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {selectedOas.length > 0 ? (
          <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedOas.length})</Button>
        ) : (
          <Button onClick={() => { setSelectedOa(null); setOaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear OA</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"><Checkbox checked={selectedOas.length === filteredOas.length && filteredOas.length > 0} onCheckedChange={(checked) => setSelectedOas(checked ? filteredOas.map(o => o.id) : [])} /></TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Asignatura</TableHead>
            <TableHead>Eje</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOas.map(oa => (
            <TableRow key={oa.id}>
              <TableCell><Checkbox checked={selectedOas.includes(oa.id)} onCheckedChange={(checked) => setSelectedOas(prev => checked ? [...prev, oa.id] : prev.filter(id => id !== oa.id))} /></TableCell>
              <TableCell>{oa.codigo}</TableCell>
              <TableCell className="max-w-xs truncate">{oa.descripcion}</TableCell>
              <TableCell>{oa.nivel?.nombre}</TableCell>
              <TableCell>{oa.asignatura?.nombre}</TableCell>
              <TableCell>{oa.eje?.nombre}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedOa(oa); setOaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(oa)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ObjetivoAprendizajeEditDialog isOpen={isOaDialogOpen} onClose={() => setOaDialogOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ['oas'] })} oa={selectedOa} niveles={niveles} asignaturas={asignaturas} ejes={ejes} />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {oaToDelete ? `Se eliminará permanentemente el OA "${oaToDelete.codigo}".` : `Se eliminarán permanentemente ${selectedOas.length} OAs.`} Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ObjetivosManagement;