export const formatEvaluationType = (type: string | null | undefined): string => {
  if (!type) return 'Desconocido';
  switch (type) {
    case 'prueba':
      return 'Prueba';
    case 'guia_de_trabajo':
      return 'Guía de trabajo';
    case 'disertacion':
      return 'Disertación';
    case 'otro':
      return 'Otro';
    default:
      // Capitalize the first letter for any other case
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};