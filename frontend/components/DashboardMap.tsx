"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dizemos ao Next.js para não usar SSR (Server-Side Rendering) para o mapa
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-teal-400 animate-pulse bg-slate-900/50">
      A carregar dados socio-territoriais e georreferenciamento...
    </div>
  )
});

export default function DashboardMap({ 
  doenca,
  filtroAno = null,
  filtroSexo = null
}: { 
  doenca: string;
  filtroAno?: number | null;
  filtroSexo?: string | null;
}) {
  const [filtroEvolucao, setFiltroEvolucao] = useState<string | null>(null);
  const [filtroHospitalizado, setFiltroHospitalizado] = useState<string | null>(null);

  return (
    <div className="w-full mb-16">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-white tracking-tight">Mapeamento de Risco e Sobrecarga</h3>
          
          <div className="flex flex-wrap gap-3">
            {/* Filtros Geográficos */}
            <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 shadow-inner">
              <button 
                onClick={() => setFiltroEvolucao(null)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!filtroEvolucao ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Todas Evoluções
              </button>
              <button 
                onClick={() => setFiltroEvolucao('2')} // 2 = Óbito no SINAN
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filtroEvolucao === '2' ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Apenas Óbitos
              </button>
            </div>
          </div>
        </div>

        {/* O z-0 é importante para o mapa não sobrepor outras coisas no ecrã */}
        <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-700/50 relative z-0 shadow-inner">
          <MapComponent 
            doenca={doenca} 
            filtroAno={filtroAno} 
            filtroSexo={filtroSexo}
            filtroEvolucao={filtroEvolucao}
            filtroHospitalizado={filtroHospitalizado}
          />
        </div>
      </div>
    </div>
  );
}