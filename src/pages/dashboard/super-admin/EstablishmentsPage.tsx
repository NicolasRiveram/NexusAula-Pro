import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Building, School, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchAllEstablishments, deleteEstablishment, Establishment } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import EstablishmentEditDialog from '@/components/super-admin/EstablishmentEditDialog';

const EstablishmentsPage = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllEstablishments();
      setEstablishments(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddGroup = () => {
    setSelectedEstablishment(null);
    setParentId(null);
    setDialogOpen(true);
  };

  const handleAddSub = (pId: string) => {
    setSelectedEstablishment(null);
    setParentId(pId);
    setDialogOpen(true);
  };

  const handleEdit = (est: Establishment) => {
    setSelectedEstablishment(est);
    setParentId(est.parent_id);
    setDialogOpen(true);
  };

  const handleDelete = async (est: Establishment) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${est.nombre}"? Esto eliminará también todos sus sub-establecimientos.`)) {
      try {
        await deleteEstablishment(est.id);
        showSuccess("Establecimiento eliminado.");
        loadData();
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

  const groups = establishments.filter(e => !e.parent_id);
  const subEstablishments = establishments.filter(e => e.parent_id);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Establecimientos</CardTitle>
            <CardDescription>Administra grupos y sub-establecimientos.</CardDescription>
          </div>
          <Button onClick={handleAddGroup}><PlusCircle className="mr-2 h-4 w-4" /> Crear Grupo</Button>
        </CardHeader>
        <CardContent>
          {loading ? <p>Cargando...</p> : (
            <Accordion type="multiple" className="w-full">
              {groups.map(group => (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5" /> {group.nombre}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 pt-4">
                    <div className="flex justify-end mb-4">
                      <Button size="sm" onClick={() => handleAddSub(group.id)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Sub-Establecimiento
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {subEstablishments.filter(sub => sub.parent_id === group.id).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <Link to={`/dashboard/super-admin/establishment/${sub.id}`} className="flex items-center gap-2 hover:underline">
                            <School className="h-4 w-4" /> {sub.nombre}
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(sub)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(sub)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
      <EstablishmentEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadData}
        establishment={selectedEstablishment}
        parentId={parentId}
      />
    </>
  );
};

export default EstablishmentsPage;