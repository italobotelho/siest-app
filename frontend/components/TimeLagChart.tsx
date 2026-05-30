"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/app/services/api';
import { 
  ComposedChart, Line, Bar, Brush, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function TimeLagChart({ doenca }: { doenca: string }) {
  const [dados, setDados] = useState<any[]>([]);
  const [lagSemanas, setLagSemanas] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/temporal', { params: { doenca, granularidade: 'semana' } })
      .then(res => {
        // Formatar e adicionar dados climáticos mockados se a API ainda não os trouxer
        const formatado = res.data
          .sort((a: any, b: any) => {
            if (a.ano !== b.ano) return a.ano - b.ano;
            return a.semana - b.semana;
          })
          .map((item: any) => ({
            ...item,
            data_formatada: `SE ${String(item.semana).padStart(2, '0')}/${item.ano}`,
            // Usar os dados reais vindos da agregação, convertendo para número para o Recharts não cortar os eixos
            precipitacao: Number(item.precipitacao_total) || 0,
            temperatura: Number(item.temperatura_media) || 0,
            umidade: Number(item.umidade_media) || 0,
          }));
        
        setDados(formatado);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados temporais:", error);
        setLoading(false);
      });
  }, [doenca]);

  // Função para calcular o lag sob demanda para o gráfico (evita recriar o array de dados)
  // Isso garante que o Brush NUNCA resete, pois a prop data={dados} nunca muda a referência de memória!
  const getCasosDeslocados = (item: any) => {
    const index = dados.indexOf(item);
    if (index === -1) return 0;
    
    // Deslocamento é exato na unidade semanal
    const indexAlvo = index + lagSemanas;
    
    const floorIndex = Math.floor(indexAlvo);
    const ceilIndex = Math.ceil(indexAlvo);
    const fracao = indexAlvo - floorIndex;
    
    let casos_deslocados = 0;
    if (floorIndex >= 0 && floorIndex < dados.length) {
      const casosFloor = dados[floorIndex]?.total_casos || 0;
      if (ceilIndex < dados.length && ceilIndex !== floorIndex) {
        const casosCeil = dados[ceilIndex]?.total_casos || 0;
        casos_deslocados = casosFloor * (1 - fracao) + casosCeil * fracao;
      } else {
        casos_deslocados = casosFloor;
      }
    }
    
    return casos_deslocados;
  };

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden";
  const tooltipStyle = { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(51, 65, 85, 0.5)', color: '#f8fafc', borderRadius: '12px', backdropFilter: 'blur(8px)' };

  return (
    <div className={cardClass}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-50"></div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Análise de Defasagem (Time Lag)</h3>
      <p className="text-sm text-slate-400 mb-6">Compare picos de chuva, temperatura e <strong className="text-indigo-400">umidade</strong> com a explosão de casos ajustando o tempo de resposta. O lag ocorre porque a chuva cria criadouros e a <strong>alta umidade prolonga o tempo de vida do mosquito adulto</strong>, aumentando a janela de transmissão semanas depois.</p>
      
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
        <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">
          Deslocamento Temporal (Lag): <span className="text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded ml-1">{lagSemanas} semanas</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="8" 
          step="1"
          value={lagSemanas} 
          onChange={(e) => setLagSemanas(parseInt(e.target.value))}
          className="w-full md:w-64 accent-cyan-500"
        />
        <p className="text-xs text-slate-500 ml-auto hidden md:block">Arraste para alinhar o clima com os picos de infecção.</p>
      </div>

      {loading ? (
        <div className="h-[500px] w-full animate-pulse bg-slate-800/50 rounded-xl"></div>
      ) : (
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 10, right: 10, bottom: 5, left: 20 }}>
              <defs>
                <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis dataKey="data_formatada" stroke="#94a3b8" tick={{fontSize: 12}} minTickGap={30} />
              
              <YAxis 
                yAxisId="left" 
                stroke="#06b6d4" 
                tick={{fontSize: 12}} 
                orientation="left" 
                width={80}
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.1))]}
              />
              <YAxis 
                key={`yaxis-right-${lagSemanas}`}
                yAxisId="right" 
                stroke="#f43f5e" 
                tick={{fontSize: 12}} 
                orientation="right" 
                width={80}
              />
              {/* Eixos invisíveis para temperatura e umidade não serem achatadas */}
              <YAxis yAxisId="temp" type="number" domain={[0, 45]} hide={true} />
              <YAxis yAxisId="humidity" type="number" domain={[0, 100]} hide={true} />

              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ paddingBottom: '20px' }} 
                formatter={(value) => {
                  const color = value.includes('Chuva') ? '#06b6d4' : (value.includes('Temp') ? '#f59e0b' : (value.includes('Umidade') ? '#8b5cf6' : '#f43f5e'));
                  return <span style={{ color, fontWeight: 500 }}>{value}</span>;
                }}
              />
              
              <Bar yAxisId="left" dataKey="precipitacao" name="Volume de Chuva (mm)" fill="url(#colorPrecip)" radius={[4, 4, 0, 0]} barSize={8} opacity={0.7} />
              <Line yAxisId="temp" type="monotone" dataKey="temperatura" name="Temperatura (°C)" stroke="#f59e0b" strokeWidth={2} opacity={0.5} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="humidity" type="monotone" dataKey="umidade" name="Umidade Média (%)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" opacity={0.7} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey={getCasosDeslocados} name={`Casos (Lag: ${lagSemanas} sem)`} stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
              
              <Brush 
                dataKey="data_formatada" 
                height={30} 
                stroke="#475569" 
                fill="#0f172a"
                tickFormatter={() => ''}
                startIndex={dados.length > 52 ? dados.length - 52 : 0}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
