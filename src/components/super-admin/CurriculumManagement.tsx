import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { fetchAllNiveles, deleteNivel, Nivel, fetchAllAsignaturas, deleteAsignatura, Asignatura } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import NivelEditDialog from './NivelEditDialog';
import AsignaturaEditDialog from './AsignaturaEditDialog';

const CurriculumManagement = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);

  const [isNivelDialogOpen, setNivelDialogOpen] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);
  
  const [isAsignaturaDialogOpen, setAsignaturaDialogOpen] = useState(false);
  const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nivelesData, asignaturasData] = await Promise.all([fetchAllNiveles(), fetchAllAsignaturas()]);
      setNiveles(nivelesData);
      setAsignaturas(asignaturasData);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNivel = () => { setSelectedNivel(null); setNivelDialogOpen(true); };
  const handleEditNivel = (nivel: Nivel) => { setSelectedNivel(nivel); setNivelDialogOpen(true); };
  const handleDeleteNivel = async (nivel: Nivel) => {
    if (window.confirm(`¿Seguro que quieres eliminar el nivel "${nivel.nombre}"?`)) {
      try {
        await deleteNivel(nivel.id);
        showSuccess("Nivel eliminado.");
        loadData();
      } catch (error: any) { showError(error.message); }
    }
  };

  const handleAddAsignatura = () => { setSelectedAsignatura(null); setAsignaturaDialogOpen(true); };
  const handleEditAsignatura = (asignatura: Asignatura) => { setSelectedAsignatura(asignatura); setAsignaturaDialogOpen(true); };
  const handleDeleteAsignatura = async (asignatura: Asignatura) => {
    if (window.confirm(`¿Seguro que quieres eliminar la asignatura "${asignatura.nombre}"?`)) {
      try {
        await deleteAsignatura(asignatura.id);
        showSuccess("Asignatura eliminada.");
        loadData();
      } catch (error: any) { showError(error.message); }
    }
  };

  if (loading) return <p>Cargando currículum...</p>;

  return (
    <>
      <Accordion type="single" collapsible className="w-full" defaultValue="niveles">
        <AccordionItem value="niveles">
          <AccordionTrigger className="text-lg font-semibold">Niveles Educativos</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddNivel}><PlusCircle className="mr-2 h-4 w-4" /> Crear Nivel</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Orden</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {niveles.map(n => (
                  <TableRow key={n.id}>
                    <TableCell>{n.nombre}</TableCell>
                    <TableCell>{n.orden}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditNivel(n)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteNivel(n)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="asignaturas">
          <AccordionTrigger className="text-lg font-semibold">Asignaturas</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddAsignatura}><PlusCircle className="mr-2 h-4 w-4" /> Crear Asignatura</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {asignaturas.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.descripcion}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAsignatura(a)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAsignatura(a)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <NivelEditDialog isOpen={isNivelDialogOpen} onClose={() => setNivelDialogOpen(false)} onSaved={loadData} nivel={selectedNivel} />
      <AsignaturaEditDialog isOpen={isAsignaturaDialogOpen} onClose={() => setAsignaturaDialogOpen(false)} onSaved={loadData} asignatura={selectedAsignatura} />
    </>
  );
};

export default CurriculumManagement;