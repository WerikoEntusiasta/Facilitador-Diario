import React, { useState, useEffect } from 'react';
import { Server, Wifi, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, X, Key, Globe, Lock } from 'lucide-react';
import { getServerUrl, setServerUrl, getServerKey, setServerKey, testServerConnection, isLocalhostUrl } from '../lib/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [url, setUrlState] = useState('');
  const [key, setKeyState] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrlState(getServerUrl());
      setKeyState(getServerKey());
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setStatus(null);
    if (url && isLocalhostUrl(url)) {
      setStatus({
        type: 'error',
        message: 'Atenção: Uso de Localhost / 127.0.0.1 é proibido. Digite o IP ou domínio público do seu servidor remoto.',
      });
      return;
    }

    setLoading(true);
    const res = await testServerConnection(url, key);
    setLoading(false);

    if (res.success) {
      setStatus({
        type: 'success',
        message: 'Servidor Remoto Ativo e Conectado!',
      });
    } else {
      setStatus({
        type: 'error',
        message: res.message,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && isLocalhostUrl(url)) {
      setStatus({
        type: 'error',
        message: 'Localhost / 127.0.0.1 é proibido. O aplicativo deve se conectar a um servidor remoto.',
      });
      return;
    }

    try {
      setServerUrl(url);
      setServerKey(key);
      
      setLoading(true);
      const test = await testServerConnection(url, key);
      setLoading(false);

      if (!test.success) {
        setStatus({
          type: 'error',
          message: `Salvo com aviso: ${test.message}`,
        });
      } else {
        setStatus({
          type: 'success',
          message: 'Configurações salvas e servidor conectado com sucesso!',
        });
        if (onConnected) onConnected();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Erro ao salvar configuração de servidor.',
      });
    }
  };

  const handleReset = () => {
    setUrlState('');
    setKeyState('');
    setServerUrl('');
    setServerKey('');
    setStatus({
      type: 'idle',
      message: 'Configuração restaurada para origem padrão.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Server className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Configurar Servidor Remoto</h2>
              <p className="text-xs text-blue-100/90">
                Conexão direta para App Android, Web Client & Docker Server
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Prohibited Localhost Notice */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Conexão Remota Obrigatória:</strong>
              Localhost (127.0.0.1) é estritamente proibido. Insira o IP do seu servidor Docker/VPS (ex: <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">http://45.167.187.80:8948</code>) ou o seu domínio HTTPS.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              URL do Servidor Remoto + Porta
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrlState(e.target.value)}
              placeholder="http://45.167.187.80:8948 ou https://keepflow.seu-dominio.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Deixe em branco para usar a origem da hospedagem web.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-600" />
              Senha / Chave de Acesso do Servidor (Opcional)
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKeyState(e.target.value)}
              placeholder="Digite se o servidor exigir SERVER_ACCESS_KEY"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Connection Test Status Box */}
          {status && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 animate-fadeIn ${
                status.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : status.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              ) : (
                <Wifi className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Wifi className="w-4 h-4 text-blue-600" />
              )}
              Testar Conexão
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              Salvar & Conectar
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
            >
              Restaurar Configuração Padrão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
