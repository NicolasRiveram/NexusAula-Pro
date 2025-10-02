import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { 
  fetchAllNiveles, deleteNivel, Nivel, 
  fetchAllAsignaturas, deleteAsignatura, Asignatura,
  fetchAllEjes, deleteEje, Eje,
  fetchAllHabilidades, deleteHabilidad, Habilidad,
  fetchAllObjetivosAprendizaje, deleteObjetivoAprendizaje, ObjetivoAprendizaje
} from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import NivelEditDialog from './NivelEditDialog';
import AsignaturaEditDialog from './AsignaturaEditDialog';
import EjeEditDialog from './EjeEditDialog';
import HabilidadEditDialog from './HabilidadEditDialog';
import ObjetivoAprendizajeEditDialog from './ObjetivoAprendizajeEditDialog';

const CurriculumManagement = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [ejes, setEjes] = useState<Eje[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [oas, setOas] = useState<ObjetivoAprendizaje[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Accordion type="single" collapsible className="w-full" defaultValue="niveles">
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
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descripción</TableHead><TableHead>Nivel</TableHead><TableHead>Asignatura</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{oas.map(oa => (<TableRow key={oa.id}><TableCell>{oa.codigo}</TableCell><TableCell className="max-w-xs truncate">{oa.descripcion}</TableCell><TableCell>{oa.niveles?.nombre}</TableCell><TableCell>{oa.asignaturas?.nombre}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedOa(oa); setOaDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete('oa', oa)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
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