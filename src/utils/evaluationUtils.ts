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

export const calculateGrade = (score: number | null, maxScore: number): number => {
  if (score === null || maxScore <= 0) return 1.0;
  const minPassingScore = maxScore * 0.6;
  let grade;
  if (score >= minPassingScore) {
    grade = 4.0 + 3.0 * ((score - minPassingScore) / (maxScore - minPassingScore));
  } else {
    grade = 1.0 + 3.0 * (score / minPassingScore);
  }
  return Math.round(grade * 10) / 10;
};