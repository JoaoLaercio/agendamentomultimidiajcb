import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  GitBranch,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Terminal,
} from 'lucide-react';
import { Booking } from '../types';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  syncAllBookingsToSupabase,
  fetchBookingsFromSupabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
  bookings: Booking[];
  onBookingsUpdated: (bookings: Booking[]) => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
  bookings,
  onBookingsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'github' | 'vercel'>('supabase');

  const initialCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(initialCreds.url);
  const [anonKey, setAnonKey] = useState(initialCreds.anonKey);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  if (!isOpen) return null;

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  const handleTestConnection = async () => {
    if (!url) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL do seu projeto Supabase (ou cole o link do dashboard).',
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    if (res.normalizedUrl) {
      setUrl(res.normalizedUrl);
    }
    setTestResult(res);
  };

  const handleSaveCredentials = () => {
    saveSupabaseCredentials(url, anonKey);
    onCredentialsUpdated();
    setTestResult({
      success: true,
      message: 'Credenciais salvas com sucesso! A conexão com o Supabase está ativada.',
    });
  };

  const handleDisconnect = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    onCredentialsUpdated();
    setTestResult({
      success: true,
      message: 'Desconectado do Supabase. A aplicação voltou para o modo de armazenamento local.',
    });
  };

  const handleSyncToSupabase = async () => {
    saveSupabaseCredentials(url, anonKey);
    setSyncing(true);
    setTestResult(null);
    const res = await syncAllBookingsToSupabase(bookings);
    setSyncing(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: `${res.count} agendamento(s) enviados com sucesso para o banco do Supabase!`,
      });
      onCredentialsUpdated();
    } else {
      setTestResult({
        success: false,
        message: `Falha ao sincronizar: ${res.error}. Certifique-se de que executou o script SQL das tabelas no Supabase.`,
      });
    }
  };

  const handlePullFromSupabase = async () => {
    saveSupabaseCredentials(url, anonKey);
    setSyncing(true);
    setTestResult(null);
    const remote = await fetchBookingsFromSupabase();
    setSyncing(false);
    if (remote) {
      onBookingsUpdated(remote);
      setTestResult({
        success: true,
        message: `${remote.length} agendamento(s) carregados do Supabase com sucesso!`,
      });
      onCredentialsUpdated();
    } else {
      setTestResult({
        success: false,
        message: 'Não foi possível buscar agendamentos do Supabase. Verifique as credenciais ou as tabelas.',
      });
    }
  };

  const sqlSchemaCode = `-- SCRIPT SUPABASE PARA EDUMÍDIA
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('equipment', 'space')),
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  location TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  teacher_name TEXT NOT NULL,
  classroom TEXT NOT NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  shift TEXT NOT NULL,
  periods JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_time TEXT,
  end_time TEXT,
  resource_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  resource_details JSONB DEFAULT '{}'::jsonb,
  theme TEXT NOT NULL,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores se existirem (evita erro 42710)
DROP POLICY IF EXISTS "Public Read Resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public read access on resources" ON public.resources;
DROP POLICY IF EXISTS "Recursos de Leitura Pública" ON public.resources;
CREATE POLICY "Public Read Resources" ON public.resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public All Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public all access on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Todos os Agendamentos Públicos" ON public.bookings;
CREATE POLICY "Public All Bookings" ON public.bookings FOR ALL USING (true);

-- Inserir os recursos padrão
INSERT INTO public.resources (id, name, category, description, total_quantity, icon, color, location, rules)
VALUES
  ('datashow', 'Data Show (Projetor)', 'equipment', 'Projetor multimídia EPSON Full HD com controle e cabos inclusos.', 6, 'Projector', 'blue', 'Sala dos Professores / Multimídia', 'Retirar 10 min antes da aula. Devolver na maleta.'),
  ('cabos', 'Kit de Cabos & Conectores', 'equipment', 'Kits com cabo HDMI (3m/5m), VGA, adaptador USB-C e extensão elétrica.', 10, 'Cable', 'amber', 'Armário de Mídia - Gaveta 02', 'Enrolar cabos sem torcer ao devolver.'),
  ('tv', 'TV Smart Móvel (55")', 'equipment', 'Smart TV 4K 55" em suporte com rodinhas e som estéreo integrado.', 3, 'Tv', 'indigo', 'Depósito de Recursos', 'Travar rodinhas ao posicionar na sala.'),
  ('caixa_som', 'Caixa de Som Amplificada', 'equipment', 'Caixa portátil 300W bluetooth com 2 microfones sem fio.', 4, 'Speaker', 'emerald', 'Coordenação Pedagógica', 'Conferir pilhas dos microfones na devolução.'),
  ('chromebook', 'Carrinho de Chromebooks', 'equipment', 'Gabinete de recarga móvel com 36 Chromebooks para alunos.', 2, 'Laptop', 'sky', 'Laboratório de Mídias', 'Conectar ao cabo de carga ao devolver.'),
  ('biblioteca', 'Biblioteca Escolar', 'space', 'Espaço climatizado com mesas de estudo e acervo literário.', 1, 'BookOpen', 'purple', 'Bloco A - Térreo', 'Capacidade máx. 45 alunos. Manter silêncio moderado.'),
  ('patio', 'Pátio Central Escolar', 'space', 'Área ampla coberta para feiras culturais, palestras e eventos.', 1, 'Users', 'rose', 'Área Central de Convivência', 'Avisar apoio com antecedência para cadeiras.'),
  ('labin', 'Labin (Lab. de Informática)', 'space', 'Laboratório de informática educativa com 32 computadores com internet.', 1, 'MonitorCheck', 'teal', 'Bloco B - 1º Andar', 'Proibido alimentos/bebidas. Desligar máquinas.')
ON CONFLICT (id) DO NOTHING;`;

  const copySQL = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const gitCommands = `# 1. Inicializar repositório Git local
git init
git add .
git commit -m "feat: sistema escolar de agendamento multimídia EduMídia"

# 2. Criar repositório no seu GitHub (github.com/new) e vincular
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/edumidia-agendamento.git

# 3. Enviar para o GitHub
git push -u origin main`;

  const copyGit = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Integração: GitHub • Vercel • Supabase
              </h2>
              <p className="text-xs text-slate-400">
                Guia de conexão de banco de dados e implantação contínua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'supabase'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>1. Supabase (Banco de Dados)</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-slate-800 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-4 h-4 text-slate-800" />
            <span>2. GitHub (Repositório)</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'vercel'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>3. Vercel (Hospedagem)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* SUPABASE TAB */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              {/* Quick Status Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Status da Conexão:{' '}
                      <span className={isConfigured ? 'text-emerald-700' : 'text-slate-500'}>
                        {isConfigured ? 'Supabase Ativo (Tempo Real Habilitado)' : 'Modo Armazenamento Local'}
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {isConfigured
                        ? 'Novos agendamentos são sincronizados automaticamente no PostgreSQL do Supabase.'
                        : 'Os agendamentos ficam salvos no navegador até você conectar o Supabase.'}
                    </p>
                  </div>
                </div>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-[11px] text-red-600 hover:text-red-800 font-semibold px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              {/* Instructions 3-Step Guide */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-2">
                <strong className="font-extrabold text-emerald-900 block text-xs">
                  Passo a Passo Rápido para Conectar:
                </strong>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900 leading-relaxed">
                  <li>
                    Acesse <strong>supabase.com</strong>, crie sua conta gratuita e um novo projeto.
                  </li>
                  <li>
                    No menu lateral do Supabase, clique em <strong>SQL Editor</strong>, cole o código do <em>Script SQL</em> abaixo e clique em <strong>Run</strong>.
                  </li>
                  <li>
                    Vá em <strong>Project Settings → API</strong>, copie a <strong>Project URL</strong> e a <strong>anon public key</strong> e cole nos campos abaixo.
                  </li>
                </ol>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight">{testResult.message}</span>
                </div>
              )}

              {/* Credentials Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://seu-projeto.supabase.co ou o link do dashboard"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/40"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Aceita tanto <code>https://xxxx.supabase.co</code> quanto o link da barra do navegador (ex: <code>https://supabase.com/dashboard/project/xxxx</code>).
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      2. Supabase Anon Public Key:
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Chave configurada automaticamente
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="sb_publishable_... ou eyJ..."
                    value={anonKey}
                    onChange={e => setAnonKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/20"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                  >
                    {testing ? 'Testando...' : 'Testar Conexão'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                  >
                    Salvar Credenciais
                  </button>

                  {isConfigured && (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncToSupabase}
                        disabled={syncing}
                        className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Envia todos os agendamentos salvos localmente para o Supabase"
                      >
                        {syncing ? 'Sincronizando...' : `Subir ${bookings.length} Agendamentos Locais`}
                      </button>

                      <button
                        type="button"
                        onClick={handlePullFromSupabase}
                        disabled={syncing}
                        className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
                        title="Carrega os agendamentos mais recentes do Supabase"
                      >
                        Puxar do Supabase
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* SQL Schema helper */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Script SQL para executar no Supabase (SQL Editor):
                  </span>
                  <button
                    onClick={copySQL}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                  >
                    {copiedSQL ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiado com sucesso!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Código SQL
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-emerald-300 text-[11px] font-mono max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre>{sqlSchemaCode}</pre>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dica: Este script cria as tabelas <code>bookings</code> e <code>resources</code> com Row Level Security (RLS) habilitado e permissões públicas de agendamento escolar.
                </p>
              </div>
            </div>
          )}

          {/* GITHUB TAB */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-800">
                <strong className="font-bold block mb-1">Como enviar o código para o seu GitHub:</strong>
                O projeto já possui <code>.gitignore</code>, <code>package.json</code> e estrutura pronta para git.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-slate-800" />
                    Comandos no seu Terminal:
                  </span>
                  <button
                    onClick={copyGit}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded transition-colors"
                  >
                    {copiedGit ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Comandos
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 rounded-xl p-3.5 text-emerald-400 text-xs font-mono border border-slate-800 leading-relaxed overflow-x-auto">
                  <pre>{gitCommands}</pre>
                </div>
              </div>
            </div>
          )}

          {/* VERCEL TAB */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
                <strong className="font-bold block text-sm">Deploy automático na Vercel:</strong>
                <p>
                  O arquivo de configuração <code>vercel.json</code> já está configurado na raiz para fazer o roteamento do Vite SPA sem erros 404!
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="font-bold text-slate-900 block mb-1">
                    Passo 1: Conectar o GitHub à Vercel
                  </strong>
                  Acesse <strong>vercel.com</strong>, faça login com sua conta do GitHub e clique em <em>Add New... → Project</em>.
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="font-bold text-slate-900 block mb-1">
                    Passo 2: Configurar Variáveis de Ambiente na Vercel
                  </strong>
                  Em <em>Environment Variables</em>, adicione:
                  <ul className="list-disc list-inside mt-1 font-mono text-[11px] space-y-0.5">
                    <li><code>VITE_SUPABASE_URL</code>: (URL do seu projeto Supabase)</li>
                    <li><code>VITE_SUPABASE_ANON_KEY</code>: (Anon key do Supabase)</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="font-bold text-slate-900 block mb-1">
                    Passo 3: Deploy com 1 Clique
                  </strong>
                  Clique no botão <strong>Deploy</strong>. A Vercel executará <code>npm run build</code> e disponibilizará a URL pública SSL (ex: <code>edumidia.vercel.app</code>) para todos os professores e coordenadores usarem pelo celular ou computador!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
