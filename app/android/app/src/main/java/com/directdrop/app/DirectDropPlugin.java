package com.directdrop.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;

import androidx.activity.ComponentActivity;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "DirectDrop")
public class DirectDropPlugin extends Plugin {

    private DirectDropServer httpServer;
    private final Map<String, FileEntry> registeredFiles = new HashMap<>();
    private boolean darkTheme = false;
    private String uiLang = "en";

    // ── Theme ──────────────────────────────────────────────────────────────────

    @PluginMethod
    public void setTheme(PluginCall call) {
        darkTheme = Boolean.TRUE.equals(call.getBoolean("dark", false));
        if (httpServer != null) httpServer.setDark(darkTheme);
        applySystemBarsTheme(darkTheme);
        call.resolve();
    }

    /**
     * Keeps the status/navigation bar area in sync with the app's own dark/light theme.
     * Two separate things need fixing, both because our AppTheme inherits from
     * Theme.AppCompat.DayNight:
     * 1) The bar scrim/icon appearance - handled by EdgeToEdge.enable(), the API Google
     *    recommends instead of the deprecated Window#setStatusBarColor/#setNavigationBarColor.
     * 2) The window's own background - Theme.AppCompat.DayNight resolves its default
     *    windowBackground from the *system* day/night setting, not our in-app theme, so it
     *    can mismatch our theme and show through before the WebView paints. EdgeToEdge doesn't
     *    touch this, so we set it explicitly (Window#setBackgroundDrawable isn't deprecated).
     */
    static void applySystemBarsTheme(Activity activity, boolean dark) {
        if (!(activity instanceof ComponentActivity)) return;
        ComponentActivity componentActivity = (ComponentActivity) activity;
        activity.runOnUiThread(() -> {
            int bg = Color.parseColor(dark ? "#16171c" : "#fbfaf7");
            componentActivity.getWindow().getDecorView().setBackgroundColor(bg);
            SystemBarStyle style = dark ? SystemBarStyle.dark(bg) : SystemBarStyle.light(bg, bg);
            EdgeToEdge.enable(componentActivity, style, style);
        });
    }

    private void applySystemBarsTheme(boolean dark) {
        applySystemBarsTheme(getActivity(), dark);
    }

    private static final String PREFS_NAME = "DirectDropPrefs";
    private static final String KEY_LANG   = "lang";

    @PluginMethod
    public void setLang(PluginCall call) {
        String l = call.getString("lang", "en");
        uiLang = l != null ? l : "en";
        if (httpServer != null) httpServer.setLang(uiLang);
        getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putString(KEY_LANG, uiLang).apply();
        call.resolve();
    }

    @PluginMethod
    public void getLang(PluginCall call) {
        String saved = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(KEY_LANG, null);
        JSObject ret = new JSObject();
        if (saved != null) ret.put("lang", saved); else ret.put("lang", (Object) null);
        call.resolve(ret);
    }

    // ── File Picker ────────────────────────────────────────────────────────────

