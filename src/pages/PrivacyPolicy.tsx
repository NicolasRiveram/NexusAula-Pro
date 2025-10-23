import React from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Política de Privacidad</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <h2>Uso de Datos de Google</h2>
            <p>
              Nuestra aplicación utiliza el inicio de sesión de Google (OAuth) para autenticar a los usuarios. 
              Al usar esta función, recopilamos su dirección de correo electrónico y nombre de perfil proporcionados 
              por Google con el único propósito de crear y administrar su cuenta de usuario dentro de nuestra plataforma. 
              No compartimos esta información con terceros.
            </p>

            <h2>Recopilación y Uso de Información</h2>
            <p>
              Para una mejor experiencia al usar nuestro Servicio, podemos requerir que nos proporcione cierta 
              información de identificación personal, que incluye, entre otros, su nombre y dirección de correo electrónico. 
              La información que solicitamos será retenida por nosotros y utilizada como se describe en esta política de privacidad.
            </p>

            <h2>Seguridad</h2>
            <p>
              Valoramos su confianza al proporcionarnos su información personal, por lo que nos esforzamos por utilizar 
              medios comercialmente aceptables para protegerla. Pero recuerde que ningún método de transmisión por 
              Internet o método de almacenamiento electrónico es 100% seguro y confiable, y no podemos garantizar 
              su seguridad absoluta.
            </p>

            <h2>Cambios a esta Política de Privacidad</h2>
            <p>
              Podemos actualizar nuestra Política de Privacidad de vez en cuando. Por lo tanto, le recomendamos que 
              revise esta página periódicamente para ver si hay cambios. Le notificaremos cualquier cambio publicando 
              la nueva Política de Privacidad en esta página.
            </p>

            <h2>Contáctenos</h2>
            <p>
              Si tiene alguna pregunta o sugerencia sobre nuestra Política de Privacidad, no dude en contactarnos a través de <a href="mailto:contacto@nexusaula.com" className="text-primary hover:underline">contacto@nexusaula.com</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;