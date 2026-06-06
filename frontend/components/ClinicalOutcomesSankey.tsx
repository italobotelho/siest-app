"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/app/services/api';
import { ResponsiveSankey } from '@nivo/sankey';

export default function ClinicalOutcomesSankey({ 
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
  const [ocultarSemInfo, setOcultarSemInfo] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/desfechos', { params: { doenca, ano: filtroAno, sexo: filtroSexo } })
      .then(res => {
        setDados(res.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados de desfechos:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  // Processamento para o Sankey
  const { nodes, links, stats } = useMemo(() => {
    if (!dados || dados.length === 0) return { nodes: [], links: [], stats: { totalConfirmados: 0, totalInternados: 0, totalObitos: 0 } };

    // Dicionários para consolidar links
    const linkMapC2H: Record<string, number> = {};
    const linkMapH2E: Record<string, number> = {};

    dados.forEach(r => {
      // 1. Mapeamento da Classificação
      let c = 'Ignorado';
      const cl = String(r.classificacao || '9');
      if (['1', '10', '11', '12', '13'].includes(cl)) c = 'Confirmado';
      else if (['2', '8'].includes(cl)) c = 'Descartado';
      else if (cl === '3') c = 'Investigação';

      // Filtro crucial de Inteligência: Só nos interessa a jornada de quem realmente foi CONFIRMADO.
      // O resto (descartado, ignorado) polui o gráfico sem agregar valor na análise de desfecho.
      if (c !== 'Confirmado') return;

      // 2. Mapeamento da Hospitalização
      let h = 'Sem Info (Internação)';
      const hp = String(r.hospitalizacao || '9');
      if (hp === '1') h = 'Internado';
      else if (hp === '2') h = 'Não Internado';

      // 3. Mapeamento da Evolução
      let e = 'Sem Info (Evolução)';
      const ev = String(r.evolucao || '9');
      if (ev === '1') e = 'Cura';
      else if (['2', '3'].includes(ev)) e = 'Óbito';
      else if (ev === '4') e = 'Óbito em Investigação';

      // Filtro Opcional: Se o usuário quiser ver apenas a "Jornada Conhecida"
      if (ocultarSemInfo) {
        if (h.includes('Sem Info') || e.includes('Sem Info')) return;
      }

      // Usando prefixos para evitar ciclos ou nós com mesmo nome em colunas diferentes
      const sourceC = `C_${c}`;
      const targetH = `H_${h}`;
      const sourceH = `H_${h}`;
      const targetE = `E_${e}`;

      const keyC2H = `${sourceC}|${targetH}`;
      const keyH2E = `${sourceH}|${targetE}`;

      linkMapC2H[keyC2H] = (linkMapC2H[keyC2H] || 0) + r.total;
      linkMapH2E[keyH2E] = (linkMapH2E[keyH2E] || 0) + r.total;
    });

    // Construir Nodes únicos e Links
    const uniqueNodes = new Set<string>();
    const finalLinks: any[] = [];

    let totalConfirmados = 0;
    let totalInternados = 0;
    let totalObitos = 0;

    Object.entries(linkMapC2H).forEach(([key, val]) => {
      if (val > 0) {
        const [source, target] = key.split('|');
        uniqueNodes.add(source);
        uniqueNodes.add(target);
        finalLinks.push({ source, target, value: val });
        
        if (source.includes('Confirmado')) totalConfirmados += val;
        if (target.includes('Internado') && !target.includes('Não') && !target.includes('Sem Info')) totalInternados += val;
      }
    });

    Object.entries(linkMapH2E).forEach(([key, val]) => {
      if (val > 0) {
        const [source, target] = key.split('|');
        uniqueNodes.add(source);
        uniqueNodes.add(target);
        finalLinks.push({ source, target, value: val });

        if (target.includes('Óbito') && !target.includes('Investigação')) totalObitos += val;
      }
    });

    const finalNodes = Array.from(uniqueNodes).map(id => {
      let color = '#64748b'; // Sem info (slate-500)
      if (id.includes('Confirmado')) color = '#3b82f6'; // blue-500
      else if (id.includes('Internado') && !id.includes('Não')) color = '#f59e0b'; // amber-500
      else if (id.includes('Não Internado')) color = '#10b981'; // emerald-500
      else if (id.includes('Cura')) color = '#14b8a6'; // teal-500
      else if (id.includes('Óbito')) color = '#ef4444'; // red-500

      return { id, color };
    });

    // Forçar a ordem de importância: Confirmado, Internado, Não Internado, Sem Info, Óbito, Cura...
    const ordem = ['Confirmado', 'Internado', 'Não Internado', 'Sem Info (Internação)', 'Óbito', 'Óbito em Investigação', 'Cura', 'Sem Info (Evolução)'];
    finalNodes.sort((a, b) => {
      const idA = a.id.replace(/^[CHE]_/, '');
      const idB = b.id.replace(/^[CHE]_/, '');
      let idxA = ordem.indexOf(idA);
      let idxB = ordem.indexOf(idB);
      if (idxA === -1) idxA = 99;
      if (idxB === -1) idxB = 99;
      return idxA - idxB;
    });

    return { 
      nodes: finalNodes, 
      links: finalLinks,
      stats: { totalConfirmados, totalInternados, totalObitos }
    };
  }, [dados, ocultarSemInfo]);

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden w-full flex flex-col transition-all min-h-[580px]";

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
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 opacity-80"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 relative z-10 gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Jornada Clínica (Desfechos)
          </h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Fluxo de Notificação → Internação → Evolução do Paciente
          </p>
        </div>
        
        {/* Toggle para filtrar ruído */}
        <button
          onClick={() => setOcultarSemInfo(!ocultarSemInfo)}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
            ocultarSemInfo 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
        >
          {ocultarSemInfo ? 'Mostrar Dados Faltantes' : 'Ocultar Dados Faltantes'}
        </button>
      </div>

      <div className="flex-1 w-full relative z-10 mt-4">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">Sem dados de desfecho para exibir.</div>
        ) : (
          <ResponsiveSankey
            data={{ nodes, links }}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            align="justify"
            sort="input"
            colors={(node) => node.color}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.1}
            nodeThickness={14}
            nodeSpacing={24}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={0.35}
            linkHoverOthersOpacity={0.1}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="inside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor="#ffffff"
            theme={{
              tooltip: {
                container: { background: '#0f172a', color: '#f8fafc', fontSize: '13px', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }
              },
              labels: { text: { fontSize: 13, fontWeight: 700, fill: '#fff', textShadow: '0px 2px 4px rgba(0,0,0,0.8)' } }
            }}
            valueFormat={(value) => Number(value).toLocaleString('pt-BR')}
            // Customizamos a label para remover o prefixo C_, H_, E_
            label={(node) => node.id.replace(/^[CHE]_/, '')}
          />
        )}
      </div>

      {/* Barra de Resumo Clínico para visualização imediata dos dados cruciais (difíceis de focar no hover) */}
      {!loading && nodes.length > 0 && stats && (
        <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-700/50 pt-4">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Confirmados</span>
            <span className="text-2xl font-bold text-blue-400">{stats.totalConfirmados.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-amber-900/20 rounded-xl p-3 border border-amber-700/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <span className="text-xs text-amber-500/70 font-semibold uppercase tracking-wider">Internações</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-500">{stats.totalInternados.toLocaleString('pt-BR')}</span>
              <span className="text-sm font-medium text-amber-400/60">
                ({stats.totalConfirmados > 0 ? ((stats.totalInternados / stats.totalConfirmados) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
          <div className="bg-rose-900/20 rounded-xl p-3 border border-rose-700/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <span className="text-xs text-rose-500/70 font-semibold uppercase tracking-wider">Óbitos Confirmados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-500">{stats.totalObitos.toLocaleString('pt-BR')}</span>
              <span className="text-sm font-medium text-rose-400/60">
                ({stats.totalConfirmados > 0 ? ((stats.totalObitos / stats.totalConfirmados) * 100).toFixed(2) : 0}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
