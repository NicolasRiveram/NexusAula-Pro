import React from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

const TermsOfService = () => {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Términos de Servicio</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <p>
              Estos términos y condiciones describen las reglas y regulaciones para el uso de la aplicación NexusAula.
            </p>
            <p>
              Al acceder a esta aplicación, asumimos que aceptas estos términos y condiciones. No continúes usando 
              NexusAula si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.
            </p>

            <h2>Cuentas</h2>
            <p>
              Cuando creas una cuenta con nosotros, debes proporcionarnos información precisa, completa y actualizada 
              en todo momento. El incumplimiento de esto constituye una violación de los Términos, lo que puede resultar 
              en la terminación inmediata de tu cuenta en nuestro Servicio.
            </p>

            <h2>Contenido</h2>
            <p>
              Nuestro Servicio te permite publicar, vincular, almacenar, compartir y poner a disposición cierta información, 
              texto, gráficos, videos u otro material. Eres responsable del Contenido que publicas en el Servicio, 
              incluida su legalidad, confiabilidad y adecuación.
            </p>

            <h2>Terminación</h2>
            <p>
              Podemos rescindir o suspender tu cuenta de inmediato, sin previo aviso ni responsabilidad, por cualquier 
              motivo, incluido, entre otros, si incumples los Términos.
            </p>

            <h2>Cambios</h2>
            <p>
              Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier 
              momento. Si una revisión es importante, intentaremos proporcionar un aviso de al menos 30 días antes de que 
              entren en vigencia los nuevos términos.
            </p>
            
            <h2>Contáctenos</h2>
            <p>
              Si tienes alguna pregunta sobre estos Términos, contáctanos a través de <a href="mailto:contacto@nexusaula.com" className="text-primary hover:underline">contacto@nexusaula.com</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;