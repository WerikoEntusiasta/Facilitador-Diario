import React, { useState } from 'react';
import { Smartphone, Code, Copy, Check, X, Layers, Cpu } from 'lucide-react';

interface AndroidWidgetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidWidgetCodeModal: React.FC<AndroidWidgetCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quick_note' | 'kotlin' | 'xml' | 'info' | 'manifest'>('quick_note');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const quickNoteKotlinCode = `package com.keepflow.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.keepflow.app.MainActivity
import com.keepflow.app.R

/**
 * KeepFlow Quick Note Widget Provider (Home Screen Widget)
 * Permite ao usuário criar notas rápidas diretamente da tela inicial do celular.
 */
class QuickNoteWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        internal fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_quick_note)

            // Intent to open quick note composer directly
            val quickNoteIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("https://ais-dev-l4g4u7bqaz6ibo5byvyh7i-215070016480.us-east5.run.app/?action=quick_note")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                101,
                quickNoteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Click listener on Quick Note Button
            views.setOnClickPendingIntent(R.id.btnQuickNote, pendingIntent)
            views.setOnClickPendingIntent(R.id.widgetQuickNoteRoot, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}`;

  const quickNoteXmlCode = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widgetQuickNoteRoot"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg_gradient"
    android:orientation="vertical"
    android:padding="12dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <ImageView
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:src="@drawable/ic_keepflow_note"
            android:tint="#10B981" />

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:layout_marginStart="8dp"
            android:text="Nota Rápida"
            android:textColor="#FFFFFF"
            android:textSize="14sp"
            android:textStyle="bold" />

        <ImageButton
            android:id="@+id/btnQuickNote"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:background="@drawable/btn_circle_emerald"
            android:src="@drawable/ic_add"
            android:tint="#0F172A" />
    </LinearLayout>

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:background="@drawable/input_fake_bg"
        android:padding="8dp"
        android:text="Toque para ditar ou digitar uma nota rápida..."
        android:textColor="#94A3B8"
        android:textSize="12sp" />

</LinearLayout>`;

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

  const widgetInfoCode = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_keepflow_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>`;

  const currentText = 
    activeTab === 'quick_note' ? quickNoteKotlinCode :
    activeTab === 'kotlin' ? kotlinCode : 
    activeTab === 'xml' ? xmlLayoutCode : 
    activeTab === 'info' ? widgetInfoCode : 
    manifestCode;

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
              <h2 className="text-base font-bold text-white">Código Nativo Android (AppWidget & Nota Rápida)</h2>
              <p className="text-xs text-slate-400">Kotlin, XML Layouts e Manifest para Widgets da Tela Inicial</p>
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
            { id: 'quick_note', label: 'QuickNoteWidgetProvider.kt', icon: Cpu },
            { id: 'kotlin', label: 'KeepFlowWidgetProvider.kt', icon: Cpu },
            { id: 'xml', label: 'widget_layout.xml', icon: Code },
            { id: 'info', label: 'keepflow_widget_info.xml', icon: Layers },
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
