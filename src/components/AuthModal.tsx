import React, { useState } from 'react';
import { User, LogIn, UserPlus, X, Lock, Mail, UserCheck, ShieldCheck, Camera, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';
import { apiLogin, apiRegister, apiUpdateProfile } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onAuthSuccess: (user: UserType, token: string) => void;
  onUpdateSuccess: (user: UserType) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onUpdateSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>(
    currentUser ? 'profile' : 'login'
  );
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await apiLogin(email, password);
        localStorage.setItem('kb_auth_token', res.token);
        localStorage.setItem('kb_auth_user', JSON.stringify(res.user));
        onAuthSuccess(res.user, res.token);
        onClose();
      } else if (mode === 'register') {
        const res = await apiRegister({ name, email, password, avatar });
        localStorage.setItem('kb_auth_token', res.token);
        localStorage.setItem('kb_auth_user', JSON.stringify(res.user));
        onAuthSuccess(res.user, res.token);
        onClose();
      } else if (mode === 'profile') {
        const updated = await apiUpdateProfile({ name, avatar, newPassword: password || undefined });
        localStorage.setItem('kb_auth_user', JSON.stringify(updated));
        onUpdateSuccess(updated);
        setSuccessMsg('Perfil atualizado com sucesso!');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin('demo@keepboard.app', '123456');
      localStorage.setItem('kb_auth_token', res.token);
      localStorage.setItem('kb_auth_user', JSON.stringify(res.user));
      onAuthSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError('Falha ao acessar conta demo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex flex-col items-center justify-center text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-white/10 p-1 backdrop-blur-md mb-3 flex items-center justify-center border border-white/20 shadow-inner">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {currentUser && mode === 'profile'
              ? 'Meu Perfil Sync'
              : mode === 'login'
              ? 'Entrar no KeepBoard'
              : 'Criar Nova Conta'}
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs">
            {currentUser && mode === 'profile'
              ? `Sincronizado via SQLite com Android e Web`
              : 'Acesse suas notas e quadros em qualquer dispositivo'}
          </p>

          {/* Navigation Tabs if not editing profile */}
          {!currentUser && (
            <div className="flex bg-white/15 p-1 rounded-xl mt-4 w-full text-xs font-medium backdrop-blur-md border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-white hover:bg-white/10'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-white hover:bg-white/10'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Cadastrar
              </button>
            </div>
          )}
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <span className="font-bold">•</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {(mode === 'register' || mode === 'profile') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {mode === 'profile' ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required={mode !== 'profile'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          </div>

          {(mode === 'register' || mode === 'profile') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL do Avatar (Opcional)
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Entrar na Conta
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" /> Criar Conta
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>

          {/* Demo Button for instant access */}
          {!currentUser && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Acessar com Conta Demo Instantânea
              </button>
            </div>
          )}

          {/* Logout button if profile */}
          {currentUser && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-semibold transition-colors"
              >
                Sair da Conta ({currentUser.email})
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
