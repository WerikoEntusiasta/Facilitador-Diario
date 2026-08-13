import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Car,
  CheckSquare,
  Paperclip,
  Loader2,
  X,
  FileCheck,
  User,
  Calendar,
  MapPin,
  Building,
} from 'lucide-react';
import { VaultItem, NoteAttachment, User as UserType } from '../types';
import {
  apiGetVaultStatus,
  apiSetupVaultMasterPassword,
  apiUnlockVault,
  apiGetVaultItems,
  apiCreateVaultItem,
  apiUpdateVaultItem,
  apiDeleteVaultItem,
  apiUploadNoteAttachment,
} from '../lib/api';

const CATEGORIES = [
  { name: 'Todas', icon: Shield },
  { name: 'Documentos', icon: FileText },
  { name: 'RG', icon: FileText },
  { name: 'CPF', icon: CreditCard },
  { name: 'CNH', icon: Car },
  { name: 'Título de Eleitor', icon: CheckSquare },
  { name: 'Redes Sociais', icon: Smartphone },
  { name: 'E-mails', icon: Mail },
  { name: 'Trabalho', icon: Briefcase },
  { name: 'Finanças', icon: CreditCard },
  { name: 'Geral', icon: Key },
];

interface VaultViewProps {
  currentUser?: UserType | null;
}

