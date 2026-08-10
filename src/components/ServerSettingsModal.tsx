import React, { useState, useEffect } from 'react';
import { Server, Wifi, Shield, CheckCircle2, AlertCircle, RefreshCw, X, Globe, Key, Laptop, Smartphone } from 'lucide-react';
import { getServerUrl, setServerUrl, getServerKey, setServerKey, testServerConnection } from '../lib/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerConfigChanged?: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  onServerConfigChanged,
}) => {
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [serverKeyInput, setServerKeyInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServerUrlInput(getServerUrl());
      setServerKeyInput(getServerKey());
      setTestResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testServerConnection(serverUrlInput, serverKeyInput);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = async () => {
    setServerUrl(serverUrlInput);
    setServerKey(serverKeyInput);
    setIsSaved(true);

    if (onServerConfigChanged) {
      onServerConfigChanged();
    }

    setTimeout(() => {
      setIsSaved(false);
      onClose();
      // Reload page to refresh all active queries with new base URL
      window.location.reload();
    }, 1200);
  };

  const handleResetDefault = () => {
    setServerUrl('');
    setServerKey('');
    setServerUrlInput('');
    setServerKeyInput('');
    setTestResult(null);
  };

  const currentActiveUrl = getServerUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Configurar Servidor Remoto</h2>
              <p className="text-xs text-blue-100">Conexão direta para App Android & Web Client</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
          {/* Active Mode Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${currentActiveUrl ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <div>
                <span className="text-xs font-bold block">
                  {currentActiveUrl ? 'Servidor Personalizado Ativo' : 'Servidor Local Padrão'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate block max-w-[260px]">
                  {currentActiveUrl || window.location.origin}
                </span>
              </div>
            </div>

            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {currentActiveUrl ? 'Remoto' : 'Origem'}
            </span>
          </div>

          {/* Explanation */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Como funciona o Sync do App Android:
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Ao digitar a URL do seu servidor Docker/VPS (ex: <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded">http://192.168.1.100:3000</code> ou <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded">https://meudominio.com</code>), o app Android faz requisições direto ao seu servidor. Qualquer nota nova ou alteração fica sincronizada no mesmo banco de dados **sem precisar atualizar o APK**!
            </p>
          </div>

          {/* Input 1: Server URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-500" /> URL do Servidor + Porta
            </label>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="ex: http://192.168.1.100:3000 ou https://meuservidor.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deixe em branco para usar a origem padrão do navegador.
            </p>
          </div>

          {/* Input 2: Server Access Key / Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-500" /> Senha / Chave de Acesso do Servidor (Opcional)
            </label>
            <input
              type="password"
              value={serverKeyInput}
              onChange={(e) => setServerKeyInput(e.target.value)}
              placeholder="Sua SERVER_ACCESS_KEY se configurada no .env"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
            />
          </div>

          {/* Test Connection Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> Testando comunicação...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-500" /> Testar Conexão com o Servidor
                </>
              )}
            </button>
          </div>

          {/* Test Result Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.data && (
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/60 font-mono text-[10px] text-emerald-800 dark:text-emerald-300">
                  Resposta: {testResult.data.appName} ({testResult.data.status})
                </div>
              )}
            </div>
          )}

          {isSaved && (
            <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold text-center animate-bounce">
              ✓ Configurações salvas! Recarregando a aplicação...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition"
          >
            Restaurar Padrão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" /> Salvar & Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
