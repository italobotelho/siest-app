"use client";

import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import { ResponsiveSunburst } from '@nivo/sunburst';

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
    // Simular busca de dados demográficos profundos
    api.get('/dashboard/dinamico', { params: { doenca, ano: filtroAno, sexo: filtroSexo } })
      .then(res => {
        const { sexo = [], faixa_etaria = [] } = res.data;
        
        // Se a API não retornou dados suficientes, criamos estrutura vazia
        if (sexo.length === 0 && faixa_etaria.length === 0) {
          setDados({ name: "Sem Dados", children: [] });
          setLoading(false);
          return;
        }

        const totalFaixaEtaria = faixa_etaria.reduce((acc: number, curr: any) => acc + (curr.total_casos || 0), 0) || 1;

        const treeData = {
          name: doenca || "Geral",
          color: "hsl(210, 20%, 30%)",
          children: sexo.map((s: any, i: number) => {
            const isFem = s.sexo === 'F' || s.sexo === 'FEMININO';
            const baseColor = isFem ? 340 : 210;
            return {
              name: s.sexo || "Desconhecido",
              color: `hsl(${baseColor}, 70%, 50%)`,
              children: faixa_etaria.map((f: any, j: number) => {
                // Aproximação estatística assumindo distribuição independente (já que o facet não vem aninhado)
                const propFaixa = (f.total_casos || 0) / totalFaixaEtaria;
                const casosEstimados = Math.round(propFaixa * (s.total_casos || 0));
                return {
                  name: f.faixa_etaria || "N/I",
                  color: `hsl(${baseColor}, ${60 - (j * 5)}%, ${60 + (j * 5)}%)`,
                  loc: casosEstimados
                };
              }).filter((c: any) => c.loc > 0)
            };
          })
        };

        setDados(treeData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados do sunburst:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden w-full h-[600px] flex flex-col";

  return (
    <div className={cardClass}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-50"></div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Exploração Demográfica Profunda (Sunburst)</h3>
      <p className="text-sm text-slate-400 mb-4">Clique nos anéis para fazer Drill-down (Doença → Sexo → Faixa Etária).</p>
      
      {loading || !dados ? (
        <div className="flex-1 w-full animate-pulse bg-slate-800/50 rounded-xl"></div>
      ) : (
        <div className="flex-1 w-full text-black">
          <ResponsiveSunburst
            data={dados}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            id="name"
            value="loc"
            cornerRadius={2}
            borderColor={{ theme: 'background' }}
            colors={{ datum: 'data.color' }}
            animate={false}
            childColor={{ from: 'color', modifiers: [ [ 'brighter', 0.15 ] ] }}
            borderWidth={2}
            enableArcLabels={true}
            arcLabel="id"
            arcLabelsSkipAngle={12}
            arcLabelsTextColor="#ffffff"
            tooltip={({ id, value, color }) => (
              <div className="bg-slate-800 text-white p-2 rounded shadow-lg text-sm border border-slate-700">
                <strong style={{ color }}>{id}</strong>: {Math.round(value)} casos
              </div>
            )}
            theme={{
              labels: { text: { fontSize: 12, fontWeight: 'bold' } },
            }}
          />
        </div>
      )}
    </div>
  );
}
