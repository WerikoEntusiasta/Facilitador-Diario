import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  FileCheck,
  FolderArchive,
  Trash2,
  Tag,
  Plus,
  Filter,
  CheckCircle2,
  Dumbbell,
  ShieldCheck,
  Flame,
  Shield,
  CheckSquare,
  RefreshCw,
  Bell,
  Sun,
} from 'lucide-react';
import { ViewTab, Label, User } from '../types';

interface SidebarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  labels: Label[];
  selectedLabelId: number | null;
  onSelectLabel: (id: number | null) => void;
  onOpenLabelManager: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  notesCount?: number;
  archiveCount?: number;
  trashCount?: number;
  pdfCount?: number;
  currentUser?: User | null;
  onOpenNotificationModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  labels,
  selectedLabelId,
  onSelectLabel,
  onOpenLabelManager,
  isMobileOpen,
  onCloseMobile,
  notesCount,
  archiveCount,
  trashCount,
  pdfCount,
  currentUser,
  onOpenNotificationModal,
}) => {
  const navItems = [
    { id: 'dashboard' as ViewTab, label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'tasks' as ViewTab, label: 'Menu Tarefas', icon: CheckSquare },
    { id: 'notes' as ViewTab, label: 'Notas (Keep)', icon: FileText, count: notesCount },
    { id: 'workouts' as ViewTab, label: 'Treinos da Academia', icon: Dumbbell },
    { id: 'fasting' as ViewTab, label: 'Jejum Intermitente', icon: Flame },
    { id: 'pdfs' as ViewTab, label: 'Central de PDFs', icon: FileCheck, count: pdfCount },
    { id: 'vault' as ViewTab, label: 'Cofre de Senhas', icon: ShieldCheck },
    { id: 'archive' as ViewTab, label: 'Arquivados', icon: FolderArchive, count: archiveCount },
    { id: 'trash' as ViewTab, label: 'Lixeira', icon: Trash2, count: trashCount },
  ];

  if (currentUser?.is_admin === 1) {
    navItems.unshift({
      id: 'admin' as ViewTab,
      label: 'Painel Admin Master',
      icon: Shield,
    });
  }

  const handleTabClick = (tab: ViewTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 space-y-6 overflow-y-auto">
          {/* Primary Navigation */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Menu Principal
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

              {onOpenNotificationModal && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      onOpenNotificationModal();
                      onCloseMobile();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300 transition border border-dashed border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-amber-500" />
                      <span>Notificações & DND</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      Config
                    </span>
                  </button>
                </div>
              )}
            </div>

          {/* Labels Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Etiquetas / Categorias
              </span>
              <button
                onClick={onOpenLabelManager}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Gerenciar Etiquetas"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => onSelectLabel(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  selectedLabelId === null
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Filter size={15} className="text-slate-400" />
                  <span>Todas as Etiquetas</span>
                </div>
              </button>

              {labels.map((lbl) => {
                const isSelected = selectedLabelId === lbl.id;
                return (
                  <button
                    key={lbl.id}
                    onClick={() => onSelectLabel(isSelected ? null : lbl.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span className="truncate">{lbl.name}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{currentUser?.is_admin === 1 ? 'SQLite Ativo' : 'Sincronização Ativa'}</span>
          </div>
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  for (let registration of registrations) {
                    registration.update();
                  }
                });
              }
              const cleanUrl = window.location.href.split('?')[0].split('#')[0];
              window.location.replace(`${cleanUrl}?v=${Date.now()}`);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition font-semibold"
            title="Atualizar Aplicativo"
          >
            <RefreshCw size={13} />
            <span>Atualizar</span>
          </button>
        </div>
      </aside>
    </>
  );
};
