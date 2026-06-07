"use client";

import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export default function DemographicPyramid({ 
  doenca,
  filtroAno = null,
}: { 
  doenca: string;
  filtroAno?: number | null;
}) {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroIdades, setFiltroIdades] = useState<string>('');
  const [debounceIdades, setDebounceIdades] = useState<string>('');

  // Debounce para não bater na API a cada tecla digitada
  useEffect(() => {
    const timer = setTimeout(() => setDebounceIdades(filtroIdades), 500);
    return () => clearTimeout(timer);
  }, [filtroIdades]);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/piramide-etaria', { 
      params: { 
        doenca, 
        ano: filtroAno,
        filtro_idades: debounceIdades 
      } 
    })
      .then(res => {
        setDados(res.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados para pirâmide etária:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, debounceIdades]);

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden flex flex-col w-full";

  const tooltipStyle = { 
    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
    borderColor: 'rgba(51, 65, 85, 0.5)', 
    color: '#f8fafc', 
    borderRadius: '12px', 
    backdropFilter: 'blur(8px)', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    padding: '12px'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p className="text-white font-bold mb-2 pb-1 border-b border-slate-700">{label}</p>
          {payload.map((entry: any, index: number) => {
            const valor = Math.abs(entry.value);
            const nome = entry.dataKey === 'M' ? 'Masculino' : 'Feminino';
            const cor = entry.dataKey === 'M' ? '#0ea5e9' : '#d946ef';
            
            return (
              <p key={`item-${index}`} className="text-sm flex justify-between gap-4 py-1">
                <span style={{ color: cor }} className="font-semibold">{nome}:</span>
                <span className="text-slate-200">{valor.toLocaleString('pt-BR')} casos</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (tickItem: any) => {
    const num = Math.abs(tickItem);
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className={cardClass}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-fuchsia-500 opacity-50"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Pirâmide Etária de Casos</h3>
          <p className="text-sm text-slate-400 mt-1">
            Distribuição demográfica da doença comparando os sexos Masculino e Feminino por faixa etária.
          </p>
        </div>
        
        <div className="relative shrink-0 w-full md:w-64">
          <input 
            type="text" 
            placeholder="Ex: 25, 30-40" 
            value={filtroIdades}
            onChange={(e) => setFiltroIdades(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 shadow-inner"
          />
          <span className="absolute right-3 top-2.5 text-slate-500 text-xs pointer-events-none">Filtro avançado</span>
        </div>
      </div>

      <div className="flex-grow w-full h-[400px]">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-slate-800/30 rounded-xl"></div>
        ) : dados.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 italic bg-slate-800/20 rounded-xl border border-slate-700/30">
            Nenhum dado encontrado para o filtro: {filtroIdades}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={dados}
              margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
              stackOffset="sign"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={true} opacity={0.3} />
              
              <XAxis 
                type="number" 
                stroke="#94a3b8" 
                tick={{fontSize: 12, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={formatXAxis}
              />
              
              <YAxis 
                dataKey="faixa_etaria" 
                type="category" 
                stroke="#94a3b8" 
                tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} 
                axisLine={false} 
                tickLine={false}
                width={90}
              />
              
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                {...({
                  payload: [
                    { value: 'Feminino', type: 'circle', color: '#d946ef' },
                    { value: 'Masculino', type: 'circle', color: '#0ea5e9' }
                  ]
                } as any)}
              />
              
              <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
              
              <Bar dataKey="F" name="Feminino" fill="#d946ef" stackId="stack" radius={[4, 0, 0, 4]}>
                {dados.map((entry, index) => (
                  <Cell key={`cell-f-${index}`} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="M" name="Masculino" fill="#0ea5e9" stackId="stack" radius={[0, 4, 4, 0]}>
                {dados.map((entry, index) => (
                  <Cell key={`cell-m-${index}`} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
