import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'change_pin';
  onSuccess: () => void;
  onChangeMode?: (mode: 'login' | 'change_pin') => void;
}

export const ADMIN_PIN_KEY = 'edumidia_admin_pin';
export const ADMIN_AUTH_KEY = 'edumidia_admin_auth';
export const DEFAULT_ADMIN_PIN = '1234';

export function getStoredAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
}

export function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

export function setAdminAuth(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  if (authenticated) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
  onChangeMode,
}) => {
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const storedPin = getStoredAdminPin();
    if (pin.trim() === storedPin.trim()) {
      setAdminAuth(true);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('Senha incorreta! Tente novamente (Dica: Senha padrão inicial é 1234).');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const storedPin = getStoredAdminPin();
    if (currentPin.trim() !== storedPin.trim()) {
      setError('A senha atual informada está incorreta.');
      return;
    }

    if (newPin.trim().length < 4) {
      setError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    localStorage.setItem(ADMIN_PIN_KEY, newPin.trim());
    setAdminAuth(true);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    onSuccess();
    onClose();
  };

  const handleResetToDefault = () => {
    localStorage.setItem(ADMIN_PIN_KEY, DEFAULT_ADMIN_PIN);
    setError(null);
    alert('A senha foi redefinida para a senha padrão: 1234');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              {mode === 'login' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {mode === 'login' ? 'Acesso Restrito ao Administrador' : 'Alterar Senha do Administrador'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Somente você pode alterar as configurações do sistema'
                  : 'Defina uma nova senha para proteger o sistema'}
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

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Digite sua Senha ou PIN de Administrador:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite a senha..."
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-sm sm:text-base font-bold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <span className="font-extrabold block mb-0.5">💡 Proteção Ativa:</span>
                  Qualquer professor ou visitante pode agendar aulas normalmente, mas apenas você com esta senha pode alterar o banco de dados Supabase e as configurações.
                  <div className="mt-1 font-semibold text-blue-800">
                    Senha padrão inicial: <code className="bg-blue-100 px-1 py-0.2 rounded font-black">1234</code>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Desbloquear Acesso</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha Atual:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha atual (padrão: 1234)"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 text-sm font-semibold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha (mínimo 4 caracteres):
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua nova senha"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm font-semibold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirme a Nova Senha:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm font-semibold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ocultar senhas' : 'Ver senhas digitadas'}</span>
                </button>

                {onChangeMode && (
                  <button
                    type="button"
                    onClick={() => onChangeMode('login')}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Voltar para Login
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
