import Link from 'next/link';
import { Activity, Mail, Database, AlertCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30">
                <Activity className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
                SIEST
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Sistema de Inteligência Epidemiológica e Socio-Territorial para monitoramento de doenças e capacidade clínica.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/italobotelho/PI2026.1" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="mailto:contato@siest.puc.br" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Navegação</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Início</Link></li>
              <li><Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">Painel de Dados</Link></li>
              <li><Link href="/sobre" className="text-slate-400 hover:text-white text-sm transition-colors">Sobre o Projeto</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              Transparência de Dados
            </h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Os dados apresentados neste painel são extraídos de bases públicas e parceiras (SINAN/DATASUS, Mosqlimate e Portal Geoambiental de Campinas). Eles passam por rigorosos processos de Engenharia de Dados (ETL) e imputação estatística para suprir falhas no preenchimento original e proteger a privacidade dos pacientes (LGPD).
              </p>
              <div className="flex items-start gap-2 text-amber-500/80 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>O atraso natural (data-lag) do SINAN entre a notificação clínica e o fechamento do inquérito laboratorial pode gerar subnotificação visual para o ano corrente.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-xs">
            © {currentYear} SIEST. Projeto Integrador (PI) - Ciência de Dados e Inteligência Artificial <br className="md:hidden" />
            <span className="hidden md:inline"> | </span>PUC-Campinas. Desenvolvido por Ítalo Fraga Botelho.
          </p>
        </div>
      </div>
    </footer>
  );
}
