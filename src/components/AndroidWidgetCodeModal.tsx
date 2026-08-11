import React, { useState } from 'react';
import { Smartphone, Code, Copy, Check, X, Layers, Cpu } from 'lucide-react';

interface AndroidWidgetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidWidgetCodeModal: React.FC<AndroidWidgetCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'kotlin' | 'xml' | 'manifest'>('kotlin');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const kotlinCode = `package com.keepflow.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.keepflow.app.MainActivity
import com.keepflow.app.R

class KeepFlowWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        internal fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_keepflow_layout)

            // Intent to open web app main activity when clicked
            val pendingIntent = Intent(context, MainActivity::class.java).let { intent ->
                PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
            }
            views.setOnClickPendingIntent(R.id.widgetContainer, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}`;

  const xmlLayoutCode = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widgetContainer"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_background_rounded"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:id="@+id/widgetTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="KeepFlow Widget (Tarefas & Jejum)"
        android:textColor="@color/indigo_300"
        android:textSize="12sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widgetStatus"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="14:30:00 Restante"
        android:textColor="@android:color/white"
        android:textSize="22sp"
        android:textStyle="bold" />

</LinearLayout>`;

  const manifestCode = `<receiver
    android:name=".widgets.KeepFlowWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/keepflow_widget_info" />
</receiver>`;

  const currentText = activeTab === 'kotlin' ? kotlinCode : activeTab === 'xml' ? xmlLayoutCode : manifestCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-white rounded-3xl max-w-2xl w-full border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Código Nativo Android (AppWidget)</h2>
              <p className="text-xs text-slate-400">Kotlin, XML Layouts e Manifest para Widgets Nativos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 bg-slate-900/60 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'kotlin', label: 'AppWidgetProvider.kt', icon: Cpu },
            { id: 'xml', label: 'widget_layout.xml', icon: Code },
            { id: 'manifest', label: 'AndroidManifest.xml', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-900/40 font-mono text-xs text-emerald-300">
          <pre className="whitespace-pre-wrap">{currentText}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Compatível com Android 8.0+ (API 26+)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
