import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Plus,
  Sparkles,
  ExternalLink,
  Check,
  Layers,
  ArrowRight,
  Bookmark,
  Share,
  Download,
} from 'lucide-react';

interface AndroidHomeScreenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStandaloneWidget?: () => void;
}

export const AndroidHomeScreenGuideModal: React.FC<AndroidHomeScreenGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenStandaloneWidget,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'native' | 'shortcut' | 'pwa'>('native');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const widgetUrl = `${window.location.origin}/?action=quick_note`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(widgetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Como Fixar o Widget na Tela Inicial do Android
              </h2>
              <p className="text-xs text-emerald-100">
                Acesse o criador de notas rápidas com 1 toque sem abrir o app todo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveGuideTab('native')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeGuideTab === 'native'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers size={14} />
            <span>App APK Instalado (Widgets)</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('shortcut')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeGuideTab === 'shortcut'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles size={14} />
            <span>Atalho Rápido (1 Toque)</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeGuideTab === 'pwa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Download size={14} />
            <span>Navegador Web</span>
          </button>
        </div>

        {/* Body Guide */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sm">
          {activeGuideTab === 'native' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                <Layers className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Widget Nativo do APK Android:</strong> O KeepFlow possui o componente oficial <code>AppWidgetProvider</code> integrado no APK para adicionar direto no lançador do seu Android.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Pressione um Espaço Vazio na Tela Inicial
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Vá para a tela inicial do seu celular e mantenha o dedo pressionado em qualquer área vazia por 2 segundos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Toque no Menu "Widgets"
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      O Android exibirá as opções do inicializador. Toque no ícone ou botão <strong>"Widgets"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Selecione "KeepFlow - Nota Rápida"
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Procure por <strong>KeepFlow</strong> na lista de aplicativos e arraste o widget <strong>"Nota Rápida"</strong> para onde desejar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeGuideTab === 'shortcut' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Método Mais Rápido no Android:</strong> O KeepFlow já inclui atalhos nativos na gaveta de aplicativos do seu celular.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Pressione e Segure o Ícone do App
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Na tela inicial ou na gaveta de aplicativos do seu Android, mantenha o dedo pressionado sobre o ícone do <strong>KeepFlow</strong> por 1 segundo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Selecione o Atalho "Nota Rápida"
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Um menu suspenso abrirá com a opção <strong>"Criar Nota Rápida (Widget)"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Arraste para a Tela Inicial
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Arraste essa opção diretamente para o espaço vazio da sua tela inicial. Ela funcionará como um <strong>Widget de 1 Toque</strong>!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-300">
                Adicione o link do Widget diretamente através do navegador Chrome, Samsung Internet ou Edge no seu Android.
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Abra a URL do Widget
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Clique no botão "Abrir Tela do Widget" abaixo ou copie a URL direta.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Abra o Menu do Navegador (⋮)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Toque nos 3 pontos verticais no canto superior direito do Chrome / navegador Android.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Toque em "Adicionar à Tela Inicial"
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Dê o nome de <strong>"Nota Rápida"</strong>. O Android criará o ícone dedicado na sua tela inicial!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Widget Link Box */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Link Direto do Widget
              </span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check size={12} /> : null}
                <span>{copiedLink ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
              {widgetUrl}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {onOpenStandaloneWidget && (
            <button
              onClick={() => {
                onClose();
                onOpenStandaloneWidget();
              }}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Abrir Widget Agora</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer ml-auto"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