    @PluginMethod
    public void pickFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, intent, "onFilesPicked");
    }

    @ActivityCallback
    private void onFilesPicked(PluginCall call, androidx.activity.result.ActivityResult result) {
        if (call == null) return;

        Intent data = result.getData();
        if (result.getResultCode() != android.app.Activity.RESULT_OK || data == null) {
            call.reject("Cancelled");
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        List<FileEntry> picked = new ArrayList<>();

        android.content.ClipData clipData = data.getClipData();
        if (clipData != null) {
            for (int i = 0; i < clipData.getItemCount(); i++) {
                Uri uri = clipData.getItemAt(i).getUri();
                if (uri != null) {
                    FileEntry entry = queryFileEntry(resolver, uri);
                    if (entry != null) picked.add(entry);
                }
            }
        } else if (data.getData() != null) {
            FileEntry entry = queryFileEntry(resolver, data.getData());
            if (entry != null) picked.add(entry);
        }

        // Store for HTTP server (merge with already-registered files so "add more" appends
        // instead of replacing; removals are synced separately via registerFiles())
        for (FileEntry fe : picked) registeredFiles.put(fe.name, fe);

        // Return to React
        JSArray arr = new JSArray();
        for (FileEntry fe : picked) {
            JSObject o = new JSObject();
            o.put("name", fe.name);
            o.put("size", fe.size);
            o.put("uri", fe.uri);
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("files", arr);
        call.resolve(ret);
    }

    private FileEntry queryFileEntry(ContentResolver resolver, Uri uri) {
        try {
            // Grant persistent permission
            getActivity().getContentResolver().takePersistableUriPermission(
                uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) {}

        String name = null;
        long size = 0;
        try (Cursor c = resolver.query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int si = c.getColumnIndex(OpenableColumns.SIZE);
                if (ni >= 0) name = c.getString(ni);
                if (si >= 0) size = c.getLong(si);
            }
        }
        if (name == null) name = uri.getLastPathSegment();
        return new FileEntry(name != null ? name : "file", size, uri.toString());
    }

    // ── Share Intent ───────────────────────────────────────────────────────────

    /** Called by React on startup to check if files were shared (cold start) */
    @PluginMethod
    public void getPendingShare(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();
        List<Uri> uris = activity.takePendingShareUris();
        JSObject ret = new JSObject();
        ret.put("files", resolveUrisToJSArray(uris));
        call.resolve(ret);
    }

    /** Called from MainActivity.onNewIntent when app is already running (hot start) */
    void handleSharedUris(List<Uri> uris) {
        if (uris == null || uris.isEmpty()) return;
        registeredFiles.clear();
        ContentResolver resolver = getContext().getContentResolver();
        for (Uri uri : uris) {
            FileEntry fe = queryFileEntry(resolver, uri);
            if (fe != null) registeredFiles.put(fe.name, fe);
        }
        if (httpServer != null) httpServer.updateFiles(registeredFiles);

        JSObject data = new JSObject();
        data.put("files", resolveUrisToJSArray(uris));
        notifyListeners("filesFromShare", data);
    }

    private JSArray resolveUrisToJSArray(List<Uri> uris) {
        JSArray arr = new JSArray();
        if (uris == null) return arr;
        ContentResolver resolver = getContext().getContentResolver();
        registeredFiles.clear();
        for (Uri uri : uris) {
            FileEntry fe = queryFileEntry(resolver, uri);
            if (fe == null) continue;
            registeredFiles.put(fe.name, fe);
            JSObject o = new JSObject();
            o.put("name", fe.name);
            o.put("size", fe.size);
            o.put("uri", fe.uri);
            arr.put(o);
        }
        return arr;
    }

    // ── HTTP Server ────────────────────────────────────────────────────────────

    @PluginMethod
    public void startServer(PluginCall call) {
        int port = call.getInt("port", 8080);

        stopExistingServer();

        String ip = getLocalIp();
        ContentResolver resolver = getContext().getContentResolver();

        httpServer = new DirectDropServer(port, ip, registeredFiles, resolver, this);
        httpServer.setDark(darkTheme);
        httpServer.setLang(uiLang);
        try {
            httpServer.start();
        } catch (Exception e) {
            call.reject("Cannot start server: " + e.getMessage());
            return;
        }

        JSObject ret = new JSObject();
        ret.put("ip", ip);
        ret.put("port", port);
        ret.put("address", "http://" + ip + ":" + port);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopServer(PluginCall call) {
        if (httpServer == null) { call.resolve(); return; }
        httpServer.notifyShutdown();
        new Thread(() -> {
            try { Thread.sleep(1500); } catch (InterruptedException ignored) {}
            stopExistingServer();
            call.resolve();
        }).start();
    }

    @PluginMethod
    public void registerFiles(PluginCall call) {
        JSArray arr = call.getArray("files");
        if (arr == null) { call.reject("files required"); return; }

        registeredFiles.clear();
        try {
            for (int i = 0; i < arr.length(); i++) {
                JSObject o = JSObject.fromJSONObject(arr.getJSONObject(i));
                String name = o.getString("name");
                long size   = o.getLong("size");
                String uri  = o.getString("uri");
                if (name != null && uri != null)
                    registeredFiles.put(name, new FileEntry(name, size, uri));
            }
        } catch (Exception e) {
            call.reject("Parse error: " + e.getMessage());
            return;
        }

        if (httpServer != null) httpServer.updateFiles(registeredFiles);
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        boolean running = (httpServer != null && httpServer.isAlive());
        String ip = getLocalIp();
        JSObject ret = new JSObject();
        ret.put("running", running);
        ret.put("ip", ip);
        ret.put("address", "http://" + ip + ":8080");
        ret.put("files", registeredFiles.size());
        call.resolve(ret);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    // ── Upload (PC → Phone) ────────────────────────────────────────────────────

    @PluginMethod
    public void confirmUpload(PluginCall call) {
        boolean accepted = Boolean.TRUE.equals(call.getBoolean("accepted", false));
        if (httpServer != null) {
            httpServer.setUploadStatus(accepted ? "accepted" : "rejected");
        }
        call.resolve();
    }

    void emitUploadIntent(List<String> names, List<Long> sizes) {
        JSArray files = new JSArray();
        for (int i = 0; i < names.size(); i++) {
            JSObject o = new JSObject();
            o.put("name", names.get(i));
            o.put("size", sizes.get(i));
            files.put(o);
        }
        JSObject data = new JSObject();
        data.put("files", files);
        data.put("total", names.size());
        notifyListeners("uploadIntent", data);
    }

    void emitUploadComplete(String name, String savedPath) {
        JSObject data = new JSObject();
        data.put("name", name);
        data.put("path", savedPath != null ? savedPath : "");
        notifyListeners("uploadComplete", data);
    }

    String saveReceivedFile(String name, File tmpFile) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/octet-stream");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = getContext().getContentResolver()
                    .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return null;
                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri);
                     InputStream is = new FileInputStream(tmpFile)) {
                    if (os == null) return null;
                    byte[] buf = new byte[65536];
                    int n;
                    while ((n = is.read(buf)) > 0) os.write(buf, 0, n);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, values, null, null);
                return "Downloads/" + name;
            } else {
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) return null;
                if (!dir.exists()) dir.mkdirs();
                File dest = new File(dir, name);
                int n = 1;
                while (dest.exists()) {
                    String base = name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name;
                    String ext  = name.contains(".") ? name.substring(name.lastIndexOf('.')) : "";
                    dest = new File(dir, base + "(" + n + ")" + ext);
                    n++;
                }
                try (InputStream is = new FileInputStream(tmpFile);
                     OutputStream os = new java.io.FileOutputStream(dest)) {
                    byte[] buf = new byte[65536];
                    int r;
                    while ((r = is.read(buf)) > 0) os.write(buf, 0, r);
                }
                return dest.getAbsolutePath();
            }
        } catch (IOException e) {
            return null;
        } finally {
            tmpFile.delete();
        }
    }

    // ── Events ─────────────────────────────────────────────────────────────────

    void emitClientConnected(java.util.Collection<DirectDropServer.ClientInfo> clients) {
        JSArray arr = new JSArray();
        for (DirectDropServer.ClientInfo c : clients) {
            JSObject o = new JSObject();
            o.put("ip", c.ip);
            o.put("userAgent", c.userAgent);
            o.put("connectedAt", c.connectedAt);
            arr.put(o);
        }
        JSObject data = new JSObject();
        data.put("count", clients.size());
        data.put("clients", arr);
        notifyListeners("clientConnected", data);
    }

    void emitFileProgress(String name, long bytesSent, long total) {
        JSObject data = new JSObject();
        data.put("name", name);
        data.put("bytesSent", bytesSent);
        data.put("total", total);
        notifyListeners("fileProgress", data);
    }

    @Override
    protected void handleOnDestroy() {
        stopExistingServer();
    }

    @PluginMethod
    public void exitApp(PluginCall call) {
        if (httpServer != null) httpServer.stop();
        httpServer = null;
        call.resolve();
        getActivity().runOnUiThread(() -> getActivity().finishAndRemoveTask());
    }

    private void stopExistingServer() {
        if (httpServer != null) {
            httpServer.stop();
            httpServer = null;
        }
    }

    private String getLocalIp() {
        // Mode 1: phone is a Wi-Fi CLIENT — WifiManager gives the correct IP
        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);
            if (wm != null && wm.isWifiEnabled()) {
                int ip4 = wm.getConnectionInfo().getIpAddress();
                if (ip4 != 0) {
                    return String.format("%d.%d.%d.%d",
                        ip4 & 0xff, (ip4 >> 8) & 0xff, (ip4 >> 16) & 0xff, (ip4 >> 24) & 0xff);
                }
            }
        } catch (Exception ignored) {}

        // Mode 2: phone is a HOTSPOT (AP mode) or Ethernet tethering
        // WifiManager returns 0 in AP mode; scan all interfaces instead.
        // Android hotspot typically assigns itself 192.168.43.1 (wlan0/ap0)
        try {
            String best = null;
            Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
            while (ifaces.hasMoreElements()) {
                NetworkInterface iface = ifaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;
                Enumeration<InetAddress> addrs = iface.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    String h = addr.getHostAddress();
                    if (h == null || h.contains(":")) continue;  // skip IPv6
                    if (h.startsWith("127.") || h.startsWith("169.254.")) continue;
                    // Prefer 192.168.x.x - that's where Android hotspot lives
                    if (h.startsWith("192.168.")) return h;
                    if (best == null) best = h;  // keep as fallback (10.x.x.x etc.)
                }
            }
            if (best != null) return best;
        } catch (Exception ignored) {}

        return "127.0.0.1";
    }

    // ── Inner data class ───────────────────────────────────────────────────────

    static class FileEntry {
        final String name;
        final long   size;
        final String uri;
        FileEntry(String name, long size, String uri) {
            this.name = name; this.size = size; this.uri = uri;
        }
    }
}
