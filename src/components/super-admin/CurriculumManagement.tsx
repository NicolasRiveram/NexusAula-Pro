import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle, Loader2, Save } from 'lucide-react';
import { 
  fetchAllNiveles, deleteNivel, Nivel, 
  fetchAllAsignaturas, deleteAsignatura, Asignatura,
  fetchAllEjes, deleteEje, Eje,
  fetchAllHabilidades, deleteHabilidad, Habilidad,
  fetchAllObjetivosAprendizaje, deleteObjetivoAprendizaje, ObjetivoAprendizaje,
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

const CurriculumManagement = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [oas, setOas] = useState<ObjetivoAprendizaje[]>([]);
  const [loading, setLoading] = useState(true);

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
              <Button onClick={() => { setSelectedNivel(null); setNivelDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Nivel</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Orden</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{niveles.map(n => (<TableRow key={n.id}><TableCell>{n.nombre}</TableCell><TableCell>{n.orden}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedNivel(n); setNivelDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('nivel', n)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* ASIGNATURAS */}
        <AccordionItem value="asignaturas">
          <AccordionTrigger className="text-lg font-semibold">Asignaturas</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedAsignatura(null); setAsignaturaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Asignatura</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{asignaturas.map(a => (<TableRow key={a.id}><TableCell>{a.nombre}</TableCell><TableCell className="max-w-xs truncate">{a.descripcion}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedAsignatura(a); setAsignaturaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('asignatura', a)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* EJES */}
        <AccordionItem value="ejes">
          <AccordionTrigger className="text-lg font-semibold">Ejes Temáticos</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedEje(null); setEjeDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Eje</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Asignatura</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{ejes.map(e => (<TableRow key={e.id}><TableCell>{e.nombre}</TableCell><TableCell>{e.asignaturas?.nombre}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedEje(e); setEjeDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('eje', e)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* HABILIDADES */}
        <AccordionItem value="habilidades">
          <AccordionTrigger className="text-lg font-semibold">Habilidades</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedHabilidad(null); setHabilidadDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear Habilidad</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{habilidades.map(h => (<TableRow key={h.id}><TableCell>{h.nombre}</TableCell><TableCell className="max-w-xs truncate">{h.descripcion}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedHabilidad(h); setHabilidadDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('habilidad', h)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        {/* OBJETIVOS DE APRENDIZAJE */}
        <AccordionItem value="oas">
          <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje (OAs)</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedOa(null); setOaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Crear OA</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descripción</TableHead><TableHead>Nivel</TableHead><TableHead>Asignatura</TableHead><TableHead>Eje</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{oas.map(oa => (<TableRow key={oa.id}><TableCell>{oa.codigo}</TableCell><TableCell className="max-w-xs truncate">{oa.descripcion}</TableCell><TableCell>{oa.nivel?.nombre}</TableCell><TableCell>{oa.asignatura?.nombre}</TableCell><TableCell>{oa.eje?.nombre}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedOa(oa); setOaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('oa', oa)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <NivelEditDialog isOpen={isNivelDialogOpen} onClose={() => setNivelDialogOpen(false)} onSaved={loadData} nivel={selectedNivel} />
      <AsignaturaEditDialog isOpen={isAsignaturaDialogOpen} onClose={() => setAsignaturaDialogOpen(false)} onSaved={loadData} asignatura={selectedAsignatura} />
      <EjeEditDialog isOpen={isEjeDialogOpen} onClose={() => setEjeDialogOpen(false)} onSaved={loadData} eje={selectedEje} asignaturas={asignaturas} />
      <HabilidadEditDialog isOpen={isHabilidadDialogOpen} onClose={() => setHabilidadDialogOpen(false)} onSaved={loadData} habilidad={selectedHabilidad} />
      <ObjetivoAprendizajeEditDialog isOpen={isOaDialogOpen} onClose={() => setOaDialogOpen(false)} onSaved={loadData} oa={selectedOa} niveles={niveles} asignaturas={asignaturas} ejes={ejes} />
    </>
  );
};

export default CurriculumManagement;