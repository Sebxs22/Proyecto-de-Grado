// frontend/src/components/DashboardSkeleton.tsx

import React from 'react';

// ✅ CAMBIO: Agregamos ": React.FC" para que use la importación y quite el warning
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER SKELETON */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-gray-100 pb-6 gap-4">
          <div className="space-y-3">
              <div className="flex gap-2">
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="hidden md:block">
             <div className="h-9 w-32 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
      </div>

      {/* RIESGOS SKELETON (2 Tarjetas grandes) */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-2xl p-1 bg-white">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div>
                </div>
                {/* Simulación de una fila interna expandida en el primero */}
                {i === 1 && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                        <div className="h-16 w-full bg-gray-50 rounded-xl animate-pulse"></div>
                        <div className="h-16 w-full bg-gray-50 rounded-xl animate-pulse"></div>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* KPIS SKELETON (2 Tarjetas medianas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="space-y-3">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="w-14 h-14 bg-gray-100 rounded-full animate-pulse"></div>
            </div>
        ))}
      </div>

      {/* ASIGNATURAS SKELETON */}
      <div className="space-y-6 pt-8 border-t border-gray-100">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full bg-white border border-gray-200 rounded-2xl animate-pulse"></div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;