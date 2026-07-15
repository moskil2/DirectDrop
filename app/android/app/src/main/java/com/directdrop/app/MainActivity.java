package com.directdrop.app;

import com.getcapacitor.BridgeActivity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private List<Uri> pendingShareUris = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DirectDropPlugin.class);
        super.onCreate(savedInstanceState);
        extractShareUris(getIntent());
        // Sane default so the status/navigation bars aren't mismatched during the brief
        // window before React mounts and reports the actual saved theme via setTheme().
        DirectDropPlugin.applySystemBarsTheme(this, true);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        extractShareUris(intent);
        // App already running: emit event so React reacts immediately.
        // URI also stays in pendingShareUris as fallback in case React re-mounts.
        if (pendingShareUris != null && !pendingShareUris.isEmpty() && getBridge() != null) {
            DirectDropPlugin p = (DirectDropPlugin) getBridge().getPlugin("DirectDrop").getInstance();
            if (p != null) {
                p.handleSharedUris(pendingShareUris);
            }
        }
    }

    /** Called by DirectDropPlugin.getPendingShare() on app startup */
    public List<Uri> takePendingShareUris() {
        List<Uri> pending = pendingShareUris;
        pendingShareUris = null;
        return pending;
    }

    @SuppressWarnings("deprecation")
    private void extractShareUris(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_SEND.equals(action) && !Intent.ACTION_SEND_MULTIPLE.equals(action)) return;

        List<Uri> uris = new ArrayList<>();
        if (Intent.ACTION_SEND.equals(action)) {
            Uri uri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
            } else {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            }
            if (uri != null) uris.add(uri);
        } else {
            ArrayList<Uri> extra;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                extra = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri.class);
            } else {
                extra = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
            }
            if (extra != null) uris.addAll(extra);
        }
        if (!uris.isEmpty()) {
            pendingShareUris = uris;
            intent.setAction(null);
        }
    }
}
