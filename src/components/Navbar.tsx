import React from 'react';
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Tag,
  User as UserIcon,
  Smartphone,
  CheckCircle2,
  Dumbbell,
} from 'lucide-react';
import { ViewTab, User } from '../types';

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
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'notes':
        return 'Bloco de Notas';
      case 'kanban':
        return 'Quadros Kanban';
      case 'calendar':
        return 'Calendário & Lembretes';
      case 'workouts':
        return 'Treinos & Rotina Semanal';
      case 'pdfs':
        return 'Central de PDFs';
      case 'archive':
        return 'Notas Arquivadas';
      case 'trash':
        return 'Lixeira';
      case 'android_app':
        return 'App Android & SQLite Sync';
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

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('notes')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              K
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">KeepBoard</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-1">
                Notas • Kanban • Android
              </span>
            </div>
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
          <button
            onClick={() => onTabChange('android_app')}
            className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
              currentTab === 'android_app'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="App Android & SQLite Sync"
          >
            <Smartphone size={18} className="text-emerald-500" />
            <span className="hidden xl:inline">Android App</span>
          </button>

          <button
            onClick={onOpenLabelManager}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
            title="Gerenciar Etiquetas"
          >
            <Tag size={18} className="text-indigo-500" />
            <span className="hidden lg:inline">Etiquetas</span>
          </button>

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
                {currentUser ? 'SQLite Sync' : 'Criar Conta'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

