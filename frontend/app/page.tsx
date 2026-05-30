"use client";

import { useState } from 'react';
import DashboardMetrics from '../components/DashboardMetrics';
import DashboardCharts from '../components/DashboardCharts';
import DashboardMap from '../components/DashboardMap';
import TimeLagChart from '../components/TimeLagChart';
import CorrelationScatter from '../components/CorrelationScatter';
import DemographicSunburst from '../components/DemographicSunburst';

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
  { id: 'geo', label: 'Geo & Demografia' }
];

export default function Home() {
  const [doencaSelecionada, setDoencaSelecionada] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('geral');

  const activeDoenca = DOENCAS.find(d => d.id === doencaSelecionada) || DOENCAS[0];

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 text-slate-100 font-sans relative overflow-hidden bg-slate-950">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r ${activeDoenca.colorInfo} opacity-[0.15] blur-[120px] rounded-full pointer-events-none transition-all duration-1000 z-0`}></div>

      <div className="w-full max-w-7xl mb-8 relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="mb-6 lg:mb-0">
            <h1 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${activeDoenca.colorInfo} transition-all duration-500 tracking-tight`}>
              SIEST
            </h1>
            <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
              Sistema de Inteligência Epidemiológica e Socio-Territorial
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {DOENCAS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDoencaSelecionada(d.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border whitespace-nowrap ${
                    doencaSelecionada === d.id 
                      ? d.activeClass 
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:-translate-y-0.5'
                  }`}
                >
                  {d.nome}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 overflow-x-auto border-t border-slate-700/50 pt-4 hide-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
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
            <DashboardMetrics doenca={doencaSelecionada} />
            <DashboardCharts doenca={doencaSelecionada} />
          </>
        )}
        
        {activeTab === 'clima' && (
          <>
            <TimeLagChart doenca={doencaSelecionada} />
            <CorrelationScatter doenca={doencaSelecionada} />
          </>
        )}

        {activeTab === 'geo' && (
          <>
            <DashboardMap doenca={doencaSelecionada} />
            <DemographicSunburst doenca={doencaSelecionada} />
          </>
        )}
      </div>

    </main>
  );
}