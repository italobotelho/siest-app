"use client";

import dynamic from 'next/dynamic';

// Dizemos ao Next.js para não usar SSR (Server-Side Rendering) para o mapa
const MapaDinamico = dynamic(() => import('./MapComponent'), {
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
  return (
    <div className="w-full mb-16">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Mapeamento de Risco e Vulnerabilidade</h3>
        {/* O z-0 é importante para o mapa não sobrepor outras coisas no ecrã */}
        <div className="h-[550px] w-full rounded-xl overflow-hidden border border-slate-700/50 relative z-0 shadow-inner">
          <MapaDinamico doenca={doenca} filtroAno={filtroAno} filtroSexo={filtroSexo} />
        </div>
      </div>
    </div>
  );
}