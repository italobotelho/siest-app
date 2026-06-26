import Link from 'next/link';
import { Activity, BarChart2, Map, ShieldAlert, Zap, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold mb-8 backdrop-blur-sm">
            <Activity className="h-4 w-4" />
            <span>Monitoramento Epidemiológico • Município de Campinas (SP)</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 max-w-4xl leading-tight">
            Inteligência <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Epidemiológica</span> de Campinas
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            O SIEST é uma plataforma avançada para visualização e análise de surtos epidemiológicos, 
            desenvolvida especificamente para o município de <strong>Campinas - SP</strong>. A ferramenta integra dados climáticos, geoespaciais e de capacidade hospitalar local para embasar decisões de saúde pública.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/dashboard" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center justify-center gap-2"
            >
              <BarChart2 className="h-5 w-5" />
              Explorar o Painel de Dados
            </Link>
            <Link 
              href="/sobre" 
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Layers className="h-5 w-5" />
              Entenda a Metodologia
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-950 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Dimensões de Análise</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Nossa plataforma cruza múltiplas fontes de dados para fornecer uma visão holística 
              e acionável sobre o cenário de saúde regional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors group">
              <div className="bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <BarChart2 className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Séries Históricas</h3>
              <p className="text-slate-400 leading-relaxed">
                Acompanhe a evolução de doenças como Dengue, Zika e Chikungunya ao longo do tempo, identificando picos e sazonalidades.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors group">
              <div className="bg-rose-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-500/20 transition-colors">
                <Map className="h-7 w-7 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Inteligência Geoespacial</h3>
              <p className="text-slate-400 leading-relaxed">
                Mapas de calor e distribuição demográfica que revelam o comportamento territorial das infecções bairro a bairro.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors group">
              <div className="bg-amber-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                <ShieldAlert className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sobrecarga Hospitalar</h3>
              <p className="text-slate-400 leading-relaxed">
                Grafos direcionais que mostram o fluxo de pacientes e identificam unidades de saúde sob risco de colapso de atendimento.
              </p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors group lg:col-span-3">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="bg-teal-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                    <Zap className="h-7 w-7 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Correlação Climática</h3>
                  <p className="text-slate-400 leading-relaxed">
                    O SIEST integra dados de precipitação e temperatura, aplicando análises de Data-Lag (defasagem de tempo) para provar a correlação estatística entre o clima e os surtos epidemiológicos, permitindo planejamento antecipado.
                  </p>
                </div>
                <div className="hidden md:block flex-1 bg-slate-950 rounded-2xl border border-slate-800 h-48 w-full p-4 relative overflow-hidden">
                   {/* Decorative fake chart */}
                   <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-teal-500/20 to-transparent"></div>
                   <svg className="w-full h-full text-teal-500/50" preserveAspectRatio="none" viewBox="0 0 100 100">
                     <path d="M0,100 L0,80 Q25,90 50,60 T100,30 L100,100 Z" fill="currentColor" opacity="0.3"></path>
                     <path d="M0,80 Q25,90 50,60 T100,30" fill="none" stroke="currentColor" strokeWidth="2"></path>
                   </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="bg-slate-900 border-t border-slate-800 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Fontes de Dados Abertos</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              A transparência é o pilar deste projeto. Todos os dados processados e cruzados pelo SIEST 
              são provenientes de repositórios oficiais e públicos do governo brasileiro e municipal.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <a 
              href="https://datasus.saude.gov.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group max-w-sm w-full md:w-auto"
            >
              <div className="w-12 h-12 shrink-0 bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500/20">
                <Activity className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="text-left flex flex-col items-start">
                <h4 className="text-white font-bold text-base">SINAN & CNES</h4>
                <p className="text-slate-500 text-sm mb-2">Notificações Clínicas</p>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                  Extração: PySUS
                </span>
              </div>
            </a>

            <a 
              href="https://mosqlimate.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-teal-500/50 hover:bg-slate-800/50 transition-all group max-w-sm w-full md:w-auto"
            >
              <div className="w-12 h-12 shrink-0 bg-teal-500/10 rounded-full flex items-center justify-center group-hover:bg-teal-500/20">
                <Zap className="h-6 w-6 text-teal-400" />
              </div>
              <div className="text-left flex flex-col items-start">
                <h4 className="text-white font-bold text-base">Mosqlimate</h4>
                <p className="text-slate-500 text-sm mb-2">Série Histórica Climática</p>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 bg-teal-500/10 px-2 py-1 rounded border border-teal-500/20">
                  Extração: Pandas
                </span>
              </div>
            </a>

            <a 
              href="https://geoambiental.campinas.sp.gov.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-rose-500/50 hover:bg-slate-800/50 transition-all group max-w-sm w-full md:w-auto"
            >
              <div className="w-12 h-12 shrink-0 bg-rose-500/10 rounded-full flex items-center justify-center group-hover:bg-rose-500/20">
                <Map className="h-6 w-6 text-rose-400" />
              </div>
              <div className="text-left flex flex-col items-start">
                <h4 className="text-white font-bold text-base">Portal Geoambiental</h4>
                <p className="text-slate-500 text-sm mb-2">Polígonos de Risco (Campinas)</p>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                  Extração: GeoPandas
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
