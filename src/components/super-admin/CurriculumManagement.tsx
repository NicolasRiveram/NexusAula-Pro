import React, { useState, useEffect, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle, Loader2, Save } from 'lucide-react';
import { 
  fetchAllNiveles, deleteNivel, Nivel, deleteMultipleNiveles,
  fetchAllAsignaturas, deleteAsignatura, Asignatura, deleteMultipleAsignaturas,
  fetchAllEjes, deleteEje, Eje, deleteMultipleEjes,
  fetchAllHabilidades, deleteHabilidad, Habilidad, deleteMultipleHabilidades,
  fetchAllObjetivosAprendizaje, deleteObjetivoAprendizaje, ObjetivoAprendizaje, deleteMultipleObjetivosAprendizaje,
  bulkInsertObjectives
} from '@/api/superAdminApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import NivelEditDialog from './NivelEditDialog';
import AsignaturaEditDialog from './AsignaturaEditDialog';
import EjeEditDialog from './EjeEditDialog';
import HabilidadEditDialog from './HabilidadEditDialog';
import ObjetivoAprendizajeEditDialog from './ObjetivoAprendizajeEditDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CurriculumManagement = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [oas, setOas] = useState<ObjetivoAprendizaje[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>([]);
  const [selectedEjes, setSelectedEjes] = useState<string[]>([]);
  const [selectedHabilidades, setSelectedHabilidades] = useState<string[]>([]);
  const [selectedOas, setSelectedOas] = useState<string[]>([]);

  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfig, setBulkDeleteConfig] = useState<{ type: string; count: number; onConfirm: () => void } | null>(null);

  const [selectedBulkNivel, setSelectedBulkNivel] = useState('');
  const [selectedBulkAsignatura, setSelectedBulkAsignatura] = useState('');
  const [selectedBulkEje, setSelectedBulkEje] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [filteredBulkEjes, setFilteredBulkEjes] = useState<Eje[]>([]);

  const [isNivelDialogOpen, setNivelDialogOpen] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);
  
  const [isAsignaturaDialogOpen, setAsignaturaDialogOpen] = useState(false);
  const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);

  const [isEjeDialogOpen, setEjeDialogOpen] = useState(false);
  const [selectedEje, setSelectedEje] = useState<Eje | null>(null);

  const [isHabilidadDialogOpen, setHabilidadDialogOpen] = useState(false);
  const [selectedHabilidad, setSelectedHabilidad] = useState<Habilidad | null>(null);

  const [isOaDialogOpen, setOaDialogOpen] = useState(false);
  const [selectedOa, setSelectedOa] = useState<ObjetivoAprendizaje | null>(null);

  const [oaNivelFilter, setOaNivelFilter] = useState<string>('all');
  const [oaAsignaturaFilter, setOaAsignaturaFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [nivelesData, asignaturasData, ejesData, habilidadesData, oasData] = await Promise.all([
        fetchAllNiveles(), 
        fetchAllAsignaturas(),
        fetchAllEjes(),
        fetchAllHabilidades(),
        fetchAllObjetivosAprendizaje(),
      ]);
      setNiveles(nivelesData);
      setAsignaturas(asignaturasData);
      setEjes(ejesData);
      setHabilidades(habilidadesData);
      setOas(oasData);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      loadData();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleDelete = async (type: 'nivel' | 'asignatura' | 'eje' | 'habilidad' | 'oa', item: any) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${item.nombre || item.codigo}"?`)) {
      try {
        switch (type) {
          case 'nivel': await deleteNivel(item.id); break;
          case 'asignatura': await deleteAsignatura(item.id); break;
          case 'eje': await deleteEje(item.id); break;
          case 'habilidad': await deleteHabilidad(item.id); break;
          case 'oa': await deleteObjetivoAprendizaje(item.id); break;
        }
        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`);
        loadData();
      } catch (error: any) { showError(error.message); }
    }
  };

  const handleConfirmBulkDelete = async (
    type: string,
    deleteFn: (ids: string[]) => Promise<void>,
    idsToDelete: string[],
    clearSelectionFn: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    try {
      await deleteFn(idsToDelete);
      showSuccess(`${idsToDelete.length} ${type}(s) eliminados.`);
      clearSelectionFn([]);
      loadData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  const openBulkDeleteDialog = (type: 'nivel' | 'asignatura' | 'eje' | 'habilidad' | 'oa') => {
    let count = 0;
    let onConfirm: () => void;

    switch (type) {
      case 'nivel':
        count = selectedNiveles.length;
        onConfirm = () => handleConfirmBulkDelete('nivel', deleteMultipleNiveles, selectedNiveles, setSelectedNiveles);
        break;
      case 'asignatura':
        count = selectedAsignaturas.length;
        onConfirm = () => handleConfirmBulkDelete('asignatura', deleteMultipleAsignaturas, selectedAsignaturas, setSelectedAsignaturas);
        break;
      case 'eje':
        count = selectedEjes.length;
        onConfirm = () => handleConfirmBulkDelete('eje', deleteMultipleEjes, selectedEjes, setSelectedEjes);
        break;
      case 'habilidad':
        count = selectedHabilidades.length;
        onConfirm = () => handleConfirmBulkDelete('habilidad', deleteMultipleHabilidades, selectedHabilidades, setSelectedHabilidades);
        break;
      case 'oa':
        count = selectedOas.length;
        onConfirm = () => handleConfirmBulkDelete('objetivo de aprendizaje', deleteMultipleObjetivosAprendizaje, selectedOas, setSelectedOas);
        break;
    }

    if (count > 0) {
      setBulkDeleteConfig({ type, count, onConfirm });
      setBulkDeleteOpen(true);
    }
  };

  if (loading) return <p>Cargando currículum...</p>;

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

      <Accordion type="single" collapsible className="w-full mt-6" defaultValue="niveles">
        {/* NIVELES */}
        <AccordionItem value="niveles">
          <AccordionTrigger className="text-lg font-semibold">Niveles Educativos</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              {selectedNiveles.length > 0 ? (
                <Button variant="destructive" onClick={() => openBulkDeleteDialog('nivel')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedNiveles.length})</Button>
              ) : (
                <Button onClick={() => { setSelectedNivel(null); setNivelDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Nivel</Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedNiveles.length === niveles.length && niveles.length > 0} onCheckedChange={(checked) => setSelectedNiveles(checked ? niveles.map(n => n.id) : [])} /></TableHead><TableHead>Nombre</TableHead><TableHead>Orden</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{niveles.map(n => (<TableRow key={n.id}><TableCell><Checkbox checked={selectedNiveles.includes(n.id)} onCheckedChange={(checked) => setSelectedNiveles(prev => checked ? [...prev, n.id] : prev.filter(id => id !== n.id))} /></TableCell><TableCell>{n.nombre}</TableCell><TableCell>{n.orden}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedNivel(n); setNivelDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('nivel', n)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* ASIGNATURAS */}
        <AccordionItem value="asignaturas">
          <AccordionTrigger className="text-lg font-semibold">Asignaturas</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              {selectedAsignaturas.length > 0 ? (
                <Button variant="destructive" onClick={() => openBulkDeleteDialog('asignatura')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedAsignaturas.length})</Button>
              ) : (
                <Button onClick={() => { setSelectedAsignatura(null); setAsignaturaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Asignatura</Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedAsignaturas.length === asignaturas.length && asignaturas.length > 0} onCheckedChange={(checked) => setSelectedAsignaturas(checked ? asignaturas.map(a => a.id) : [])} /></TableHead><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{asignaturas.map(a => (<TableRow key={a.id}><TableCell><Checkbox checked={selectedAsignaturas.includes(a.id)} onCheckedChange={(checked) => setSelectedAsignaturas(prev => checked ? [...prev, a.id] : prev.filter(id => id !== a.id))} /></TableCell><TableCell>{a.nombre}</TableCell><TableCell className="max-w-xs truncate">{a.descripcion}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedAsignatura(a); setAsignaturaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('asignatura', a)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* EJES */}
        <AccordionItem value="ejes">
          <AccordionTrigger className="text-lg font-semibold">Ejes Temáticos</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              {selectedEjes.length > 0 ? (
                <Button variant="destructive" onClick={() => openBulkDeleteDialog('eje')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedEjes.length})</Button>
              ) : (
                <Button onClick={() => { setSelectedEje(null); setEjeDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Eje</Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedEjes.length === ejes.length && ejes.length > 0} onCheckedChange={(checked) => setSelectedEjes(checked ? ejes.map(e => e.id) : [])} /></TableHead><TableHead>Nombre</TableHead><TableHead>Asignatura</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{ejes.map(e => (<TableRow key={e.id}><TableCell><Checkbox checked={selectedEjes.includes(e.id)} onCheckedChange={(checked) => setSelectedEjes(prev => checked ? [...prev, e.id] : prev.filter(id => id !== e.id))} /></TableCell><TableCell>{e.nombre}</TableCell><TableCell>{e.asignaturas?.nombre}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedEje(e); setEjeDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('eje', e)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* HABILIDADES */}
        <AccordionItem value="habilidades">
          <AccordionTrigger className="text-lg font-semibold">Habilidades</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              {selectedHabilidades.length > 0 ? (
                <Button variant="destructive" onClick={() => openBulkDeleteDialog('habilidad')}><Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedHabilidades.length})</Button>
              ) : (
                <Button onClick={() => { setSelectedHabilidad(null); setHabilidadDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Habilidad</Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedHabilidades.length === habilidades.length && habilidades.length > 0} onCheckedChange={(checked) => setSelectedHabilidades(checked ? habilidades.map(h => h.id) : [])} /></TableHead><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{habilidades.map(h => (<TableRow key={h.id}><TableCell><Checkbox checked={selectedHabilidades.includes(h.id)} onCheckedChange={(checked) => setSelectedHabilidades(prev => checked ? [...prev, h.id] : prev.filter(id => id !== h.id))} /></TableCell><TableCell>{h.nombre}</TableCell><TableCell className="max-w-xs truncate">{h.descripcion}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedHabilidad(h); setHabilidadDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('habilidad', h)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* OBJETIVOS DE APRENDIZAJE */}
        <AccordionItem value="oas">
          <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje (OAs)</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-between items-center mb-4">
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
              <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedOas.length === filteredOas.length && filteredOas.length > 0} onCheckedChange={(checked) => setSelectedOas(checked ? filteredOas.map(o => o.id) : [])} /></TableHead><TableHead>Código</TableHead><TableHead>Descripción</TableHead><TableHead>Nivel</TableHead><TableHead>Asignatura</TableHead><TableHead>Eje</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredOas.map(oa => (<TableRow key={oa.id}><TableCell><Checkbox checked={selectedOas.includes(oa.id)} onCheckedChange={(checked) => setSelectedOas(prev => checked ? [...prev, oa.id] : prev.filter(id => id !== oa.id))} /></TableCell><TableCell>{oa.codigo}</TableCell><TableCell className="max-w-xs truncate">{oa.descripcion}</TableCell><TableCell>{oa.nivel?.nombre}</TableCell><TableCell>{oa.asignatura?.nombre}</TableCell><TableCell>{oa.eje?.nombre}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedOa(oa); setOaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('oa', oa)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <NivelEditDialog isOpen={isNivelDialogOpen} onClose={() => setNivelDialogOpen(false)} onSaved={loadData} nivel={selectedNivel} />
      <AsignaturaEditDialog isOpen={isAsignaturaDialogOpen} onClose={() => setAsignaturaDialogOpen(false)} onSaved={loadData} asignatura={selectedAsignatura} />
      <EjeEditDialog isOpen={isEjeDialogOpen} onClose={() => setEjeDialogOpen(false)} onSaved={loadData} eje={selectedEje} asignaturas={asignaturas} />
      <HabilidadEditDialog isOpen={isHabilidadDialogOpen} onClose={() => setHabilidadDialogOpen(false)} onSaved={loadData} habilidad={selectedHabilidad} />
      <ObjetivoAprendizajeEditDialog isOpen={isOaDialogOpen} onClose={() => setOaDialogOpen(false)} onSaved={loadData} oa={selectedOa} niveles={niveles} asignaturas={asignaturas} ejes={ejes} />
      
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente {bulkDeleteConfig?.count} {bulkDeleteConfig?.type}(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDeleteConfig?.onConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CurriculumManagement;