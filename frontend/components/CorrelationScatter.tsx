"use client";

import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ResponsiveContainer, Cell, ReferenceArea, Label, ReferenceLine
} from 'recharts';

export default function CorrelationScatter({ 
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
    api.get('/dashboard/temporal', { params: { doenca, ano: filtroAno, sexo: filtroSexo } })
      .then(res => {
        const dadosReais = res.data.map((item: any) => ({
          mes_id: `${String(item.mes).padStart(2, '0')}/${item.ano}`,
          precipitacao: item.precipitacao_total || 0,
          temperatura: item.temperatura_media || 0,
          umidade: item.umidade_media || 0,
          casos: item.total_casos || 0,
          estacao: getEstacao(item.mes)
        }));
        
        setDados(dadosReais);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados para scatter:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  const getEstacao = (mes: number) => {
    if (mes >= 12 || mes <= 2) return 0; // Verão
    if (mes >= 3 && mes <= 5) return 1; // Outono
    if (mes >= 6 && mes <= 8) return 2; // Inverno
    return 3; // Primavera
  };

  const coresEstacao = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']; 
  const nomesEstacao = ['Verão', 'Outono', 'Inverno', 'Primavera'];

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const estacaoNome = nomesEstacao[data.estacao];
      const estacaoColor = coresEstacao[data.estacao];

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold text-lg mb-1 border-b border-slate-700 pb-1">Mês: {data.mes_id}</p>
          <div className="space-y-1 mt-2">
            <p className="text-rose-400 text-sm font-semibold">Casos Registrados: <span className="text-slate-200 font-normal">{data.casos ?? 0}</span></p>
            <p className="text-sky-400 text-sm font-semibold">Chuva Acumulada: <span className="text-slate-200 font-normal">{data.precipitacao?.toFixed(1) ?? '0.0'} mm</span></p>
            <p className="text-orange-400 text-sm font-semibold">Temp. Média: <span className="text-slate-200 font-normal">{data.temperatura?.toFixed(1) ?? '0.0'} °C</span></p>
            <p className="text-indigo-400 text-sm font-semibold">Umidade Média: <span className="text-slate-200 font-normal">{data.umidade?.toFixed(1) ?? '0.0'} %</span></p>
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: estacaoColor }}></span>
              <span className="text-xs text-slate-300">{estacaoNome}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Limiares fixos para a matriz de risco
  const LIMIAR_TEMP = 22;
  const LIMIAR_CHUVA = 150;
  
  // Bordas do gráfico para garantir que as áreas sejam desenhadas até o final
  const MIN_TEMP = 12;
  const MAX_TEMP = 32;
  const MIN_CHUVA = 0;
  const MAX_CHUVA = 1500;

  // No painel, as doenças são passadas como IDs: '', 'DENG', 'ZIKA', 'CHIK', 'LEPT', 'HEPA'
  // Vazio ('') = Geral (Todas). Como Dengue é a esmagadora maioria, mantemos a matriz de arbovirose ativada pro Geral.
  const isArbovirose = ['', 'deng', 'zika', 'chik'].includes(doenca.toLowerCase());
  const isChik = doenca.toLowerCase() === 'chik';

  return (
    <div className={cardClass}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-50"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {isArbovirose ? 'Matriz de Ação (Risco Sócio-Climático)' : 'Correlação Clima vs Surtos'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {isArbovirose 
              ? 'Esta matriz classifica o risco de epidemia com base no clima. A linha vertical (22°C) e a horizontal (150mm) dividem o cenário em quadrantes de risco para o vetor. Meses no quadrante de Perigo Extremo historicamente apresentam os maiores surtos.'
              : 'Dispersão histórica dos meses baseada em temperatura e precipitação. Diferente das arboviroses, a sazonalidade climática desta doença pode ter outros gatilhos (como apenas enchentes agudas ou contaminação hídrica).'}
          </p>
          
          {isChik && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm p-3.5 rounded-xl flex items-start gap-3 max-w-4xl shadow-sm">
              <span className="text-blue-400 text-lg">💡</span>
              <p>
                <strong className="text-blue-300">Insight Atípico:</strong> O gráfico mostra que a Chikungunya apresentou surtos severos em meses de <strong>Inverno (Zona Segura)</strong>. Isso contraria o padrão térmico clássico do mosquito e indica que epidemias passadas se sustentaram mesmo no frio, possivelmente devido a criadouros intradomiciliares protegidos ou introdução do vírus fora de época.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 inline-flex items-center">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Verão</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Outono</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Inverno</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Primavera</div>
            <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-slate-600">
              <div className="w-4 h-4 rounded-full border-2 border-slate-400/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400/50"></div>
              </div> 
              Tamanho = Casos
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[550px] w-full animate-pulse bg-slate-800/50 rounded-xl"></div>
      ) : (
        <div className="h-[550px] w-full relative bg-slate-900/50 rounded-xl border border-slate-700/50 p-2 pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                type="number" 
                dataKey="temperatura" 
                name="Temperatura" 
                stroke="#94a3b8" 
                tick={{fontSize: 12}}
                tickCount={6}
                domain={[MIN_TEMP, MAX_TEMP]} 
                label={{ value: 'Temperatura Média (°C)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
              />
              <YAxis 
                type="number" 
                dataKey="precipitacao" 
                name="Chuva" 
                stroke="#94a3b8" 
                tick={{fontSize: 12}} 
                allowDecimals={false}
                domain={[MIN_CHUVA, MAX_CHUVA]} 
                label={{ value: 'Precipitação Mensal (mm)', angle: -90, position: 'insideLeft', offset: 0, fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
              />
              <ZAxis type="number" dataKey="casos" range={[50, 3000]} name="Casos" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              
              {isArbovirose && (
                <>
                  <ReferenceArea x1={MIN_TEMP} x2={LIMIAR_TEMP} y1={MIN_CHUVA} y2={LIMIAR_CHUVA} fill="#10b981" fillOpacity={0.05}>
                    <Label value="ZONA SEGURA" position="insideBottomLeft" fill="#10b981" opacity={0.6} fontSize={13} fontWeight="bold" offset={20} />
                  </ReferenceArea>
                  
                  <ReferenceArea x1={LIMIAR_TEMP} x2={MAX_TEMP} y1={MIN_CHUVA} y2={LIMIAR_CHUVA} fill="#f59e0b" fillOpacity={0.05}>
                    <Label value="ALERTA CALOR" position="insideBottomRight" fill="#f59e0b" opacity={0.6} fontSize={13} fontWeight="bold" offset={20} />
                  </ReferenceArea>
                  
                  <ReferenceArea x1={MIN_TEMP} x2={LIMIAR_TEMP} y1={LIMIAR_CHUVA} y2={MAX_CHUVA} fill="#f59e0b" fillOpacity={0.05}>
                    <Label value="ALERTA CHUVA" position="insideTopLeft" fill="#f59e0b" opacity={0.6} fontSize={13} fontWeight="bold" offset={20} />
                  </ReferenceArea>
                  
                  <ReferenceArea x1={LIMIAR_TEMP} x2={MAX_TEMP} y1={LIMIAR_CHUVA} y2={MAX_CHUVA} fill="#e11d48" fillOpacity={0.1}>
                    <Label value="PERIGO EXTREMO" position="insideTopRight" fill="#e11d48" opacity={0.6} fontSize={13} fontWeight="bold" offset={20} />
                  </ReferenceArea>

                  <ReferenceLine x={LIMIAR_TEMP} stroke="#64748b" strokeDasharray="5 5" opacity={0.5}>
                    <Label value={`${LIMIAR_TEMP} °C`} position="insideTopLeft" fill="#94a3b8" fontSize={11} opacity={0.8} />
                  </ReferenceLine>
                  <ReferenceLine y={LIMIAR_CHUVA} stroke="#64748b" strokeDasharray="5 5" opacity={0.5}>
                    <Label value={`${LIMIAR_CHUVA} mm`} position="insideTopLeft" fill="#94a3b8" fontSize={11} opacity={0.8} />
                  </ReferenceLine>
                </>
              )}

              <Scatter name="Meses" data={dados} isAnimationActive={false} shape="circle">
                {dados.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={coresEstacao[entry.estacao]} opacity={0.85} stroke="#0f172a" strokeWidth={1.5} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
