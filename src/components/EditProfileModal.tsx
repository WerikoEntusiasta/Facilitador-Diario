import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  X,
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  Link as LinkIcon,
  Sparkles,
  Check,
  AlertCircle,
  KeyRound,
  Calendar,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { User as UserType } from '../types';
import { apiUpdateProfile } from '../lib/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUpdateSuccess: (user: UserType) => void;
  onLogout?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop&crop=faces',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateSuccess,
  onLogout,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setAvatar(currentUser.avatar || '');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500; // alta resolução para avatar
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setAvatar(dataUrl);
          setError(null);
          setSuccessMsg('Foto carregada! Clique em "Salvar Alterações" para aplicar.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('O nome de exibição não pode ficar em branco.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('A confirmação de senha não coincide com a nova senha digitada.');
        return;
      }
    }

    setLoading(true);

    try {
      const updated = await apiUpdateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        newPassword: newPassword.trim() || undefined,
      });

      localStorage.setItem('kb_auth_user', JSON.stringify(updated));
      onUpdateSuccess(updated);
      setSuccessMsg('Perfil atualizado com sucesso!');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar as alterações do perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with gradient & photo banner */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/15 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative inline-block mb-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-white/20 p-1 backdrop-blur-md flex items-center justify-center border-2 border-white/60 shadow-xl cursor-pointer group overflow-hidden"
              title="Clique para trocar foto de perfil"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name || currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-800 flex items-center justify-center text-white">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-0.5">
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Alterar</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white transition transform hover:scale-105 cursor-pointer"
              title="Carregar nova foto"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-xl font-black tracking-tight">Editar Perfil & Foto</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Personalize seu nome de exibição, foto do avatar e credenciais
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Opções de Foto / Avatar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Gerenciar Foto de Perfil
              </span>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remover foto
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload do Computador / Celular
              </button>

              <button
                type="button"
                onClick={() => setShowPresetAvatars(!showPresetAvatars)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {showPresetAvatars ? 'Ocultar Galeria' : 'Galeria de Avatares'}
              </button>
            </div>

            {/* Presets Gallery */}
            {showPresetAvatars && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-fadeIn">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Escolha um avatar estilizado:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(url);
                        setError(null);
                      }}
                      className={`relative rounded-full p-0.5 border-2 transition cursor-pointer ${
                        avatar === url
                          ? 'border-emerald-500 scale-105 shadow-md'
                          : 'border-transparent hover:border-indigo-400'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Avatar ${idx}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {avatar === url && (
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600 bg-white rounded-full p-0.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* URL Externa */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Ou cole um link direto de imagem:</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                {showUrlInput ? 'Ocultar Campo Link' : 'Inserir Link URL'}
              </button>
            </div>

            {showUrlInput && (
              <div className="relative pt-1 animate-fadeIn">
                <LinkIcon className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome de Exibição
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* E-mail (somente leitura para referência) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail da Conta (Não editável)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Alteração de Senha (Opcional) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Alterar Senha de Acesso (Opcional)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Salvar Alterações
                </>
              )}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Encerrar Sessão ({currentUser.email})
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
