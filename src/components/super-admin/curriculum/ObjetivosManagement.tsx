import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle, Loader2, Save } from 'lucide-react';
import { ObjetivoAprendizaje, Nivel, Asignatura, Eje, deleteObjetivoAprendizaje, bulkInsertObjectives } from '@/api/superAdminApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import ObjetivoAprendizajeEditDialog from '../ObjetivoAprendizajeEditDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ObjetivosManagementProps {
  oas: ObjetivoAprendizaje[];
  niveles: Nivel[];
  asignaturas: Asignatura[];
  ejes: Eje[];
  onDataChange: () => void;
  selectedOas: string[];
  setSelectedOas: React.Dispatch<React.SetStateAction<string[]>>;
  openBulkDeleteDialog: (type: 'oa') => void;
}

const ObjetivosManagement: React.FC<ObjetivosManagementProps> = ({ oas, niveles, asignaturas, ejes, onDataChange, selectedOas, setSelectedOas, openBulkDeleteDialog }) => {
  const [isOaDialogOpen, setOaDialogOpen] = useState(false);
  const [selectedOa, setSelectedOa] = useState<ObjetivoAprendizaje | null>(null);
  const [oaNivelFilter, setOaNivelFilter] = useState<string>('all');
  const [oaAsignaturaFilter, setOaAsignaturaFilter] = useState<string>('all');

  const [selectedBulkNivel, setSelectedBulkNivel] = useState('');
  const [selectedBulkAsignatura, setSelectedBulkAsignatura] = useState('');
  const [selectedBulkEje, setSelectedBulkEje] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [filteredBulkEjes, setFilteredBulkEjes] = useState<Eje[]>([]);

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

  const handleBulkSave = async () => {
    if (!selectedBulkNivel || !selectedBulkAsignatura || !selectedBulkEje || !bulkText) {
      showError("Por favor, completa todos los campos: Nivel, Asignatura, Eje y pega los objetivos.");
      return;
    }
    setIsBulkSaving(true);
    const toastId = showLoading("Procesando y guardando objetivos...");
    try {
      const result = await bulkInsertObjectives(selectedBulkNivel, selectedBulkAsignatura, selectedBulkEje, bulkText);
      dismissToast(toastId);
      showSuccess(result.message);
      setBulkText('');
      onDataChange();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleDelete = async (item: ObjetivoAprendizaje) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${item.codigo}"?`)) {
      try {
        await deleteObjetivoAprendizaje(item.id);
        showSuccess('OA eliminado.');
        onDataChange();
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

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
            <Button onClick={handleBulkSave} disabled={isBulkSaving}>
              {isBulkSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isBulkSaving ? 'Guardando...' : 'Guardar Objetivos'}
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
          <Button variant="destructive" onClick={() => openBulkDeleteDialog('oa')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedOas.length})</Button>
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
                    <DropdownMenuItem onClick={() => handleDelete(oa)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ObjetivoAprendizajeEditDialog isOpen={isOaDialogOpen} onClose={() => setOaDialogOpen(false)} onSaved={onDataChange} oa={selectedOa} niveles={niveles} asignaturas={asignaturas} ejes={ejes} />
    </>
  );
};

export default ObjetivosManagement;