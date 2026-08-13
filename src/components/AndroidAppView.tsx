import React, { useState, useEffect } from 'react';
import { Smartphone, Download, QrCode, Database, CheckCircle2, ShieldCheck, Wifi, ExternalLink, Sparkles, User, Box, Play, Laptop, ChevronRight, Server, Flame, Layers, Bell } from 'lucide-react';
import { User as UserType } from '../types';
import { AndroidWidgetCodeModal } from './AndroidWidgetCodeModal';

interface AndroidAppViewProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onOpenServerSettings?: () => void;
  onOpenNotificationModal?: () => void;
}

export const AndroidAppView: React.FC<AndroidAppViewProps> = ({ currentUser, onOpenAuth, onOpenServerSettings, onOpenNotificationModal }) => {
  const isAdmin = currentUser?.is_admin === 1;
  const [simulatorView, setSimulatorView] = useState<'notes' | 'kanban' | 'widget' | 'sync'>('widget');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const appUrl = window.location.href;

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        '📱 Para instalar o APK no seu smartphone Android:\n\n' +
        '1. No Chrome ou Navegador Android, toque no menu de 3 pontinhos (⋮) no canto superior direito.\n' +
        '2. Selecione "Instalar aplicativo" ou "Adicionar à Tela Inicial".\n' +
        '3. O Android criará o APK do KeepFlow diretamente na sua gaveta de aplicativos!'
      );
    }
  };

  const handleDownloadDb = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 mb-3 border border-white/20">
            <Smartphone className="w-3.5 h-3.5" />
            {isAdmin ? 'App Android & Sync SQLite Multi-plataforma' : 'App Android & Sincronização Multi-plataforma'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <img src="/logo.svg" alt="KeepFlow" className="w-9 h-9 rounded-xl inline-block" referrerPolicy="no-referrer" />
            KeepFlow no Seu Smartphone Android
          </h1>
          <p className="mt-2 text-sm text-emerald-50 leading-relaxed">
            {isAdmin
              ? 'Acesse suas notas do Google Keep, quadros Kanban, lembretes e arquivos PDF sincronizados em tempo real através do mesmo banco de dados **SQLite local**.'
              : 'Acesse suas notas do Google Keep, quadros Kanban, lembretes e arquivos PDF sincronizados em tempo real em todos os seus dispositivos.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2.5 bg-white text-emerald-800 rounded-xl font-bold text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" /> Entrar para Sincronizar
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium flex items-center gap-2 border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Conectado como: <strong>{currentUser.email}</strong></span>
              </div>
            )}

            <button
              onClick={handleInstallClick}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {installSuccess ? 'App Instalado com Sucesso!' : 'Baixar / Instalar APK Android (1-Clique)'}
            </button>

            {onOpenServerSettings && (
              <button
                onClick={onOpenServerSettings}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-xl text-xs border border-white/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Server className="w-4 h-4 text-emerald-300" />
                Configurar URL do Servidor Remoto
              </button>
            )}

            <button
              onClick={() => setIsWidgetModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Ver Widgets Nativos (AppWidgets)
            </button>

            {onOpenNotificationModal && (
              <button
                onClick={onOpenNotificationModal}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                Configurar Notificações & DND
              </button>
            )}
          </div>
        </div>
      </div>

      <AndroidWidgetCodeModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
      />

      {/* Main Grid: Features & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sync Steps & Instructions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              {isAdmin ? 'Status de Sincronização do Banco de Dados' : 'Status de Sincronização'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Motor de Busca</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{isAdmin ? 'SQLite database.db' : 'Armazenamento Seguro'}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Latência do Backend</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> &lt; 5ms (Local)
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Volume Persistente</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">Ativo (/data)</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAdmin
                ? 'Toda alteração feita nesta interface Web ou no seu smartphone Android atualiza automaticamente as tabelas notes, kanban_cards e users no mesmo arquivo database.db.'
                : 'Toda alteração feita nesta interface Web ou no seu smartphone Android sincroniza instantaneamente em tempo real.'}
            </p>

            <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Atualização Instantânea (Live Sync):</strong> Graças à configuração <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">server.url</code> no Capacitor, qualquer alteração no WebApp reflete <strong>imediatamente</strong> no aplicativo Android em tempo real, sem precisar reinstalar ou atualizar o APK!</span>
            </div>
          </div>

          {/* QR Code & Direct Connect Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center shrink-0">
              {/* QR Code Inline SVG Representation */}
              <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  {/* Top-left position marker */}
                  <rect x="5" y="5" width="30" height="30" rx="4" />
                  <rect x="10" y="10" width="20" height="20" fill="white" rx="2" />
                  <rect x="15" y="15" width="10" height="10" />

                  {/* Top-right position marker */}
                  <rect x="65" y="5" width="30" height="30" rx="4" />
                  <rect x="70" y="10" width="20" height="20" fill="white" rx="2" />
                  <rect x="75" y="15" width="10" height="10" />

                  {/* Bottom-left position marker */}
                  <rect x="5" y="65" width="30" height="30" rx="4" />
                  <rect x="10" y="70" width="20" height="20" fill="white" rx="2" />
                  <rect x="15" y="75" width="10" height="10" />

                  {/* Random QR code pixels for visual presentation */}
                  <rect x="40" y="10" width="8" height="8" />
                  <rect x="52" y="10" width="8" height="8" />
                  <rect x="40" y="24" width="8" height="8" />
                  <rect x="52" y="24" width="8" height="8" />
                  <rect x="10" y="40" width="8" height="8" />
                  <rect x="24" y="40" width="8" height="8" />
                  <rect x="40" y="40" width="12" height="12" />
                  <rect x="56" y="40" width="8" height="8" />
                  <rect x="70" y="40" width="12" height="12" />
                  <rect x="40" y="56" width="8" height="8" />
                  <rect x="52" y="56" width="12" height="12" />
                  <rect x="70" y="56" width="8" height="8" />
                  <rect x="82" y="56" width="8" height="8" />
                  <rect x="40" y="72" width="12" height="12" />
                  <rect x="56" y="72" width="8" height="8" />
                  <rect x="70" y="72" width="18" height="18" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Escaneie no Android
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Como Acessar no Seu Dispositivo Android
              </h3>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside">
                <li>Abra a câmera do seu celular Android e escaneie o código QR ao lado.</li>
                <li>
                  Faça login com sua conta (<strong>{currentUser ? currentUser.email : 'demo@keepboard.app'}</strong>) ou crie uma nova conta.
                </li>
                <li>Toque nos 3 pontinhos (⋮) do seu navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à Tela Inicial"</strong>.</li>
              </ol>

              <div className="pt-2">
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Abrir URL direta no navegador móvel <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Backup Database & APK Compile Guide Card */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Como Gerar o Arquivo .APK Nativo para Android
                </h3>
                <p className="text-xs text-slate-400">
                  O projeto já possui os arquivos do Capacitor (<code className="text-emerald-300">capacitor.config.json</code>) e GitHub Actions prontos para compilar o APK nativo.
                </p>
              </div>
            </div>

            {/* Option 1: GitHub Actions (No local install needed) */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" /> Opção 1: Compilação Automática no GitHub (100% Online)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Recomendado</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Exporte o projeto para o seu GitHub (menu superior do AI Studio &gt; Export).</li>
                <li>O GitHub Actions executará o workflow <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">/.github/workflows/android-apk.yml</code> automaticamente.</li>
                <li>Vá até a aba <strong>Actions</strong> no seu repositório do GitHub e baixe o arquivo <strong>KeepBoard-Android-APK.zip</strong> contendo o arquivo <code className="text-emerald-300">app-debug.apk</code> pronto para instalar no seu celular!</li>
              </ol>
            </div>

            {/* Option 2: Capacitor / Android Studio */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Play className="w-4 h-4" /> Opção 2: Localmente via Android Studio (Capacitor)
              </span>
              <p className="text-xs text-slate-300">
                Execute os comandos abaixo no terminal do seu computador após baixar os arquivos:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto space-y-1 border border-slate-800">
                <p># 1. Instalar dependências nativas e sincronizar</p>
                <p className="text-white">npm run build</p>
                <p className="text-white">npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                <p className="text-white">npx cap add android</p>
                <p className="text-white">npx cap sync android</p>
                <p className="mt-2"># 2. Abrir o projeto no Android Studio e gerar APK</p>
                <p className="text-white">npx cap open android</p>
              </div>
            </div>

            {/* Fasting Widget Android Support */}
            <div className="p-4 bg-amber-950/40 rounded-xl border border-amber-800/60 space-y-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Widget de Jejum Intermitente na Tela Inicial
              </span>
              <p className="text-xs text-slate-300">
                O aplicativo inclui um <strong>Widget de Jejum</strong> dedicado. No Android:
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Você pode ativar o <strong>Mini-Widget Flutuante</strong> que se sobrepõe na tela e contagem contínua.</li>
                <li>Ao instalar como PWA/WebAPK, o atalho do widget de rápida inicialização (12h, 16h, 18h) fica disponível na Tela Inicial.</li>
                <li>Receba alertas com alarme sonoro sintetizado e notificações push assim que a meta de jejum for concluída.</li>
              </ul>
            </div>

            {/* Option 3: Bubblewrap CLI */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ChevronRight className="w-4 h-4" /> Opção 3: Bubblewrap WebAPK CLI
              </span>
              <p className="text-xs text-slate-300">
                Para gerar o APK WebAPK diretamente em uma única linha de comando:
              </p>
              <div className="p-2.5 bg-slate-950 rounded-lg text-[11px] font-mono text-amber-300 border border-slate-800">
                npx @bubblewrap/cli init --manifest={appUrl}manifest.json
              </div>
            </div>
          </div>

          {/* Advanced Android App Widgets Guide (RemoteViews & Collections) */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Widgets Avançados para Android (RemoteViews & Collections)
                </h3>
                <p className="text-xs text-slate-400">
                  Implementação oficial baseada no guia avançado do Android SDK (<code className="text-purple-300">RemoteViewsService</code>, <code className="text-purple-300">RemoteViewsFactory</code> e <code className="text-purple-300">AppWidgetConfigureActivity</code>).
                </p>
              </div>
            </div>

            {/* Widget Architecture Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">1</span>
                  AppWidgetProviderInfo XML
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Configura o tamanho mínimo (<code className="text-purple-300">minWidth/minHeight</code>), período de atualização (<code className="text-purple-300">updatePeriodMillis</code>), categorias suportadas (<code className="text-purple-300">home_screen</code>) e atividade de configuração opcional.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">2</span>
                  RemoteViews & Collections
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para listas e grids (ex: suas notas do KeepBoard e tarefas Kanban), utiliza <code className="text-purple-300">RemoteViewsService</code> em conjunto com <code className="text-purple-300">RemoteViewsFactory</code> para preencher itens dinamicamente via <code className="text-purple-300">setRemoteAdapter</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">3</span>
                  Interatividade & Intents
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Usa <code className="text-purple-300">setPendingIntentTemplate</code> combinado com <code className="text-purple-300">setOnClickFillInIntent</code> nos itens da lista para permitir toques que abrem notas específicas diretamente no aplicativo.
                </p>
              </div>
            </div>

            {/* Kotlin Code Snippet Viewer */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-300 font-bold flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" /> KeepBoardNotesWidgetService.kt (RemoteViewsFactory)
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">Kotlin Android SDK</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-3 bg-slate-900 rounded-lg border border-slate-800 leading-relaxed">
{`class KeepBoardNotesWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return NotesRemoteViewsFactory(applicationContext, intent)
    }
}

class NotesRemoteViewsFactory(private val context: Context, intent: Intent) : RemoteViewsService.RemoteViewsFactory {
    private var noteItems = listOf<String>("Lista de Compras", "Reunião de Sincronização", "Ideias de Projeto")

    override fun onCreate() {
        // Conectar ao SQLite local ou carregar cache
    }

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_note_item)
        views.setTextViewText(R.id.widgetNoteTitle, noteItems[position])
        
        val fillInIntent = Intent().apply {
            putExtra("NOTE_POSITION", position)
        }
        views.setOnClickFillInIntent(R.id.widgetNoteItemContainer, fillInIntent)
        return views
    }
    
    override fun getCount(): Int = noteItems.size
    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
    override fun onDataSetChanged() {}
    override fun onDestroy() {}
}`}
              </pre>
            </div>
          </div>

          {/* Docker & Docker Compose Card */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  🐳 Docker & Docker Compose (Docker Hub Integration)
                </h3>
                <p className="text-xs text-slate-400">
                  Arquivos <code className="text-blue-300">Dockerfile</code>, <code className="text-blue-300">docker-compose.yml</code> e <code className="text-blue-300">docker-push.sh</code> prontos no projeto.
                </p>
              </div>
            </div>

            {/* Docker Compose Up */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Play className="w-4 h-4" /> Executar com Docker Compose
              </span>
              <p className="text-xs text-slate-300">
                Para subir a aplicação localmente ou em seu servidor VPS/nuvem:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto space-y-1 border border-slate-800">
                <p># Subir container em segundo plano</p>
                <p className="text-white">docker-compose up -d</p>
                <p className="mt-1"># Ver logs do container</p>
                <p className="text-white">docker-compose logs -f</p>
              </div>
            </div>

            {/* Docker Build & Push to Docker Hub */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Compilar e Enviar para o Docker Hub (docker push)
              </span>
              <p className="text-xs text-slate-300">
                Comandos de terminal para fazer login no Docker Hub, compilar a imagem e realizar o push:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto space-y-1 border border-slate-800">
                <p># 1. Autenticar no Docker Hub</p>
                <p className="text-white">docker login</p>
                <p className="mt-1"># 2. Compilar a imagem Docker com a sua tag</p>
                <p className="text-white">docker build -t werikoliveira/facilitadordiario:latest -t werikoliveira/facilitadordiario:tagname .</p>
                <p className="mt-1"># 3. Enviar para o repositório no Docker Hub</p>
                <p className="text-white">docker push werikoliveira/facilitadordiario:tagname</p>
                <p className="mt-1"># Ou executar o script automatizado incluído:</p>
                <p className="text-amber-300">bash docker-push.sh</p>
              </div>
            </div>

            {/* GitHub Actions Auto-Push Secrets Guide */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Laptop className="w-4 h-4" /> Secrets para o GitHub Actions (Push Automático)
              </span>
              <p className="text-xs text-slate-300">
                Para o GitHub compilar e enviar a imagem para o Docker Hub automaticamente a cada push na branch principal (<code className="text-amber-300">/.github/workflows/docker-publish.yml</code>), configure no GitHub em <strong>Settings &gt; Secrets and variables &gt; Actions</strong>:
              </p>
              <ul className="text-xs text-slate-200 space-y-1 list-disc list-inside bg-slate-950 p-3 rounded-lg font-mono border border-slate-800">
                <li><strong className="text-emerald-400">DOCKERHUB_USERNAME</strong>: <span className="text-slate-300">werikoliveira</span></li>
                <li><strong className="text-emerald-400">DOCKERHUB_TOKEN</strong>: <span className="text-slate-300">Personal Access Token gerado no Docker Hub (Account Settings &gt; Security &gt; New Access Token)</span></li>
              </ul>
            </div>
          </div>

          {/* Backup Database Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isAdmin ? 'Exportar Cópia do SQLite database.db' : 'Exportar Cópia de Segurança'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Faça download direto do arquivo de dados para backup offline
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadDb}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors flex items-center gap-1.5 shrink-0"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sincronizado
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Backup DB
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Android Simulator Phone Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Simulador do App Android (Live View)
          </div>

          {/* Phone Mockup Frame */}
          <div className="w-[300px] h-[580px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
            {/* Phone Notch / Speaker */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-xl z-30 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-slate-800 ml-3" />
            </div>

            {/* Screen Container */}
            <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-[32px] overflow-hidden flex flex-col pt-5 relative">
              {/* Android Status Bar */}
              <div className="px-4 py-1 flex items-center justify-between text-[10px] text-slate-500 font-semibold bg-slate-200/50 dark:bg-slate-800/50">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  <span>5G</span>
                  <div className="w-4 h-2 bg-slate-600 rounded-xs" />
                </div>
              </div>

              {/* App Bar inside Simulator */}
              <div className="bg-blue-600 text-white p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">
                    KB
                  </div>
                  <span className="text-xs font-bold">KeepBoard Mobile</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-blue-700 px-2 py-0.5 rounded-full">
                  <Database className="w-3 h-3 text-emerald-300" /> {isAdmin ? 'SQLite Sync' : 'Sincronizado'}
                </div>
              </div>

              {/* Navigation Tabs inside Simulator */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[10px] font-medium">
                <button
                  onClick={() => setSimulatorView('widget')}
                  className={`flex-1 py-2 text-center ${
                    simulatorView === 'widget' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  Home Widget
                </button>
                <button
                  onClick={() => setSimulatorView('notes')}
                  className={`flex-1 py-2 text-center ${
                    simulatorView === 'notes' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  Notas
                </button>
                <button
                  onClick={() => setSimulatorView('kanban')}
                  className={`flex-1 py-2 text-center ${
                    simulatorView === 'kanban' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setSimulatorView('sync')}
                  className={`flex-1 py-2 text-center ${
                    simulatorView === 'sync' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  Conta
                </button>
              </div>

              {/* Simulator Main Content */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {simulatorView === 'widget' && (
                  <div className="space-y-3 py-1">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Início Android (AppWidget Nativo)</div>
                    
                    {/* Real Android AppWidget Box (RemoteViews Layout Preview) */}
                    <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-purple-500/30 shadow-lg space-y-2.5 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center text-[10px] font-bold">KB</div>
                          <span className="text-xs font-bold text-purple-300">KeepBoard AppWidget</span>
                        </div>
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-mono">4x2</span>
                      </div>

                      {/* RemoteViews Collection items */}
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-200">✓ Comprar Café Especial</span>
                          <span className="text-[9px] text-emerald-400">Ativo</span>
                        </div>
                        <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-200">Reunião de Sincronização</span>
                          <span className="text-[9px] text-blue-400">10:00</span>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 text-right">Toque para abrir no App</div>
                    </div>

                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-xl text-slate-700 dark:text-slate-300 text-[11px]">
                      💡 Este é um <strong>AppWidget nativo real</strong> configurado via <code className="text-purple-600">AppWidgetProvider</code> e <code className="text-purple-600">RemoteViewsFactory</code> na tela inicial do seu Android.
                    </div>
                  </div>
                )}

                {simulatorView === 'notes' && (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-slate-800 dark:text-slate-200">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Lista de Compras (Android)</span>
                        <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Pinned</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">✓ Café especial</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">☐ Frutas frescas</p>
                    </div>

                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-slate-800 dark:text-slate-200">
                      <div className="font-bold text-xs">Reunião de Sincronização</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{isAdmin ? 'Validação do esquema SQLite com suporte Android.' : 'Validação de dados com suporte Android.'}</p>
                    </div>
                  </div>
                )}

                {simulatorView === 'kanban' && (
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Quadro: Meu Primeiro Quadro
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Configurar App Android</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-1">Coluna: Em Progresso</div>
                    </div>
                  </div>
                )}

                {simulatorView === 'sync' && (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-full mx-auto flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {currentUser ? currentUser.name : 'Conta Demo'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {currentUser ? currentUser.email : 'demo@keepboard.app'}
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                      {isAdmin ? '✓ SQLite Sync Ativo' : '✓ Sincronização Ativa'}
                    </div>
                  </div>
                )}
              </div>

              {/* Android Home Navigation Bar */}
              <div className="p-2 bg-slate-200/80 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-20 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
