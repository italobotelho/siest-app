"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/app/services/api';
import { ResponsiveBar } from '@nivo/bar';

export default function SurveillanceResponseChart({ 
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
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/tempo-resposta', { params: { doenca, ano: filtroAno, sexo: filtroSexo } })
      .then(res => {
        setDados(res.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados de tempo de resposta:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  const { chartData, totalCasos } = useMemo(() => {
    if (!dados || dados.length === 0) return { chartData: [], totalCasos: 0 };

    // bucket -> { bucket, 'Laboratorial', 'Clínico-Epidem.', 'Sem Info' }
    const agg: Record<string, any> = {};
    const bucketsOrder = [
      '0-2 dias (Rápido)',
      '3-7 dias (Alerta)',
      '8-14 dias (Atraso)',
      '> 14 dias (Crítico)'
    ];

    bucketsOrder.forEach(b => {
      agg[b] = { bucket: b, 'Laboratorial': 0, 'Clínico-Epidem.': 0, 'Sem Info': 0 };
    });

    let total = 0;

    dados.forEach(r => {
      const b = r.bucket;
      let c = 'Sem Info';
      if (String(r.criterio) === '1') c = 'Laboratorial';
      else if (String(r.criterio) === '2') c = 'Clínico-Epidem.';

      if (agg[b]) {
        agg[b][c] += r.total;
        total += r.total;
      }
    });

    let formattedData = Object.values(agg);
    
    // Normalização (100% Stacked)
    if (isNormalized) {
      formattedData = formattedData.map((d: any) => {
        const rowTotal = d['Laboratorial'] + d['Clínico-Epidem.'] + d['Sem Info'];
        if (rowTotal === 0) return d;
        return {
          bucket: d.bucket,
          'Laboratorial': Number(((d['Laboratorial'] / rowTotal) * 100).toFixed(1)),
          'Clínico-Epidem.': Number(((d['Clínico-Epidem.'] / rowTotal) * 100).toFixed(1)),
          'Sem Info': Number(((d['Sem Info'] / rowTotal) * 100).toFixed(1))
        };
      });
    }

    return { chartData: formattedData, totalCasos: total };
  }, [dados, isNormalized]);

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden w-full flex flex-col transition-all min-h-[450px]";

  if (loading) {
    return (
      <div className={cardClass}>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-slate-700 opacity-50"></div>
         <div className="flex-1 w-full animate-pulse bg-slate-800/50 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 relative z-10 gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Termômetro de Resposta da Vigilância
          </h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Tempo de atraso (Delay) entre Primeiros Sintomas e Notificação por Critério
          </p>
        </div>
        
        {/* Toggle para Proporção vs Absoluto */}
        <button
          onClick={() => setIsNormalized(!isNormalized)}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
            isNormalized 
              ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 shadow-[0_0_15px_rgba(192,38,211,0.3)]' 
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
        >
          {isNormalized ? 'Ver Números Absolutos' : 'Ver em Proporção (%)'}
        </button>
      </div>

      <div className="flex-1 w-full relative z-10 mt-4 min-h-[350px]">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 px-8 text-center">
            {doenca === 'HEPA' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-400 font-medium">Cálculo de Atraso Indisponível</p>
                <p className="text-sm text-slate-500 max-w-md">
                  Os prontuários do SINAN para <strong>Hepatite A</strong> em nossa base não possuem o campo "Data dos Primeiros Sintomas" preenchido sistematicamente, o que torna impossível calcular matematicamente o tempo de resposta da vigilância para esta doença.
                </p>
              </>
            ) : (
              <p>Sem dados cronológicos suficientes para exibir a resposta da vigilância.</p>
            )}
          </div>
        ) : (
          <ResponsiveBar
            data={chartData}
            keys={['Laboratorial', 'Clínico-Epidem.', 'Sem Info']}
            indexBy="bucket"
            margin={{ top: 20, right: 130, bottom: 50, left: 80 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['#c026d3', '#f59e0b', '#475569']} // Fuchsia, Amber, Slate
            borderRadius={4}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
            defs={[
              {
                id: 'lines',
                type: 'patternLines',
                background: 'inherit',
                color: 'rgba(255, 255, 255, 0.15)',
                rotation: -45,
                lineWidth: 5,
                spacing: 10
              }
            ]}
            fill={[
              { match: { id: 'Laboratorial' }, id: 'lines' }
            ]}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Tempo de Resposta',
              legendPosition: 'middle',
              legendOffset: 40,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: isNormalized ? 'Porcentagem (%)' : 'Número de Casos',
              legendPosition: 'middle',
              legendOffset: -65,
            }}
            enableLabel={true}
            label={(d) => d.value > 0 ? (isNormalized ? `${d.value}%` : d.value.toLocaleString('pt-BR')) : ''}
            labelSkipWidth={20}
            labelSkipHeight={24}
            labelTextColor="#ffffff"
            tooltip={({ id, value, color }) => (
              <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <strong className="text-white">{id}:</strong>
                <span className="text-slate-300">{isNormalized ? `${value}%` : value.toLocaleString('pt-BR')}</span>
              </div>
            )}
            theme={{
              labels: { 
                text: { fontSize: 13, fontWeight: 800, fill: '#ffffff', textShadow: '0px 2px 4px rgba(0,0,0,0.8)' } 
              },
              axis: {
                ticks: { text: { fill: '#94a3b8', fontSize: 12, fontWeight: 600 } },
                legend: { text: { fill: '#cbd5e1', fontSize: 13, fontWeight: 600 } }
              },
              grid: { line: { stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' } },
              tooltip: {
                container: { background: '#0f172a', color: '#f8fafc', fontSize: '13px', borderRadius: '12px', border: '1px solid #334155' }
              }
            }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 14,
                symbolShape: 'circle',
                itemTextColor: '#cbd5e1',
                effects: [{ on: 'hover', style: { itemOpacity: 1, itemTextColor: '#ffffff' } }]
              }
            ]}
          />
        )}
      </div>
    </div>
  );
}
