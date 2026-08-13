import React, { useState, useRef } from 'react';
import { User, LogIn, UserPlus, X, Lock, Mail, UserCheck, ShieldCheck, Camera, Upload, Trash2, Link as LinkIcon } from 'lucide-react';
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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    // Limit file size before processing
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // max 400x400 for crisp avatar
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(dataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file works
    if (e.target) e.target.value = '';
  };

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

  const displayAvatar = avatar || currentUser?.avatar || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex flex-col items-center justify-center text-center">
          {currentUser && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => {
              if (mode === 'register' || mode === 'profile') {
                fileInputRef.current?.click();
              }
            }}
            className={`relative w-20 h-20 rounded-full bg-white/10 p-1 backdrop-blur-md mb-3 flex items-center justify-center border border-white/20 shadow-inner group ${
              mode === 'register' || mode === 'profile' ? 'cursor-pointer' : ''
            }`}
            title={mode === 'register' || mode === 'profile' ? 'Clique para enviar imagem do avatar' : undefined}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={name || currentUser?.name || 'Avatar'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}

            {(mode === 'register' || mode === 'profile') && (
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white">
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Alterar</span>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {currentUser && mode === 'profile'
              ? (currentUser.is_admin === 1 ? 'Meu Perfil Sync' : 'Meu Perfil')
              : mode === 'login'
              ? 'Entrar no KeepFlow'
              : 'Criar Nova Conta'}
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs">
            {currentUser && mode === 'profile'
              ? (currentUser.is_admin === 1 ? 'Sincronizado via SQLite com Android e Web' : 'Sincronizado com Android e Web')
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
                Foto do Avatar
              </label>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Subir Imagem / Foto
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Formatos aceitos: PNG, JPG, WEBP</span>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {showUrlInput ? 'Ocultar URL' : 'Ou colar URL'}
                  </button>
                </div>

                {showUrlInput && (
                  <div className="relative pt-1 animate-fadeIn">
                    <Camera className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                )}
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
