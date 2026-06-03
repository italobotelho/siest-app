"use client";

import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import { ResponsivePie } from '@nivo/pie';

export default function DemographicSunburst({ 
  doenca,
  filtroAno = null,
  filtroSexo = null
}: { 
  doenca: string;
  filtroAno?: number | null;
  filtroSexo?: string | null;
}) {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/dinamico', { params: { doenca, ano: filtroAno, sexo: filtroSexo } })
      .then(res => {
        setDados(res.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados demográficos:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden w-full flex flex-col transition-all";

  if (loading || !dados) {
    return (
      <div className={cardClass} style={{ minHeight: '400px' }}>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-slate-700 opacity-50"></div>
         <div className="flex-1 w-full animate-pulse bg-slate-800/50 rounded-2xl"></div>
      </div>
    );
  }

  const { sexo = [], faixa_etaria = [] } = dados;
  
  // Sort and process Faixa Etaria
  const faixas = [...faixa_etaria].sort((a, b) => {
    if (a.faixa_etaria.includes('Ign') || a.faixa_etaria.includes('N/I')) return 1;
    if (b.faixa_etaria.includes('Ign') || b.faixa_etaria.includes('N/I')) return -1;
    return a.faixa_etaria.localeCompare(b.faixa_etaria);
  });
  
  const maxFaixa = Math.max(...faixas.map(f => f.total_casos || 0), 1);

  // Process Sexo
  const totalSexo = sexo.reduce((acc: number, curr: any) => acc + (curr.total_casos || 0), 0) || 1;
  const pieData = sexo.map((s: any) => ({
    id: s.sexo,
    label: s.sexo === 'F' || s.sexo === 'FEMININO' ? 'Feminino' : s.sexo === 'M' || s.sexo === 'MASCULINO' ? 'Masculino' : 'Indeterminado',
    value: s.total_casos,
    color: s.sexo === 'F' || s.sexo === 'FEMININO' ? '#ec4899' : s.sexo === 'M' || s.sexo === 'MASCULINO' ? '#3b82f6' : '#94a3b8'
  }));

  return (
    <div className={cardClass}>
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80"></div>
      
      {/* Header */}
      <div className="flex flex-col mb-8 relative z-10">
        <h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
          Perfil Demográfico
        </h3>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Distribuição por Faixa Etária e Sexo
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 relative z-10">
        
        {/* Gráfico de Faixa Etária (Barras Horizontais Customizadas) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col justify-center gap-4 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Faixa Etária
          </h4>
          
          {faixas.length === 0 ? (
            <div className="text-slate-500 text-sm py-4">Sem dados de idade disponíveis para este filtro.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {faixas.map((f: any, idx: number) => {
                const pct = Math.round(((f.total_casos || 0) / maxFaixa) * 100);
                return (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="w-24 text-right text-xs md:text-sm font-semibold text-slate-400 group-hover:text-white transition-colors truncate">
                      {f.faixa_etaria}
                    </div>
                    <div className="flex-1 h-5 md:h-6 bg-slate-900/80 rounded-full overflow-hidden relative shadow-inner">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:brightness-110"
                        style={{ width: `${pct}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                      </div>
                    </div>
                    <div className="w-16 text-left text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                      {f.total_casos.toLocaleString('pt-BR')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico de Sexo (Donut Chart Nivo) */}
        <div className="col-span-1 flex flex-col justify-center items-center bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 relative min-h-[300px]">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest absolute top-6 left-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Sexo
          </h4>
          
          {pieData.length === 0 ? (
            <div className="text-slate-500 text-sm mt-8">Sem dados de sexo disponíveis.</div>
          ) : (
            <div className="w-full h-full min-h-[250px] mt-8 relative">
              <ResponsivePie
                data={pieData}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                innerRadius={0.75}
                padAngle={3}
                cornerRadius={8}
                activeOuterRadiusOffset={8}
                colors={{ datum: 'data.color' }}
                borderWidth={0}
                enableArcLinkLabels={false}
                arcLabel={d => `${Math.round((d.value / totalSexo) * 100)}%`}
                arcLabelsRadiusOffset={0.5}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                theme={{
                  tooltip: {
                    container: { background: '#0f172a', color: '#f8fafc', fontSize: '13px', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }
                  },
                  labels: { text: { fontSize: 14, fontWeight: 900, fontFamily: 'inherit' } }
                }}
              />
              {/* Central Text for Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-8">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-md">
                  {totalSexo.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Total</span>
              </div>
            </div>
          )}
        </div>
        
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%) skewX(-12deg); }
          0% { transform: translateX(-150%) skewX(-12deg); }
        }
      `}} />
    </div>
  );
}
