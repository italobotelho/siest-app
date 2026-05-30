"use client";

import { useEffect, useState } from 'react';
import api from '@/app/services/api';
import { Activity, Thermometer, Users, PlusCircle } from 'lucide-react';

interface ResumoData {
  casos: {
    total_casos: number;
    media_idade: number | string;
    total_hospitalizados: number | string;
    total_unidades: number | string;
  };
  clima: {
    media_temperatura: number;
    total_precipitacao: number;
  };
}

export default function DashboardMetrics({ doenca, filtroAno, filtroSexo }: { doenca: string, filtroAno?: number | null, filtroSexo?: string | null }) {
  const [dados, setDados] = useState<ResumoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = { doenca };
    if (filtroAno) params.ano = filtroAno;
    if (filtroSexo) params.sexo = filtroSexo;
    
    api.get('/dashboard/resumo', { params })
      .then(response => {
        setDados(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar resumo:", error);
        setLoading(false);
      });
  }, [doenca, filtroAno, filtroSexo]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl h-[104px] animate-pulse"></div>
      ))}
    </div>
  );
  
  if (!dados || !dados.casos) return <div className="text-slate-500 text-center p-10 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">Sem dados gerais para este filtro.</div>;

  const formatarNumero = (valor: number | string) => {
    return typeof valor === 'number' ? valor.toLocaleString('pt-PT') : valor;
  };

  const cardClass = "bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-lg flex items-center space-x-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/50 group";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <div className={cardClass}>
        <div className="p-3.5 bg-rose-500/10 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(225,29,72,0.1)] group-hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]">
          <Activity size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-400 font-medium">Total de Casos</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatarNumero(dados.casos.total_casos)}</h3>
        </div>
      </div>

      <div className={cardClass}>
        <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <PlusCircle size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-400 font-medium">Hospitalizações</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatarNumero(dados.casos.total_hospitalizados)}</h3>
        </div>
      </div>

      <div className={cardClass}>
        <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Users size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-400 font-medium">Média de Idade</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {dados.casos.media_idade} {typeof dados.casos.media_idade === 'number' && <span className="text-lg font-normal text-slate-400">anos</span>}
          </h3>
        </div>
      </div>

      <div className={cardClass}>
        <div className="p-3.5 bg-teal-500/10 text-teal-400 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(20,184,166,0.1)] group-hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]">
          <Thermometer size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-400 font-medium">Temp. Média</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {dados.clima.media_temperatura} <span className="text-lg font-normal text-slate-400">°C</span>
          </h3>
        </div>
      </div>
    </div>
  );
}