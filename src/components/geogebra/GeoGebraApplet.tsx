import React from 'react';

interface GeoGebraAppletProps {
  materialId: string;
  className?: string;
}

const GeoGebraApplet: React.FC<GeoGebraAppletProps> = ({ materialId, className }) => {
  if (!materialId) {
    return <p className="text-red-500">Error: No se proporcionó un ID de material de GeoGebra.</p>;
  }

  const src = `https://www.geogebra.org/material/iframe/id/${materialId}`;

  return (
    <div className={`w-full aspect-video bg-gray-100 rounded-md overflow-hidden ${className}`}>
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        title={`GeoGebra Applet ${materialId}`}
      ></iframe>
    </div>
  );
};

export default GeoGebraApplet;