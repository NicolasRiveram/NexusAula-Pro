import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Building, School, MoreVertical, Edit, Trash2, Star, Move } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchAllEstablishments, deleteEstablishment, Establishment } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import EstablishmentEditDialog from '@/components/super-admin/EstablishmentEditDialog';
import EstablishmentSubscriptionDialog from '@/components/super-admin/EstablishmentSubscriptionDialog';
import MoveEstablishmentDialog from '@/components/super-admin/MoveEstablishmentDialog';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const EstablishmentsPage = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isSubDialogOpen, setSubDialogOpen] = useState(false);
  const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [establishmentToMove, setEstablishmentToMove] = useState<Establishment | null>(null);
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
    setEditDialogOpen(true);
  };

  const handleAddSub = (pId: string) => {
    setSelectedEstablishment(null);
    setParentId(pId);
    setEditDialogOpen(true);
  };

  const handleEdit = (est: Establishment) => {
    setSelectedEstablishment(est);
    setParentId(est.parent_id);
    setEditDialogOpen(true);
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

  const handleManageSubscription = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSubDialogOpen(true);
  };

  const handleMove = (est: Establishment) => {
    setEstablishmentToMove(est);
    setMoveDialogOpen(true);
  };

  const topLevelEstablishments = establishments.filter(e => !e.parent_id);
  const subEstablishments = establishments.filter(e => e.parent_id);

  const renderEstablishmentItem = (est: Establishment) => {
    const subscription = est.suscripciones_establecimiento?.[0];
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
        <Link to={`/dashboard/super-admin/establishment/${est.id}`} className="flex items-center gap-2 hover:underline font-semibold">
          <School className="h-5 w-5" />
          <div>
            <p>{est.nombre}</p>
            {subscription && (
              <div className="flex items-center gap-2">
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} className="capitalize text-xs">{subscription.plan_type}</Badge>
                <span className="text-xs text-muted-foreground">
                  Expira: {subscription.expires_at ? format(parseISO(subscription.expires_at), 'P', { locale: es }) : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleManageSubscription(est)}><Star className="mr-2 h-4 w-4" /> Gestionar Suscripción</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(est)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
            {!est.parent_id && <DropdownMenuItem onClick={() => handleMove(est)}><Move className="mr-2 h-4 w-4" /> Mover a un grupo</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => handleDelete(est)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Establecimientos</CardTitle>
            <CardDescription>Administra grupos y establecimientos educativos.</CardDescription>
          </div>
          <Button onClick={handleAddGroup}><PlusCircle className="mr-2 h-4 w-4" /> Crear Grupo o Establecimiento</Button>
        </CardHeader>
        <CardContent>
          {loading ? <p>Cargando...</p> : (
            <div className="space-y-2">
              {topLevelEstablishments.map(topLevelEst => {
                const children = subEstablishments.filter(sub => sub.parent_id === topLevelEst.id);
                if (children.length > 0) {
                  return (
                    <Accordion type="single" collapsible key={topLevelEst.id}>
                      <AccordionItem value={topLevelEst.id}>
                        <AccordionHeader className="flex items-center justify-between px-3 bg-muted/30 rounded-md">
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-grow text-left py-3">
                            <div className="flex items-center gap-2">
                              <Building className="h-5 w-5" /> {topLevelEst.nombre}
                            </div>
                          </AccordionTrigger>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(topLevelEst)}><Edit className="mr-2 h-4 w-4" /> Editar Grupo</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMove(topLevelEst)}><Move className="mr-2 h-4 w-4" /> Mover a un grupo</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(topLevelEst)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar Grupo</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </AccordionHeader>
                        <AccordionContent className="pl-6 pt-4">
                          <div className="flex justify-end mb-4">
                            <Button size="sm" onClick={() => handleAddSub(topLevelEst.id)}>
                              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Establecimiento
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {children.map(sub => renderEstablishmentItem(sub))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                }
                return renderEstablishmentItem(topLevelEst);
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <EstablishmentEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSaved={loadData}
        establishment={selectedEstablishment}
        parentId={parentId}
      />
      <EstablishmentSubscriptionDialog
        isOpen={isSubDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        onSaved={loadData}
        establishmentId={selectedEstablishment?.id || null}
        establishmentName={selectedEstablishment?.nombre || null}
        currentSubscription={selectedEstablishment?.suscripciones_establecimiento?.[0] || null}
      />
      <MoveEstablishmentDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onSaved={loadData}
        establishmentToMove={establishmentToMove}
        potentialParents={topLevelEstablishments.filter(e => e.id !== establishmentToMove?.id)}
      />
    </>
  );
};

export default EstablishmentsPage;