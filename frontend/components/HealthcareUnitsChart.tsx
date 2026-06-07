"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/app/services/api';
import { ResponsiveBar } from '@nivo/bar';

export default function HealthcareUnitsChart({ 
  doenca,
  filtroAno = null,
  filtroSexo = null
}: { 
  doenca: string;
  filtroAno?: number | null;
  filtroSexo?: string | null;
}) {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/unidades-carga', { params: { doenca, ano: filtroAno, sexo: filtroSexo } })
      .then(res => {
        // Reverter a ordem para o gráfico de barras horizontais (o Nivo renderiza de baixo para cima)
        setDados(res.data.reverse());
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados de unidades de saúde:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  // Encontra a severidade máxima para normalizar a escala de cores
  const maxSeveridade = useMemo(() => {
    if (!dados || dados.length === 0) return 0.1;
    let max = 0;
    dados.forEach((d) => {
      if (d.severidade > max) max = d.severidade;
    });
    return max > 0.05 ? max : 0.05;
  }, [dados]);

  // Função para calcular a cor com base na severidade (Vibrant HSL interpolation)
  const getColorForSeverity = (bar: any) => {
    const sev = bar.data.severidade;
    // ratio de 0 a 1
    const ratio = Math.min(sev / maxSeveridade, 1);
    
    // HSL: 
    // Verde esmeralda: H=160, S=84%, L=40%
    // Amarelo vibrante: H=45, S=93%, L=47%
    // Vermelho rose: H=348, S=83%, L=50%
    
    let h, s, l;
    if (ratio < 0.5) {
      // Verde -> Amarelo
      const pct = ratio * 2;
      h = 160 - pct * (160 - 45);
      s = 84 + pct * (93 - 84);
      l = 40 + pct * (47 - 40);
    } else {
      // Amarelo -> Vermelho
      const pct = (ratio - 0.5) * 2;
      // 348 is -12 in hue space, so 45 -> -12
      h = 45 - pct * (45 - -12);
      if (h < 0) h += 360;
      s = 93 - pct * (93 - 83);
      l = 47 + pct * (50 - 47);
    }
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden w-full flex flex-col transition-all min-h-[600px]";

  if (loading) {
    return (
      <div className={cardClass}>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-slate-700 opacity-50"></div>
         <div className="flex-1 w-full animate-pulse bg-slate-800/50 rounded-2xl"></div>
      </div>
    );
  }

  const temDados = dados && dados.length > 0;

  return (
    <div className={cardClass}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 opacity-80"></div>
      
      <div className="flex flex-col mb-4 relative z-10">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
          Carga Hospitalar (Top 15 Unidades)
        </h3>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Ranking das unidades de saúde mais impactadas. <strong className="text-slate-300">A cor das barras indica a Taxa de Severidade</strong> (Internações + Óbitos).
        </p>
      </div>

      <div className="flex-1 w-full relative z-10 h-[500px]">
        {!temDados ? (
          <div className="flex items-center justify-center h-full text-slate-500">Sem dados para exibir.</div>
        ) : (
          <ResponsiveBar
            data={dados}
            keys={['casos']}
            indexBy="id"
            layout="horizontal"
            margin={{ top: 10, right: 30, bottom: 50, left: 220 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={getColorForSeverity}
            borderRadius={4}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Volume Total de Casos',
              legendPosition: 'middle',
              legendOffset: 40,
              format: (value) => value.toLocaleString('pt-BR')
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
              format: (v) => v.length > 30 ? `${v.substring(0, 30)}...` : v
            }}
            enableGridY={false}
            gridXValues={5}
            labelSkipWidth={40}
            labelSkipHeight={12}
            label={(d) => d.value?.toLocaleString('pt-BR') || ''}
            labelTextColor="#ffffff"
            theme={{
              labels: { 
                text: { fontSize: 13, fontWeight: 800, fill: '#ffffff', textShadow: '0px 2px 4px rgba(0,0,0,0.8)' } 
              },
              axis: {
                ticks: { text: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 } },
                legend: { text: { fill: '#cbd5e1', fontSize: 13, fontWeight: 600 } }
              },
              grid: { line: { stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' } },
              tooltip: {
                container: { background: '#0f172a', color: '#f8fafc', fontSize: '13px', borderRadius: '12px', border: '1px solid #334155' }
              }
            }}
            tooltip={({ data }) => {
              const severidadePct = (data.severidade * 100).toFixed(1);
              return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl min-w-[220px]">
                  <strong className="text-white block mb-2 border-b border-slate-700 pb-2">{data.id}</strong>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-slate-400">Casos Confirmados:</span>
                    <span className="text-white font-bold">{data.casos.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-slate-400">Internações:</span>
                    <span className="text-amber-400 font-bold">{data.internacoes}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-400">Óbitos:</span>
                    <span className="text-rose-400 font-bold">{data.obitos}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300 tracking-wider">TAXA DE SEVERIDADE</span>
                    <span className="font-black text-rose-400">{severidadePct}%</span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
      
      {/* Legenda de Cores */}
      {temDados && (
        <div className="mt-4 flex flex-wrap justify-between items-center gap-4 text-xs font-medium bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Tamanho da Barra =</span>
            <span className="text-slate-200">Volume Total de Casos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-2">Cor (Severidade) =</span>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Leve</div>
            <div className="flex items-center gap-1.5 ml-2"><span className="w-3 h-3 rounded-md bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> Atenção</div>
            <div className="flex items-center gap-1.5 ml-2"><span className="w-3 h-3 rounded-md bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)]"></span> Crítica</div>
          </div>
        </div>
      )}
    </div>
  );
}
