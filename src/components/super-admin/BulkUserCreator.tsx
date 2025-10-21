import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserPlus } from 'lucide-react';
import { bulkCreateUsers } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  emails: z.string().min(1, "Debes ingresar al menos un correo."),
  initial_password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

type FormData = z.infer<typeof schema>;

interface BulkUserCreatorProps {
  establishmentId: string;
}

const BulkUserCreator: React.FC<BulkUserCreatorProps> = ({ establishmentId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const emailList = data.emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
      if (emailList.length === 0) {
        showError("No se encontraron correos válidos en la lista.");
        return;
      }
      
      const result = await bulkCreateUsers(establishmentId, emailList, data.initial_password);
      showSuccess(`Proceso finalizado: ${result.created} creados, ${result.linked} vinculados, ${result.errors} errores.`);
      reset({ emails: '', initial_password: '' });
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creación Masiva de Usuarios</CardTitle>
        <CardDescription>Añade docentes al establecimiento. Se crearán cuentas para los correos nuevos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="emails">Lista de Correos</Label>
            <Controller
              name="emails"
              control={control}
              render={({ field }) => <Textarea id="emails" rows={8} placeholder="un_correo@ejemplo.com&#10;otro_correo@ejemplo.com" {...field} />}
            />
            <p className="text-xs text-muted-foreground mt-1">Separa los correos por coma, punto y coma, o salto de línea.</p>
            {errors.emails && <p className="text-red-500 text-sm mt-1">{errors.emails.message}</p>}
          </div>
          <div>
            <Label htmlFor="initial_password">Contraseña Inicial</Label>
            <Controller
              name="initial_password"
              control={control}
              render={({ field }) => <Input id="initial_password" type="password" {...field} />}
            />
            {errors.initial_password && <p className="text-red-500 text-sm mt-1">{errors.initial_password.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Crear y Vincular Usuarios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BulkUserCreator;