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
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
} from '../lib/supabase';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'github' | 'vercel'>('supabase');

  const initialCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(initialCreds.url);
  const [anonKey, setAnonKey] = useState(initialCreds.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url || !anonKey) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL e a Anon Key do Supabase.',
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    setTesting(false);
    setTestResult(res);
  };

  const handleSaveCredentials = () => {
    saveSupabaseCredentials(url, anonKey);
    onCredentialsUpdated();
    setTestResult({
      success: true,
      message: 'Credenciais do Supabase salvas com sucesso! A aplicação agora sincronizará.',
    });
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
  resource_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  resource_details JSONB DEFAULT '{}'::jsonb,
  theme TEXT NOT NULL,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public All Bookings" ON public.bookings FOR ALL USING (true);`;

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
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
                <strong className="font-bold block mb-1">Como conectar ao Supabase:</strong>
                1. Crie um projeto gratuito em <strong>supabase.com</strong>.<br />
                2. Vá em <strong>Project Settings → API</strong> e copie a <em>Project URL</em> e a <em>anon public key</em>.<br />
                3. Cole abaixo para ativar sincronização instantânea em tempo real!
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
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzabcdefg.supabase.co"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public Key:
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={e => setAnonKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                  >
                    {testing ? 'Testando conexão...' : 'Testar Conexão'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs ml-auto"
                  >
                    Salvar & Sincronizar
                  </button>
                </div>
              </div>

              {/* SQL Schema helper */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Script SQL para criar as Tabelas no Supabase:
                  </span>
                  <button
                    onClick={copySQL}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                  >
                    {copiedSQL ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar SQL
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-slate-300 text-[11px] font-mono max-h-36 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre>{sqlSchemaCode}</pre>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  O arquivo completo também está salvo na raiz do projeto como <code>supabase-schema.sql</code>.
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
