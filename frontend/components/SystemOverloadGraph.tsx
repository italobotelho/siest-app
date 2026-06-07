"use client";

import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import api from '@/app/services/api';

export default function SystemOverloadGraph({ 
  doenca,
  filtroAno = null,
  filtroSexo = null 
}: { 
  doenca?: string, 
  filtroAno?: number | null, 
  filtroSexo?: string | null 
}) {
  const [dados, setDados] = useState<any>(null);
  const [modoOrigem, setModoOrigem] = useState<'doenca' | 'faixa_etaria'>('doenca');
  const [maxTargets, setMaxTargets] = useState<number>(20); // Valor padrão: 20
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/grafo-sobrecarga', {
      params: {
        modo_origem: modoOrigem,
        doenca,
        ano: filtroAno,
        sexo: filtroSexo
      }
    })
      .then(res => setDados(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [modoOrigem, doenca, filtroAno, filtroSexo]);

  const option = useMemo(() => {
    if (!dados || !dados.nodes || !dados.links || dados.nodes.length === 0) {
      return {};
    }

    let sources = dados.nodes.filter((n: any) => n.group === 'source').sort((a: any, b: any) => b.val - a.val);
    let targets = dados.nodes.filter((n: any) => n.group === 'target').sort((a: any, b: any) => b.val - a.val);

    // Filtrar Top Hospitais com base no input do usuário
    if (targets.length > maxTargets && maxTargets > 0) {
      targets = targets.slice(0, maxTargets);
    }
    
    const validTargets = new Set(targets.map((t: any) => t.id));
    const validLinks = dados.links.filter((l: any) => validTargets.has(l.target));
    const validSources = new Set(validLinks.map((l: any) => l.source));
    sources = sources.filter((s: any) => validSources.has(s.id));

    // Determinar min/max para normalização
    const allVals = [...sources, ...targets].map(n => n.val);
    const maxVal = Math.max(...allVals, 1);
    const minVal = Math.min(...allVals, 0);

    // Posicionamento Radial (Origens no Centro, Destinos em um Círculo Externo)
    const eNodes: any[] = [];
    
    // Distribuir origens no Centro
    // Se for apenas 1 origem (muito comum em Doença), fica exatamente no (0,0)
    // Se forem várias, formam um círculo interno pequeno
    const innerRadius = sources.length === 1 ? 0 : 200;
    sources.forEach((n: any, idx: number) => {
      const angle = (idx / sources.length) * 2 * Math.PI;
      eNodes.push({
        id: n.id,
        name: n.name,
        x: innerRadius === 0 ? 0 : Math.cos(angle) * innerRadius,
        y: innerRadius === 0 ? 0 : Math.sin(angle) * innerRadius,
        symbolSize: Math.max(30, Math.min(100, (n.val / maxVal) * 100)),
        itemStyle: {
          color: modoOrigem === 'doenca' ? '#3b82f6' : '#10b981',
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowBlur: 20,
          shadowColor: modoOrigem === 'doenca' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(16, 185, 129, 0.6)'
        },
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontWeight: 'bold',
          formatter: (params: any) => `${params.data.name}\n(${Number(params.data.value).toLocaleString('pt-BR')})`
        },
        value: n.val,
        category: 0
      });
    });

    // Distribuir destinos (Hospitais) em um grande Círculo Externo
    const outerRadius = 800; // Raio grande para espalhar bem as dezenas de hospitais
    targets.forEach((n: any, idx: number) => {
      // Começamos o ângulo deslocado para não ficar reto
      const angle = (idx / targets.length) * 2 * Math.PI - Math.PI / 2;
      eNodes.push({
        id: n.id,
        name: n.name,
        x: Math.cos(angle) * outerRadius,
        y: Math.sin(angle) * outerRadius,
        symbolSize: Math.max(15, Math.min(45, (n.val / maxVal) * 45)),
        itemStyle: {
          color: '#ef4444',
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 10,
          shadowColor: 'rgba(239, 68, 68, 0.5)'
        },
        label: {
          show: true,
          position: Math.cos(angle) > 0 ? 'right' : 'left',
          color: '#cbd5e1',
          formatter: `{b}`
        },
        value: n.val,
        category: 1
      });
    });

    // Processar Links com Curvas Suaves
    const maxLinkVal = Math.max(...validLinks.map((l: any) => l.value), 1);
    const eLinks = validLinks.map((l: any) => ({
      source: l.source,
      target: l.target,
      value: l.value,
      lineStyle: {
        width: Math.max(1, Math.min(15, (l.value / maxLinkVal) * 15)),
        curveness: 0.3, // Curva suave clássica
        opacity: 0.4,
        color: modoOrigem === 'doenca' ? '#60a5fa' : '#34d399'
      }
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `<div style="font-weight:bold;margin-bottom:4px;">Fluxo de Pacientes</div>
                    ${params.data.source} ➔ ${params.data.target}<br/>
                    <span style="color:#f43f5e;font-weight:bold;">${Number(params.data.value).toLocaleString('pt-BR')} casos</span>`;
          }
          return `<div style="font-weight:bold;margin-bottom:4px;">${params.data.name}</div>
                  Total Envolvido: <span style="color:#f43f5e;font-weight:bold;">${Number(params.data.value).toLocaleString('pt-BR')} casos</span>`;
        }
      },
      series: [
        {
          type: 'graph',
          layout: 'none', // Nós têm coordenadas fixas
          draggable: true, // Permite mover os nós livremente
          data: eNodes,
          links: eLinks,
          roam: true,
          label: {
            show: true
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [4, 10],
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 10,
              opacity: 1
            }
          }
        }
      ]
    };
  }, [dados, modoOrigem, maxTargets]);

  return (
    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700/50 shadow-lg backdrop-blur-sm w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Grafo de Relacionamento Radial</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Visualize as conexões diretas entre os perfis dos pacientes (Centro) e os Hospitais (Borda). A espessura da linha representa o volume do fluxo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            <label className="text-sm text-slate-400 font-medium px-2">Top Hospitais:</label>
            <input 
              type="number" 
              min="1" 
              max="200" 
              value={maxTargets} 
              onChange={(e) => setMaxTargets(Number(e.target.value))}
              className="w-16 bg-slate-700 text-white text-sm rounded border border-slate-600 px-2 py-1 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setModoOrigem('doenca')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                modoOrigem === 'doenca'
                  ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              Origem: Doenças
            </button>
            <button
              onClick={() => setModoOrigem('faixa_etaria')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                modoOrigem === 'faixa_etaria'
                  ? 'bg-emerald-600 text-white shadow-sm border border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              Origem: Idade
            </button>
          </div>
        </div>
      </div>

      <div className="h-[600px] w-full bg-slate-950/50 rounded-xl border border-slate-800 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {!loading && option && Object.keys(option).length > 0 ? (
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            theme="dark"
          />
        ) : (
          !loading && (
            <div className="h-full flex items-center justify-center text-slate-500">
              Nenhum dado de relacionamento encontrado.
            </div>
          )
        )}
      </div>
    </div>
  );
}
