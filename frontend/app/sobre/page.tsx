import { Info, Database, Code, Target, Shield, Globe, Layers, Activity } from 'lucide-react';

export default function SobrePage() {
  return (
    <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Sobre o <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">SIEST</span>
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
          Conheça a arquitetura, metodologia científica e os impactos sociais por trás da Ferramenta de Inteligência Territorial desenvolvida para o município de Campinas.
        </p>
      </div>

      <div className="space-y-12">
        {/* Contexto e ODS */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/20 p-3 rounded-xl">
              <Target className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Objetivo e Impacto Social</h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              O <strong>SIEST</strong> nasceu da necessidade de mitigar crises epidemiológicas sazonais que afetam a saúde pública em Campinas, especialmente em áreas onde a limitação da infraestrutura urbana (núcleos de vulnerabilidade) converge com eventos climáticos extremos. A plataforma é direcionada à <strong>Gestão Pública</strong> e ao <strong>Terceiro Setor</strong> (como a Fundação FEAC).
            </p>
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl mt-4">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-emerald-400" /> Alinhamento com a ONU (ODS)
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                <li><strong className="text-slate-300">ODS 3 (Saúde e Bem-Estar):</strong> Mapeamento do fenômeno principal e gestão de sobrecarga do SUS.</li>
                <li><strong className="text-slate-300">ODS 6 (Água Potável e Saneamento):</strong> Correlação de surtos hídricos (Leptospirose, Hepatite) com a ausência de infraestrutura sanitária adequada.</li>
                <li><strong className="text-slate-300">ODS 13 (Ação Climática):</strong> Análise temporal de epidemias baseada no gatilho de precipitações extremas e ondas de calor.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Metodologia de Dados */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-rose-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-rose-500/20 p-3 rounded-xl">
              <Database className="h-6 w-6 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Engenharia de Dados (ETL) e LGPD</h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              O trabalho inicial de mineração, limpeza e cruzamento processou mais de <strong>410.846 microdados governamentais</strong> (série histórica de 2014 a 2026), estruturados em lotes (chunking) para lidar com restrições de memória. As bases de dados cruzadas contemplam:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <li className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <Activity className="h-5 w-5 text-rose-400 mb-2" />
                <span className="block font-bold text-white mb-1">Clínico</span>
                <span className="text-xs text-slate-400">Notificações e letalidade extraídas do <strong>SINAN/DATASUS</strong> via <em>PySUS</em>.</span>
              </li>
              <li className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <Layers className="h-5 w-5 text-teal-400 mb-2" />
                <span className="block font-bold text-white mb-1">Climático</span>
                <span className="text-xs text-slate-400">4.460 dias de aferições (chuva, temperatura, umidade) via portal <strong>Mosqlimate</strong> e <em>Pandas</em>.</span>
              </li>
              <li className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <Globe className="h-5 w-5 text-amber-400 mb-2" />
                <span className="block font-bold text-white mb-1">Socioespacial</span>
                <span className="text-xs text-slate-400">2.053 polígonos de risco do <strong>Portal Geoambiental</strong> processados via <em>GeoPandas</em>.</span>
              </li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex gap-3 items-start mt-4">
              <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-400 font-bold mb-1 text-sm">Privacidade e Ética (LGPD)</h3>
                <p className="text-sm text-amber-200/90 leading-relaxed">
                  Os microdados do SINAN já são nativamente anonimizados para omitir o local de residência exato dos pacientes, garantindo total conformidade com a LGPD. Diante da impossibilidade de traçar o trajeto físico dos bairros até as clínicas, o projeto inovou na modelagem analítica: adaptamos a Teoria dos Grafos para medir a Centralidade em Redes Bipartidas, mapeando o fluxo de <strong>"Perfis Epidemiológicos (Doenças/Idades)" para os "Hospitais de Destino"</strong>. Isso responde à mesma pergunta de negócio (descobrir hubs de sobrecarga) respeitando a limitação ética dos dados abertos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Arquitetura */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-teal-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-teal-500/20 p-3 rounded-xl">
              <Code className="h-6 w-6 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Arquitetura de Alta Performance</h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Em vez de sobrecarregar o cliente web com cálculos vetoriais pesados, a lógica analítica foi transferida para o núcleo do banco de dados, utilizando arquitetura de microsserviços.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-emerald-500">
                <strong className="block text-white mb-1">Banco de Dados (MongoDB)</strong>
                <span className="text-sm text-slate-400">Armazenamento escalável nativo para GeoJSON. Uso de <em>Aggregation Pipelines</em> pré-calculados na raiz do cluster.</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-blue-500">
                <strong className="block text-white mb-1">API Backend (Python/FastAPI)</strong>
                <span className="text-sm text-slate-400">Construído com Uvicorn. Implementa <em>Pydantic</em> e filtros globais usando RegEx (case-insensitive) diretamente na rota.</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-indigo-500 sm:col-span-2">
                <strong className="block text-white mb-1">Frontend Interativo (React/Next.js)</strong>
                <span className="text-sm text-slate-400">
                  Aplicação client-side orientada a performance consumindo via <em>Axios</em>. Renderização de mapas cruzados multicamadas via <strong>React-Leaflet</strong>, gráficos interativos via <strong>Recharts e Nivo</strong>, e simulação baseada em física de partículas para as redes hospitalares usando <strong>React-Force-Graph-2D</strong>.
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
