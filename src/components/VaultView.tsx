import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  Globe,
  Mail,
  Briefcase,
  CreditCard,
  Smartphone,
  Info,
} from 'lucide-react';
import { VaultItem } from '../types';
import {
  apiGetVaultStatus,
  apiSetupVaultMasterPassword,
  apiUnlockVault,
  apiGetVaultItems,
  apiCreateVaultItem,
  apiUpdateVaultItem,
  apiDeleteVaultItem,
} from '../lib/api';

const CATEGORIES = [
  { name: 'Todas', icon: Shield },
  { name: 'Redes Sociais', icon: Smartphone },
  { name: 'E-mails', icon: Mail },
  { name: 'Trabalho', icon: Briefcase },
  { name: 'Finanças', icon: CreditCard },
  { name: 'Geral', icon: Key },
];

export const VaultView: React.FC = () => {
  // Vault Auth State
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [showMasterInput, setShowMasterInput] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Vault Items State
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<VaultItem> | null>(null);

  // Password Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedLength, setGeneratedLength] = useState(16);
  const [generatedPass, setGeneratedPass] = useState('');

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const checkVaultStatus = async () => {
    try {
      setLoading(true);
      const res = await apiGetVaultStatus();
      setIsConfigured(res.isConfigured);
    } catch (err: any) {
      console.error('Erro ao verificar status do cofre:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (masterPassword.length < 16) {
      setAuthError(`A senha mestra atual tem ${masterPassword.length} caracteres. É necessário no mínimo 16 caracteres.`);
      return;
    }

    if (masterPassword !== confirmMasterPassword) {
      setAuthError('As senhas não coincidem. Verifique a confirmação.');
      return;
    }

    try {
      setLoading(true);
      await apiSetupVaultMasterPassword(masterPassword);
      setIsConfigured(true);
      setIsUnlocked(true);
      showToast('🔑 Senha mestra configurada com sucesso!');
      await loadItems(masterPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao configurar a senha mestra.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!masterPassword) {
      setAuthError('Digite a sua senha mestra de 16 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await apiUnlockVault(masterPassword);
      setIsUnlocked(true);
      showToast('🔓 Cofre desbloqueado com sucesso!');
      await loadItems(masterPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Senha mestra incorreta.');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (pass: string) => {
    try {
      const data = await apiGetVaultItems(pass);
      setItems(data);
    } catch (err: any) {
      console.error('Erro ao carregar itens do cofre:', err);
      showToast('Erro ao carregar os dados do cofre');
    }
  };

  const handleLockVault = () => {
    setIsUnlocked(false);
    setMasterPassword('');
    setConfirmMasterPassword('');
    setItems([]);
    setVisiblePasswords({});
    showToast('🔒 Cofre trancado por segurança.');
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 ${label} copiado para a área de transferência!`);
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const generateRandomPassword = (length = 16) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let res = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      res += charset[array[i] % charset.length];
    }
    setGeneratedPass(res);
  };

  const handleOpenModal = (item?: VaultItem) => {
    if (item) {
      setEditingItem(item);
    } else {
      setEditingItem({
        app_name: '',
        category: 'Geral',
        username_email: '',
        password: '',
        url: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.app_name || !editingItem?.username_email || !editingItem?.password) {
      showToast('⚠️ Preencha os campos obrigatórios (App, Usuário e Senha)');
      return;
    }

    try {
      if (editingItem.id) {
        await apiUpdateVaultItem(masterPassword, editingItem.id, editingItem);
        showToast('✅ Credencial atualizada com sucesso!');
      } else {
        await apiCreateVaultItem(masterPassword, editingItem);
        showToast('✅ Nova credencial adicionada ao cofre!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadItems(masterPassword);
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Tem certeza que deseja remover esta credencial do cofre?')) {
      try {
        await apiDeleteVaultItem(masterPassword, id);
        showToast('🗑️ Credencial removida.');
        await loadItems(masterPassword);
      } catch (err: any) {
        showToast(`Erro: ${err.message}`);
      }
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesQuery =
      item.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  /* =========================================================================
     1. SCREEN: SETUP MASTER PASSWORD (16 CHARACTERS)
     ========================================================================= */
  if (isConfigured === false) {
    const passLength = masterPassword.length;
    const isMinLength = passLength >= 16;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-inner mb-2">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Configurar Cofre de Senhas
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Para proteger suas credenciais e logins com máxima segurança, defina uma <strong className="text-indigo-600 dark:text-indigo-400">Senha Mestra de no mínimo 16 caracteres</strong>.
            </p>
          </div>

          <form onSubmit={handleSetup} className="space-y-5">
            {authError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Senha Mestra Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <label>Sua Senha Mestra (mínimo 16 caracteres)</label>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] ${isMinLength ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                  {passLength}/16 caracteres
                </span>
              </div>

              <div className="relative">
                <input
                  type={showMasterInput ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Ex: P@ssw0rdM3stra#2026!Segura"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMasterInput(!showMasterInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showMasterInput ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Progress Bar indicator */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isMinLength ? 'bg-emerald-500' : passLength > 8 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min((passLength / 16) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Confirmação Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirme a Senha Mestra
              </label>
              <input
                type={showMasterInput ? 'text' : 'password'}
                value={confirmMasterPassword}
                onChange={(e) => setConfirmMasterPassword(e.target.value)}
                placeholder="Repita exatamente a mesma senha"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                required
              />
            </div>

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong>Atenção:</strong> Guarde bem esta senha de 16 caracteres em um local seguro. Ela é necessária para trancar e abrir seu cofre pessoal.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isMinLength || masterPassword !== confirmMasterPassword}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Configurando Cofre...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Criar Cofre Protegido com 16 Caracteres</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. SCREEN: UNLOCK VAULT (LOCKED STATE)
     ========================================================================= */
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Cofre Trancado
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Digite sua senha mestra de 16 caracteres para acessar seus e-mails e senhas guardados.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Senha Mestra (16+ Caracteres)
              </label>
              <div className="relative">
                <input
                  type={showMasterInput ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Sua senha de 16 caracteres"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMasterInput(!showMasterInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showMasterInput ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !masterPassword}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Desbloquear Cofre</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            🔒 Proteção por algoritmo SHA-256 e SQLite local.
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. SCREEN: UNLOCKED VAULT DASHBOARD
     ========================================================================= */
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Cofre de Senhas Guardadas
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Aberto
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie seus e-mails, usuários e senhas de aplicativos protegidos pela sua Senha Mestra de 16 caracteres.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              generateRandomPassword(16);
              setShowGenerator(true);
            }}
            className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Sparkles size={15} className="text-indigo-500" />
            <span>Gerador 16+ Chars</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nova Credencial</span>
          </button>

          <button
            onClick={handleLockVault}
            className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Trancar o cofre imediatamente"
          >
            <Lock size={15} />
            <span>Trancar</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por app, e-mail ou nota..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSel = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <Key className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Nenhuma credencial encontrada
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum item corresponde aos critérios de busca informados.'
              : 'Seu cofre está vazio. Adicione suas senhas e logins de aplicativos para mantê-los organizados.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <Plus size={15} />
            <span>Adicionar Primeira Credencial</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPassVisible = visiblePasswords[item.id] || false;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.app_name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Email / Username Field */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Usuário / E-mail
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate font-semibold">
                      {item.username_email}
                    </span>
                    <button
                      onClick={() => handleCopyText(item.username_email, 'E-mail')}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition shrink-0 cursor-pointer"
                      title="Copiar Usuário/E-mail"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Senha de Acesso
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate font-semibold">
                      {isPassVisible ? item.password : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => togglePasswordVisibility(item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition cursor-pointer"
                        title={isPassVisible ? 'Ocultar Senha' : 'Mostrar Senha'}
                      >
                        {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyText(item.password, 'Senha')}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition cursor-pointer"
                        title="Copiar Senha"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional URL & Notes */}
                {(item.url || item.notes) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    {item.url ? (
                      <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-[200px]"
                      >
                        <span>Acessar Site</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span />
                    )}

                    {item.notes && (
                      <span className="truncate text-slate-400 italic max-w-[150px]" title={item.notes}>
                        "{item.notes}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CREDENTIAL ================= */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{editingItem.id ? 'Editar Credencial' : 'Nova Credencial no Cofre'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* App Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do App / Serviço *
                  </label>
                  <input
                    type="text"
                    value={editingItem.app_name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, app_name: e.target.value })}
                    placeholder="Ex: Netflix, Gmail, Work VPN"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingItem.category || 'Geral'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Redes Sociais">Redes Sociais</option>
                    <option value="E-mails">E-mails</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Finanças">Finanças</option>
                  </select>
                </div>
              </div>

              {/* Username / Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail ou Usuário *
                </label>
                <input
                  type="text"
                  value={editingItem.username_email || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, username_email: e.target.value })}
                  placeholder="Ex: usuario@email.com ou @meu_user"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Senha de Acesso *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                      let pass = '';
                      for (let i = 0; i < 16; i++) {
                        pass += charset.charAt(Math.floor(Math.random() * charset.length));
                      }
                      setEditingItem({ ...editingItem, password: pass });
                      showToast('⚡ Senha forte de 16 caracteres gerada!');
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Gerar 16 Chars</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={editingItem.password || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                  placeholder="Sua senha secreta do app"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              {/* Optional URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL / Link do Aplicativo (Opcional)
                </label>
                <input
                  type="text"
                  value={editingItem.url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  placeholder="Ex: https://app.servico.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Anotações Adicionais (Opcional)
                </label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Perguntas de segurança, PIN secundário, observações..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Salvar no Cofre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PASSWORD GENERATOR (16+ CHARS) ================= */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>Gerador de Senha Segura</span>
              </h3>
              <button
                onClick={() => setShowGenerator(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Generated Password Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Senha Gerada ({generatedLength} caracteres)
              </span>
              <div className="text-sm font-mono font-bold text-emerald-400 break-all select-all">
                {generatedPass}
              </div>
            </div>

            {/* Length Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tamanho da Senha
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[16, 20, 24, 32].map((len) => (
                  <button
                    key={len}
                    onClick={() => {
                      setGeneratedLength(len);
                      generateRandomPassword(len);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      generatedLength === len
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {len} Chars
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => generateRandomPassword(generatedLength)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Gerar Outra</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPass);
                  showToast('📋 Senha copiada para a área de transferência!');
                  setShowGenerator(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy size={14} />
                <span>Copiar Senha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
