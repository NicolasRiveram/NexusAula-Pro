import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { fetchEstablishmentFeatures, saveEstablishmentFeature, Feature } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';

const ALL_FEATURES = [
  { key: 'planning', label: 'Planificación' },
  { key: 'evaluation', label: 'Evaluación' },
  { key: 'rubrics', label: 'Rúbricas' },
  { key: 'projects', label: 'Proyectos ABP' },
  { key: 'analytics', label: 'Analíticas' },
  { key: 'reports', label: 'Informes' },
  { key: 'logbook', label: 'Bitácora' },
  { key: 'classbook', label: 'Libro de Clases' },
];

interface FeatureFlagManagerProps {
  establishmentId: string;
}

const FeatureFlagManager: React.FC<FeatureFlagManagerProps> = ({ establishmentId }) => {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatures = async () => {
      setLoading(true);
      try {
        const data = await fetchEstablishmentFeatures(establishmentId);
        const featureMap = ALL_FEATURES.reduce((acc, feature) => {
          const savedFeature = data.find(f => f.feature_key === feature.key);
          acc[feature.key] = savedFeature ? savedFeature.is_enabled : true; // Default to true if not set
          return acc;
        }, {} as Record<string, boolean>);
        setFeatures(featureMap);
      } catch (error: any) {
        showError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadFeatures();
  }, [establishmentId]);

  const handleToggle = async (featureKey: string, isEnabled: boolean) => {
    setFeatures(prev => ({ ...prev, [featureKey]: isEnabled }));
    try {
      await saveEstablishmentFeature(establishmentId, featureKey, isEnabled);
      showSuccess(`Módulo '${ALL_FEATURES.find(f=>f.key === featureKey)?.label}' ${isEnabled ? 'habilitado' : 'deshabilitado'}.`);
    } catch (error: any) {
      showError(error.message);
      // Revert on error
      setFeatures(prev => ({ ...prev, [featureKey]: !isEnabled }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Módulos</CardTitle>
        <CardDescription>Habilita o deshabilita funcionalidades para este establecimiento.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {ALL_FEATURES.map(feature => (
              <div key={feature.key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor={`feature-${feature.key}`} className="text-base">{feature.label}</Label>
                <Switch
                  id={`feature-${feature.key}`}
                  checked={features[feature.key]}
                  onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureFlagManager;