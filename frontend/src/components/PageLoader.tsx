// frontend/src/components/PageLoader.tsx
import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full text-unach-blue animate-in fade-in duration-300">
      <div className="relative">
        {/* Círculo exterior girando */}
        <div className="w-16 h-16 border-4 border-blue-100 border-t-unach-blue rounded-full animate-spin"></div>
        {/* Logo estático en el centro */}
        <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center font-bold text-lg text-unach-blue/50">
            U
        </div>
      </div>
      <p className="mt-4 font-bold text-sm tracking-widest text-gray-400 animate-pulse">CARGANDO CONTENIDO...</p>
    </div>
  );
};

export default PageLoader;