import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import NivelesManagement from './curriculum/NivelesManagement';
import AsignaturasManagement from './curriculum/AsignaturasManagement';
import EjesManagement from './curriculum/EjesManagement';
import HabilidadesManagement from './curriculum/HabilidadesManagement';
import ObjetivosManagement from './curriculum/ObjetivosManagement';
import CurriculumUploadForm from './curriculum/CurriculumUploadForm';
import UrlUploadForm from './curriculum/UrlUploadForm';
import CurriculumJobsTable from './curriculum/CurriculumJobsTable';

const CurriculumManagement = () => {
  return (
    <Accordion type="single" collapsible className="w-full mt-6" defaultValue="upload">
      <AccordionItem value="upload">
        <AccordionTrigger className="text-lg font-semibold">Carga Masiva de Currículum</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <UrlUploadForm />
          <CurriculumUploadForm />
          <CurriculumJobsTable />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="niveles">
        <AccordionTrigger className="text-lg font-semibold">Niveles Educativos</AccordionTrigger>
        <AccordionContent>
          <NivelesManagement />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="asignaturas">
        <AccordionTrigger className="text-lg font-semibold">Asignaturas</AccordionTrigger>
        <AccordionContent>
          <AsignaturasManagement />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="ejes">
        <AccordionTrigger className="text-lg font-semibold">Ejes Temáticos</AccordionTrigger>
        <AccordionContent>
          <EjesManagement />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="habilidades">
        <AccordionTrigger className="text-lg font-semibold">Habilidades</AccordionTrigger>
        <AccordionContent>
          <HabilidadesManagement />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="oas">
        <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje (OAs)</AccordionTrigger>
        <AccordionContent>
          <ObjetivosManagement />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CurriculumManagement;