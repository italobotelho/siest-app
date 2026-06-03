"use client";

import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import DashboardMetrics from '../components/DashboardMetrics';
import DashboardCharts from '../components/DashboardCharts';
import DashboardMap from '../components/DashboardMap';
import TimeLagChart from '../components/TimeLagChart';
import CorrelationScatter from '../components/CorrelationScatter';
import DemographicSunburst from '../components/DemographicSunburst';
import ClinicalOutcomesSankey from '../components/ClinicalOutcomesSankey';

const DOENCAS = [
  { id: '', nome: 'Geral (Todas)', colorInfo: 'from-indigo-500 to-purple-500', activeClass: 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border-indigo-500' },
  { id: 'DENG', nome: 'Dengue', colorInfo: 'from-rose-500 to-red-500', activeClass: 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)] border-rose-500' },
  { id: 'ZIKA', nome: 'Zika', colorInfo: 'from-amber-400 to-orange-500', activeClass: 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-500' },
  { id: 'CHIK', nome: 'Chikungunya', colorInfo: 'from-fuchsia-400 to-pink-500', activeClass: 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] border-fuchsia-500' },
  { id: 'LEPT', nome: 'Leptospirose', colorInfo: 'from-teal-400 to-cyan-500', activeClass: 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)] border-teal-500' },
  { id: 'HEPA', nome: 'Hepatite A', colorInfo: 'from-yellow-400 to-lime-500', activeClass: 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)] border-yellow-500' }
];

const TABS = [
  { id: 'geral', label: 'Visão Geral' },
  { id: 'clima', label: 'Clima & Correlação' },
  { id: 'geo', label: 'Geo & Demografia' },
  { id: 'clinico', label: 'Inteligência Clínica' }
];

export default function Home() {
  const [doencaSelecionada, setDoencaSelecionada] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('geral');
  const [filtroAno, setFiltroAno] = useState<number | null>(null);
  const [filtroSexo, setFiltroSexo] = useState<string | null>(null);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  useEffect(() => {
    api.get('/dashboard/anos')
      .then(res => setAnosDisponiveis(res.data || []))
      .catch(err => console.error("Erro ao buscar anos:", err));
  }, []);

  const activeDoenca = DOENCAS.find(d => d.id === doencaSelecionada) || DOENCAS[0];

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 text-slate-100 font-sans relative overflow-hidden bg-slate-950">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r ${activeDoenca.colorInfo} opacity-[0.15] blur-[120px] rounded-full pointer-events-none transition-all duration-1000 z-0`}></div>

      <div className="w-full max-w-7xl mb-8 relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          
          {/* Top Row: Title and Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${activeDoenca.colorInfo} transition-all duration-500 tracking-tight`}>
                SIEST
              </h1>
              <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
                Sistema de Inteligência Epidemiológica e Socio-Territorial
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 shadow-inner">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ano</span>
                <select 
                  className="bg-slate-900 text-white border border-slate-600 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-lg transition-all hover:bg-slate-800"
                  value={filtroAno || ''}
                  onChange={(e) => setFiltroAno(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Todos</option>
                  {anosDisponiveis.map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>
              
              <div className="hidden sm:block w-px h-8 bg-slate-600/50"></div>
              
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sexo</span>
                <select 
                  className="bg-slate-900 text-white border border-slate-600 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-lg transition-all hover:bg-slate-800"
                  value={filtroSexo || ''}
                  onChange={(e) => setFiltroSexo(e.target.value || null)}
                >
                  <option value="">Todos</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="I">Indeterm</option>
                </select>
              </div>

              {(filtroAno || filtroSexo) && (
                <>
                  <div className="hidden sm:block w-px h-8 bg-slate-600/50"></div>
                  <button 
                    onClick={() => { setFiltroAno(null); setFiltroSexo(null); }}
                    className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors text-xs font-bold uppercase tracking-wider px-2"
                  >
                    ✕ Limpar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Row: Tabs */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-t border-slate-700/50 pt-6">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full lg:w-auto">
              {DOENCAS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDoencaSelecionada(d.id);
                    if (d.id === '' && activeTab === 'clima') {
                      setActiveTab('geral');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border whitespace-nowrap shadow-sm ${
                    doencaSelecionada === d.id 
                      ? d.activeClass 
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:-translate-y-0.5'
                  }`}
                >
                  {d.nome}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full lg:w-auto">
              {TABS.filter(tab => !(doencaSelecionada === '' && tab.id === 'clima')).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-800/40 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="w-full max-w-7xl relative z-10 space-y-8">
        {activeTab === 'geral' && (
          <>
            <DashboardMetrics doenca={doencaSelecionada} filtroAno={filtroAno} filtroSexo={filtroSexo} />
            <DashboardCharts 
              doenca={doencaSelecionada} 
              filtroAno={filtroAno} 
              filtroSexo={filtroSexo} 
              setFiltroSexo={setFiltroSexo} 
            />
          </>
        )}
        
        {activeTab === 'clima' && (
          <>
            <TimeLagChart doenca={doencaSelecionada} filtroAno={filtroAno} filtroSexo={filtroSexo} />
            <CorrelationScatter doenca={doencaSelecionada} filtroAno={filtroAno} filtroSexo={filtroSexo} />
          </>
        )}

        {activeTab === 'geo' && (
          <>
            {(doencaSelecionada === 'HEPA' || doencaSelecionada === 'ZIKA') && (
              <div className="bg-amber-500/10 border border-amber-500/50 rounded-2xl p-4 flex gap-4 items-start shadow-lg mb-2">
                <div className="text-amber-400 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-1">Nota de Imputação de Dados</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {doencaSelecionada === 'HEPA' 
                      ? "Atenção: 100% dos dados de unidade de saúde para Hepatite A foram imputados e alocados no centro da cidade devido à ausência de registros geográficos precisos. A visualização no mapa representa essa alocação central e não a distribuição real."
                      : "Atenção: 86.7% dos dados de unidade de saúde para Zika foram imputados e alocados no centro da cidade, pois não foi possível determinar a localização com precisão original. A visualização no mapa está fortemente concentrada nessa região."}
                  </p>
                </div>
              </div>
            )}
            <DashboardMap doenca={doencaSelecionada} filtroAno={filtroAno} filtroSexo={filtroSexo} />
            <DemographicSunburst doenca={doencaSelecionada} filtroAno={filtroAno} filtroSexo={filtroSexo} />
          </>
        )}

        {activeTab === 'clinico' && (
          <>
            <ClinicalOutcomesSankey doenca={doencaSelecionada} filtroAno={filtroAno} filtroSexo={filtroSexo} />
          </>
        )}
      </div>

    </main>
  );
}