import fs from 'fs';
import path from 'path';

export function injectNativeWidgets() {
  const androidAppDir = path.join(process.cwd(), 'android', 'app', 'src', 'main');
  if (!fs.existsSync(androidAppDir)) {
    console.log('Android main directory not found yet (Capacitor not synced).');
    return;
  }

  const javaPackageDir = path.join(androidAppDir, 'java', 'com', 'keepflow', 'app');
  const resDir = path.join(androidAppDir, 'res');
  const xmlDir = path.join(resDir, 'xml');
  const layoutDir = path.join(resDir, 'layout');
  const drawableDir = path.join(resDir, 'drawable');

  [javaPackageDir, xmlDir, layoutDir, drawableDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 1. QuickNoteWidgetProvider.java / kotlin
  const quickNoteJava = `package com.keepflow.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * KeepFlow Quick Note Widget Provider (Home Screen Native Widget)
 * Permite criar notas rápidas direto da tela inicial do celular Android.
 */
public class QuickNoteWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_note);

        // Intent to launch MainActivity with quick note action
        Intent quickNoteIntent = new Intent(context, MainActivity.class);
        quickNoteIntent.setAction(Intent.ACTION_VIEW);
        quickNoteIntent.setData(Uri.parse("keepflow://app?action=quick_note"));
        quickNoteIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId + 1000,
            quickNoteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.widget_quick_note_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.btn_widget_create_note, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_note_input_box, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
`;

  fs.writeFileSync(path.join(javaPackageDir, 'QuickNoteWidgetProvider.java'), quickNoteJava, 'utf8');

  // 2. widget_quick_note_info.xml
  const widgetInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="70dp"
    android:targetCellWidth="3"
    android:targetCellHeight="1"
    android:maxResizeWidth="400dp"
    android:maxResizeHeight="200dp"
    android:resizeMode="horizontal|vertical"
    android:minResizeWidth="140dp"
    android:minResizeHeight="60dp"
    android:updatePeriodMillis="0"
    android:previewImage="@drawable/ic_launcher_foreground"
    android:initialLayout="@layout/widget_quick_note"
    android:widgetCategory="home_screen">
</appwidget-provider>
`;

  fs.writeFileSync(path.join(xmlDir, 'widget_quick_note_info.xml'), widgetInfoXml, 'utf8');

  // 3. widget_quick_note.xml (Layout)
  const widgetLayoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_quick_note_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_card_bg"
    android:orientation="vertical"
    android:padding="12dp"
    android:clickable="true"
    android:focusable="true">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="📝 Nova Nota Rápida"
            android:textColor="#FFFFFF"
            android:textSize="14sp"
            android:textStyle="bold" />

        <Button
            android:id="@+id/btn_widget_create_note"
            android:layout_width="wrap_content"
            android:layout_height="36dp"
            android:background="@drawable/widget_btn_emerald"
            android:text="+ Criar"
            android:textColor="#FFFFFF"
            android:textSize="12sp"
            android:textStyle="bold"
            android:paddingLeft="12dp"
            android:paddingRight="12dp" />
    </LinearLayout>

    <LinearLayout
        android:id="@+id/widget_note_input_box"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:background="@drawable/widget_input_bg"
        android:padding="8dp"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="💡 Toque para escrever ou ditar por voz..."
            android:textColor="#94A3B8"
            android:textSize="11sp" />
    </LinearLayout>
</LinearLayout>
`;

  fs.writeFileSync(path.join(layoutDir, 'widget_quick_note.xml'), widgetLayoutXml, 'utf8');

  // 4. Drawables
  const widgetCardBg = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#1E293B" />
    <corners android:radius="16dp" />
    <stroke android:width="1dp" android:color="#334155" />
</shape>
`;
  fs.writeFileSync(path.join(drawableDir, 'widget_card_bg.xml'), widgetCardBg, 'utf8');

  const widgetBtnEmerald = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#059669" />
    <corners android:radius="10dp" />
</shape>
`;
  fs.writeFileSync(path.join(drawableDir, 'widget_btn_emerald.xml'), widgetBtnEmerald, 'utf8');

  const widgetInputBg = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#0F172A" />
    <corners android:radius="8dp" />
</shape>
`;
  fs.writeFileSync(path.join(drawableDir, 'widget_input_bg.xml'), widgetInputBg, 'utf8');

  // 5. Update AndroidManifest.xml to register the AppWidget receiver
  const manifestPath = path.join(androidAppDir, 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    if (!manifestContent.includes('QuickNoteWidgetProvider')) {
      const receiverXml = `
        <!-- KeepFlow Quick Note Widget Native Provider -->
        <receiver
            android:name=".QuickNoteWidgetProvider"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_quick_note_info" />
        </receiver>
      </application>`;
      
      manifestContent = manifestContent.replace('</application>', receiverXml);
      fs.writeFileSync(manifestPath, manifestContent, 'utf8');
      console.log('AndroidManifest.xml successfully updated with QuickNoteWidgetProvider!');
    }
  }

  console.log('Android Native AppWidget files successfully generated and linked!');
}

injectNativeWidgets();