export const VaultView: React.FC<VaultViewProps> = ({ currentUser }) => {
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
  const [entryKind, setEntryKind] = useState<'credential' | 'document'>('credential');
  const [docType, setDocType] = useState<'rg' | 'cpf' | 'cnh' | 'titulo_eleitor' | 'passaporte' | 'outro'>('rg');
  const [docFields, setDocFields] = useState<Record<string, string>>({});
  const [docAttachments, setDocAttachments] = useState<NoteAttachment[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!text) return;
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

  const handleOpenModal = (item?: VaultItem, defaultKind: 'credential' | 'document' = 'credential') => {
    if (item) {
      setEditingItem(item);
      const isDoc = item.doc_type && item.doc_type !== 'credential';
      setEntryKind(isDoc ? 'document' : 'credential');
      setDocType(isDoc ? (item.doc_type as any) : 'rg');
      setDocFields(item.doc_data || {});
      setDocAttachments(item.attachments || []);
    } else {
      setEditingItem({
        app_name: defaultKind === 'document' ? 'Carteira de Identidade (RG)' : '',
        category: defaultKind === 'document' ? 'RG' : 'Geral',
        username_email: '',
        password: '',
        url: '',
        notes: '',
        doc_type: defaultKind === 'document' ? 'rg' : 'credential',
        doc_data: {},
        attachments: [],
      });
      setEntryKind(defaultKind);
      setDocType('rg');
      setDocFields({});
      setDocAttachments([]);
    }
    setIsModalOpen(true);
  };

  const selectDocPreset = (type: 'rg' | 'cpf' | 'cnh' | 'titulo_eleitor' | 'passaporte' | 'outro') => {
    setDocType(type);
    let title = 'Documento Pessoal';
    let cat = 'Documentos';

    if (type === 'rg') {
      title = 'Carteira de Identidade (RG)';
      cat = 'RG';
    } else if (type === 'cpf') {
      title = 'Cadastro de Pessoa Física (CPF)';
      cat = 'CPF';
    } else if (type === 'cnh') {
      title = 'Carteira de Motorista (CNH)';
      cat = 'CNH';
    } else if (type === 'titulo_eleitor') {
      title = 'Título de Eleitor';
      cat = 'Título de Eleitor';
    } else if (type === 'passaporte') {
      title = 'Passaporte';
      cat = 'Documentos';
    }

    setEditingItem((prev) => ({
      ...prev,
      app_name: title,
      category: cat,
      doc_type: type,
    }));
  };

  const handleVaultFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDoc(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await apiUploadNoteAttachment(files[i]);
        setDocAttachments((prev) => [...prev, uploaded]);
      }
      showToast('📎 Foto/Documento anexado!');
    } catch (err: any) {
      showToast(`Erro ao enviar foto: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.app_name) {
      showToast('⚠️ Preencha o nome do aplicativo ou documento.');
      return;
    }

    const payload: Partial<VaultItem> = {
      ...editingItem,
      doc_type: entryKind === 'document' ? docType : 'credential',
      doc_data: entryKind === 'document' ? docFields : {},
      attachments: docAttachments,
    };

    if (entryKind === 'credential') {
      if (!payload.username_email || !payload.password) {
        showToast('⚠️ Para senhas, preencha Usuário/E-mail e Senha.');
        return;
      }
    } else {
      // Document fallback
      const primaryNumber =
        docFields.rg_number ||
        docFields.cpf_number ||
        docFields.cnh_number ||
        docFields.titulo_number ||
        docFields.passport_number ||
        docFields.doc_number ||
        payload.username_email ||
        '';
      payload.username_email = primaryNumber;

      const secondaryDetail =
        docFields.orgao_emissor ||
        docFields.validade ||
        docFields.data_nascimento ||
        payload.password ||
        '';
      payload.password = secondaryDetail;
    }

    try {
      if (editingItem.id) {
        await apiUpdateVaultItem(masterPassword, editingItem.id, payload);
        showToast('✅ Item atualizado no cofre!');
      } else {
        await apiCreateVaultItem(masterPassword, payload);
        showToast('✅ Novo item salvo com sucesso no cofre!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadItems(masterPassword);
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Tem certeza que deseja remover este item do cofre?')) {
      try {
        await apiDeleteVaultItem(masterPassword, id);
        showToast('🗑️ Item removido.');
        await loadItems(masterPassword);
      } catch (err: any) {
        showToast(`Erro: ${err.message}`);
      }
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const isDoc = item.doc_type && item.doc_type !== 'credential';
    let matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    if (selectedCategory === 'Documentos') {
      matchesCategory = Boolean(isDoc || item.category === 'RG' || item.category === 'CPF' || item.category === 'CNH' || item.category === 'Título de Eleitor');
    }

    const docStr = JSON.stringify(item.doc_data || {}).toLowerCase();
    const matchesQuery =
      item.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      docStr.includes(searchQuery.toLowerCase());

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
              Configurar Cofre de Senhas e Documentos
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Guarde suas senhas e documentos pessoais (RG, CPF, CNH, Título de Eleitor) com segurança total via <strong className="text-indigo-600 dark:text-indigo-400">Senha Mestra de no mínimo 16 caracteres</strong>.
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
                <strong>Atenção:</strong> Guarde bem esta senha de 16 caracteres. Ela é a chave para proteger e acessar suas senhas e documentos pessoais.
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
              Digite sua senha mestra de 16 caracteres para acessar suas senhas e documentos.
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
            🔒 Proteção por criptografia avançada {currentUser?.is_admin === 1 ? 'e SQLite local' : 'e armazenamento seguro'}.
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
                Cofre de Senhas & Documentos Pessoais
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Aberto
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadastre e consulte RG, CPF, CNH, Título de Eleitor e senhas protegidos pela sua Senha Mestra de 16 caracteres.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleOpenModal(undefined, 'document')}
            className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 border border-emerald-500/20 cursor-pointer"
          >
            <FileText size={16} />
            <span>Cadastrar Documento</span>
          </button>

          <button
            onClick={() => handleOpenModal(undefined, 'credential')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nova Senha / App</span>
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
            placeholder="Buscar por nome, número, RG, CPF, CNH..."
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
          <Key className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Nenhum registro encontrado
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum item corresponde aos critérios de busca informados.'
              : 'Seu cofre está vazio. Você pode cadastrar suas senhas e seus documentos como RG, CPF, CNH e Título de Eleitor.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => handleOpenModal(undefined, 'document')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <FileText size={15} />
              <span>Cadastrar RG / CPF / CNH</span>
            </button>
            <button
              onClick={() => handleOpenModal(undefined, 'credential')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus size={15} />
              <span>Cadastrar Senha</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPassVisible = visiblePasswords[item.id] || false;
            const isDocument = item.doc_type && item.doc_type !== 'credential';
            const doc = item.doc_data || {};

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border ${
                  isDocument
                    ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent'
                    : 'border-slate-200 dark:border-slate-800'
                } shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        item.doc_type === 'rg'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : item.doc_type === 'cpf'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : item.doc_type === 'cnh'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : item.doc_type === 'titulo_eleitor'
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          : isDocument
                          ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-100 dark:border-indigo-900'
                      }`}
                    >
                      {item.doc_type === 'cnh' ? (
                        <Car size={20} />
                      ) : item.doc_type === 'cpf' ? (
                        <CreditCard size={20} />
                      ) : item.doc_type === 'titulo_eleitor' ? (
                        <CheckSquare size={20} />
                      ) : isDocument ? (
                        <FileText size={20} />
                      ) : (
                        <Globe size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
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
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Body Details for Document vs Credential */}
                {isDocument ? (
                  <div className="space-y-2.5">
                    {/* Main Document Number */}
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Número do Documento
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                          {item.username_email || 'Não informado'}
                        </span>
                        <button
                          onClick={() => handleCopyText(item.username_email, 'Número do Documento')}
                          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-md transition shrink-0 cursor-pointer"
                          title="Copiar Número"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Additional Doc Attributes Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {doc.orgao_emissor && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Órgão Emissor</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.orgao_emissor}</span>
                        </div>
                      )}
                      {doc.data_emissao && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Emissão</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.data_emissao}</span>
                        </div>
                      )}
                      {doc.validade && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Validade</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.validade}</span>
                        </div>
                      )}
                      {doc.categoria && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Categoria CNH</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">{doc.categoria}</span>
                        </div>
                      )}
                      {doc.zona && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Zona / Seção</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Zona {doc.zona} - Seção {doc.secao || 'N/I'}
                          </span>
                        </div>
                      )}
                      {doc.data_nascimento && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Nascimento</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.data_nascimento}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                  </div>
                )}

                {/* Attached Document Photos */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Paperclip size={11} />
                      <span>Fotos / Anexos ({item.attachments.length})</span>
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {item.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-700 transition shrink-0"
                          title={`Abrir ${att.name}`}
                        >
                          {att.type === 'image' ? (
                            <img src={att.url} alt={att.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <FileText size={16} className="text-emerald-600 dark:text-emerald-400 p-0.5" />
                          )}
                          <span className="text-[10px] font-medium max-w-[80px] truncate text-slate-700 dark:text-slate-300">
                            {att.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

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
                        <span>Link / Site</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span />
                    )}

                    {item.notes && (
                      <span className="truncate text-slate-400 italic max-w-[180px]" title={item.notes}>
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

      {/* ================= MODAL: ADD / EDIT CREDENTIAL OR DOCUMENT ================= */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {entryKind === 'document' ? (
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
                <span>
                  {editingItem.id
                    ? 'Editar Registro'
                    : entryKind === 'document'
                    ? 'Novo Documento no Cofre'
                    : 'Nova Senha no Cofre'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Entry Kind Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setEntryKind('credential')}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  entryKind === 'credential'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Key size={15} />
                <span>Senha / Aplicativo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryKind('document');
                  selectDocPreset('rg');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  entryKind === 'document'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText size={15} />
                <span>Documento Pessoal</span>
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* DOCUMENT SPECIFIC FORM */}
              {entryKind === 'document' ? (
                <div className="space-y-4">
                  {/* Preset Document Type Chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tipo de Documento:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'rg', label: '🪪 RG' },
                        { id: 'cpf', label: '💳 CPF' },
                        { id: 'cnh', label: '🚗 CNH' },
                        { id: 'titulo_eleitor', label: '🗳️ Título de Eleitor' },
                        { id: 'passaporte', label: '🌐 Passaporte' },
                        { id: 'outro', label: '📄 Outro' },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => selectDocPreset(chip.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            docType === chip.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Name / Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome / Descrição do Documento *
                    </label>
                    <input
                      type="text"
                      value={editingItem.app_name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, app_name: e.target.value })}
                      placeholder="Ex: Meu RG, CNH do João, CPF Titular"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                      required
                    />
                  </div>

                  {/* DYNAMIC FIELDS PER DOC TYPE */}
                  {docType === 'rg' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Número do RG *
                        </label>
                        <input
                          type="text"
                          value={docFields.rg_number || ''}
                          onChange={(e) => setDocFields({ ...docFields, rg_number: e.target.value })}
                          placeholder="Ex: 12.345.678-9"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Órgão Emissor / UF
                        </label>
                        <input
                          type="text"
                          value={docFields.orgao_emissor || ''}
                          onChange={(e) => setDocFields({ ...docFields, orgao_emissor: e.target.value })}
                          placeholder="Ex: SSP/SP, DETRAN/RJ"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Data de Emissão
                        </label>
                        <input
                          type="text"
                          value={docFields.data_emissao || ''}
                          onChange={(e) => setDocFields({ ...docFields, data_emissao: e.target.value })}
                          placeholder="Ex: 15/05/2020"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Data de Nascimento
                        </label>
                        <input
                          type="text"
                          value={docFields.data_nascimento || ''}
                          onChange={(e) => setDocFields({ ...docFields, data_nascimento: e.target.value })}
                          placeholder="Ex: 01/01/1995"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {docType === 'cpf' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Número do CPF *
                        </label>
                        <input
                          type="text"
                          value={docFields.cpf_number || ''}
                          onChange={(e) => setDocFields({ ...docFields, cpf_number: e.target.value })}
                          placeholder="Ex: 123.456.789-00"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Data de Nascimento
                        </label>
                        <input
                          type="text"
                          value={docFields.data_nascimento || ''}
                          onChange={(e) => setDocFields({ ...docFields, data_nascimento: e.target.value })}
                          placeholder="Ex: 01/01/1995"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {docType === 'cnh' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Número do Registro CNH *
                        </label>
                        <input
                          type="text"
                          value={docFields.cnh_number || ''}
                          onChange={(e) => setDocFields({ ...docFields, cnh_number: e.target.value })}
                          placeholder="Ex: 01234567890"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Categoria CNH
                        </label>
                        <input
                          type="text"
                          value={docFields.categoria || ''}
                          onChange={(e) => setDocFields({ ...docFields, categoria: e.target.value })}
                          placeholder="Ex: B, AB, A, D"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Data de Validade
                        </label>
                        <input
                          type="text"
                          value={docFields.validade || ''}
                          onChange={(e) => setDocFields({ ...docFields, validade: e.target.value })}
                          placeholder="Ex: 20/10/2030"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Órgão Emissor / UF
                        </label>
                        <input
                          type="text"
                          value={docFields.orgao_emissor || ''}
                          onChange={(e) => setDocFields({ ...docFields, orgao_emissor: e.target.value })}
                          placeholder="Ex: DETRAN/SP"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {docType === 'titulo_eleitor' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-500/5 rounded-2xl border border-purple-500/20">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Número do Título de Eleitor *
                        </label>
                        <input
                          type="text"
                          value={docFields.titulo_number || ''}
                          onChange={(e) => setDocFields({ ...docFields, titulo_number: e.target.value })}
                          placeholder="Ex: 1234 5678 9012"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Zona
                        </label>
                        <input
                          type="text"
                          value={docFields.zona || ''}
                          onChange={(e) => setDocFields({ ...docFields, zona: e.target.value })}
                          placeholder="Ex: 001"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Seção
                        </label>
                        <input
                          type="text"
                          value={docFields.secao || ''}
                          onChange={(e) => setDocFields({ ...docFields, secao: e.target.value })}
                          placeholder="Ex: 0142"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Município / UF
                        </label>
                        <input
                          type="text"
                          value={docFields.municipio || ''}
                          onChange={(e) => setDocFields({ ...docFields, municipio: e.target.value })}
                          placeholder="Ex: São Paulo / SP"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {docType === 'passaporte' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Número do Passaporte *
                        </label>
                        <input
                          type="text"
                          value={docFields.passport_number || ''}
                          onChange={(e) => setDocFields({ ...docFields, passport_number: e.target.value })}
                          placeholder="Ex: AB123456"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={docFields.validade || ''}
                          onChange={(e) => setDocFields({ ...docFields, validade: e.target.value })}
                          placeholder="Ex: 10/10/2032"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {docType === 'outro' && (
                    <div className="p-3 bg-slate-500/5 rounded-2xl border border-slate-500/20 space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Número / Identificador do Documento *
                        </label>
                        <input
                          type="text"
                          value={docFields.doc_number || ''}
                          onChange={(e) => setDocFields({ ...docFields, doc_number: e.target.value })}
                          placeholder="Ex: Nº do contrato, Matrícula, Certidão"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Attachment Section for Document Photo / PDF Scan */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Paperclip size={14} className="text-emerald-600" />
                        <span>Foto do Documento / Scan (Frente / Verso)</span>
                      </label>
                      <label className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer text-xs font-bold flex items-center gap-1">
                        {isUploadingDoc ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        <span>Anexar Foto</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleVaultFileUpload}
                          disabled={isUploadingDoc}
                        />
                      </label>
                    </div>

                    {docAttachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {docAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} className="w-8 h-8 rounded object-cover shrink-0" />
                              ) : (
                                <FileText size={16} className="text-emerald-600 shrink-0" />
                              )}
                              <span className="truncate font-medium text-[11px]">{att.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                              className="p-1 text-slate-400 hover:text-red-500 shrink-0"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* CREDENTIAL FORM */
                <div className="space-y-4">
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
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Anotações Adicionais (Opcional)
                </label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Observações, filiação, respostas de segurança..."
                  rows={2}
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
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition cursor-pointer ${
                    entryKind === 'document'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
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
