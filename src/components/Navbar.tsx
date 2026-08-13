import React, { useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Tag,
  User as UserIcon,
  Bell,
  WifiOff,
  RefreshCw,
  CloudCheck,
} from 'lucide-react';
import { ViewTab, User } from '../types';
import { subscribeSyncState, SyncState } from '../lib/offlineSync';

import { Logo } from './Logo';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenLabelManager: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenServerSettings?: () => void;
  onOpenNotificationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  isMobileOpen,
  onToggleMobileMenu,
  onOpenLabelManager,
  currentUser,
  onOpenAuth,
  onOpenServerSettings,
  onOpenNotificationModal,
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: Date.now(),
  });

  useEffect(() => {
    return subscribeSyncState((st) => setSyncState(st));
  }, []);

  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.update();
        }
      });
    }
    const cleanUrl = window.location.href.split('?')[0].split('#')[0];
    window.location.replace(`${cleanUrl}?v=${Date.now()}`);
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard do Usuário';
      case 'notes':
        return 'Bloco de Notas';
      case 'kanban':
        return 'Quadros Kanban';
      case 'calendar':
        return 'Calendário & Lembretes';
      case 'workouts':
        return 'Treinos & Rotina Semanal';
      case 'fasting':
        return 'Sessão de Jejum Intermitente';
      case 'vault':
        return 'Cofre de Senhas Criptografado';
      case 'pdfs':
        return 'Central de PDFs';
      case 'archive':
        return 'Notas Arquivadas';
      case 'trash':
        return 'Lixeira';
      case 'weather':
        return 'Previsão do Tempo (Catanduva/SP)';
      case 'ux_guide':
        return 'Diretrizes e Princípios de UX';
      default:
        return 'KeepBoard';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Abrir Menu"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center cursor-pointer" onClick={() => onTabChange('notes')}>
            <Logo size="md" showText={true} />
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200 hidden md:block">
            {getTabTitle()}
          </h1>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar notas, tarefas, cartões ou arquivos..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl text-sm border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Connection Status Badge */}
          {syncState.isSyncing ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-medium animate-pulse" title="Sincronizando alterações com o servidor...">
              <RefreshCw size={14} className="animate-spin" />
              <span className="hidden sm:inline">Sincronizando...</span>
            </div>
          ) : !syncState.isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-medium" title="Modo Offline Ativo. Seus dados e novas alterações estão salvos no dispositivo por até 3 dias.">
              <WifiOff size={14} />
              <span className="hidden sm:inline">Modo Offline (Cache 3 dias)</span>
            </div>
          ) : syncState.pendingCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-xs font-medium" title={`${syncState.pendingCount} alterações salvas localmente e aguardando envio`}>
              <CloudCheck size={14} />
              <span className="hidden sm:inline">{syncState.pendingCount} pendente(s)</span>
            </div>
          ) : null}


          <button
            onClick={onOpenLabelManager}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
            title="Gerenciar Etiquetas"
          >
            <Tag size={18} className="text-indigo-500" />
            <span className="hidden lg:inline">Etiquetas</span>
          </button>

          {onOpenNotificationModal && (
            <button
              onClick={onOpenNotificationModal}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
              title="Menu de Notificações & DND"
            >
              <Bell size={18} className="text-amber-500" />
              <span className="hidden lg:inline">Notificações</span>
            </button>
          )}

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-indigo-600" />}
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* User Auth Profile Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
            title={currentUser ? `Conectado como ${currentUser.name}` : 'Fazer Login / Criar Conta'}
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <UserIcon size={16} />
              </div>
            )}
            <div className="hidden sm:block text-left text-xs pr-1">
              <span className="block font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                {currentUser ? currentUser.name : 'Entrar'}
              </span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {currentUser ? (currentUser.is_admin === 1 ? 'SQLite Sync' : 'Sincronizado') : 'Criar Conta'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

