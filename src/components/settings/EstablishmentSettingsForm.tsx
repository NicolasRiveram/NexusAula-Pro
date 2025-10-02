import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { uploadEstablishmentLogo, updateEstablishmentDetails, getLogoPublicUrl } from '@/api/settingsApi';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  logo: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

const EstablishmentSettingsForm = () => {
  const { activeEstablishment, setActiveEstablishment } = useEstablishment();
  const [preview, setPreview] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const logoFile = watch("logo");

  useEffect(() => {
    if (activeEstablishment?.logo_url) {
      setPreview(getLogoPublicUrl(activeEstablishment.logo_url));
    }
  }, [activeEstablishment]);

  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const file = logoFile[0];
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [logoFile]);

  const onSubmit = async (data: FormData) => {
    if (!activeEstablishment) {
      showError("No hay un establecimiento activo.");
      return;
    }
    if (!data.logo || data.logo.length === 0) {
      showError("Por favor, selecciona un archivo de logo.");
      return;
    }

    try {
      const filePath = await uploadEstablishmentLogo(activeEstablishment.id, data.logo[0]);
      await updateEstablishmentDetails(activeEstablishment.id, { logo_url: filePath });
      
      // Actualiza el contexto para reflejar los cambios inmediatamente
      setActiveEstablishment({ ...activeEstablishment, logo_url: filePath });

      showSuccess("Logo del establecimiento actualizado.");
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo del Establecimiento</CardTitle>
        <CardDescription>Sube el logo que representará a tu establecimiento en la aplicación y documentos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {preview && (
            <div>
              <Label>Vista Previa</Label>
              <div className="mt-2 w-32 h-32 flex items-center justify-center border rounded-md overflow-hidden">
                <img src={preview} alt="Vista previa del logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="logo">Subir nuevo logo</Label>
            <Input id="logo" type="file" accept="image/png, image/jpeg, image/svg+xml" {...register("logo")} />
            <p className="text-xs text-muted-foreground mt-1">Recomendado: PNG o SVG con fondo transparente.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Logo
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default EstablishmentSettingsForm;