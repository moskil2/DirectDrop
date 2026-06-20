package com.directdrop.app;

import android.content.ContentResolver;
import android.net.Uri;

import fi.iki.elonen.NanoHTTPD;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class DirectDropServer extends NanoHTTPD {

    private final String localIp;
    private final Map<String, DirectDropPlugin.FileEntry> files;
    private final ContentResolver resolver;
    private final DirectDropPlugin plugin;
    private final Map<String, ClientInfo> connectedClients = new LinkedHashMap<>();

    static class ClientInfo {
        final String ip;
        final String userAgent;
        final long connectedAt;
        ClientInfo(String ip, String userAgent, long connectedAt) {
            this.ip = ip; this.userAgent = userAgent; this.connectedAt = connectedAt;
        }
    }
    private volatile boolean dark = false;
    private volatile String lang = "pl";
    private volatile int filesVersion = 0;
    private volatile boolean serverStopping = false;
    private volatile String uploadStatus = null; // "pending", "accepted", "rejected"
    private volatile int pendingUploadTotal = 0;
    private volatile int uploadedCount = 0;
    private final String sessionId;
    private final Map<String, long[]> progressMap = new HashMap<>();  // name → [sent, total]

    private static final String PAGE_MIME = "text/html; charset=UTF-8";
    private static final String FAVICON_B64 =
        "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";
    private static final String ICON_HEADER_B64 =
        "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";;

    DirectDropServer(int port, String localIp,
                     Map<String, DirectDropPlugin.FileEntry> files,
                     ContentResolver resolver,
                     DirectDropPlugin plugin) {
        super(port);
        this.localIp   = localIp;
        this.files     = new HashMap<>(files);
        this.resolver  = resolver;
        this.plugin    = plugin;
        this.sessionId = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    public void setDark(boolean d) { this.dark = d; }

    public void setLang(String l) { this.lang = (l != null ? l : "pl"); }

    // ── Page translations ──────────────────────────────────────────────────────

    private static class PageStrings {
        final String pageSubtitle, uploadTitle, chooseFileBtn, dragDropHint, downloadBtn, downloadAllBtn;
        final String sendingIntent, waitingConfirm, sendingFile, fileSent, errPrefix;
        final String downloading, downloaded, allDoneTitle, allDoneDesc;
        final String shutdownTitle, shutdownDesc, rejectedMsg, cancelBtn;

        PageStrings(String pageSubtitle, String uploadTitle, String chooseFileBtn,
                    String dragDropHint, String downloadBtn, String downloadAllBtn,
                    String sendingIntent, String waitingConfirm, String sendingFile,
                    String fileSent, String errPrefix, String downloading, String downloaded,
                    String allDoneTitle, String allDoneDesc, String shutdownTitle,
                    String shutdownDesc, String rejectedMsg, String cancelBtn) {
            this.pageSubtitle = pageSubtitle; this.uploadTitle = uploadTitle;
            this.chooseFileBtn = chooseFileBtn; this.dragDropHint = dragDropHint;
            this.downloadBtn = downloadBtn; this.downloadAllBtn = downloadAllBtn;
            this.sendingIntent = sendingIntent;
            this.waitingConfirm = waitingConfirm; this.sendingFile = sendingFile;
            this.fileSent = fileSent; this.errPrefix = errPrefix;
            this.downloading = downloading; this.downloaded = downloaded;
            this.allDoneTitle = allDoneTitle; this.allDoneDesc = allDoneDesc;
            this.shutdownTitle = shutdownTitle; this.shutdownDesc = shutdownDesc;
            this.rejectedMsg = rejectedMsg; this.cancelBtn = cancelBtn;
        }

        static PageStrings forLang(String lang) {
            switch (lang != null ? lang : "en") {
                case "en": return new PageStrings(
                    "Files ready to download from your phone",
                    "↑ Send file to phone",
                    "⇧ Choose file to send",
                    "or drag file here",
                    "↓ Download",
                    "↓ Download All (ZIP)",
                    "Sending request…",
                    "Waiting for confirmation on phone…",
                    "Sending file…",
                    "File sent! ✓",
                    "Error: ",
                    "Downloading...",
                    "Downloaded ✓",
                    "All files downloaded!",
                    "Transfer completed successfully",
                    "Server stopped",
                    "Transfer finished. See you next time! :)",
                    "Rejected by user.",
                    "Cancel");
                case "de": return new PageStrings(
                    "Dateien bereit zum Herunterladen",
                    "↑ Datei ans Telefon senden",
                    "⇧ Datei zum Senden auswählen",
                    "oder Datei hierher ziehen",
                    "↓ Herunterladen",
                    "↓ Alle herunterladen (ZIP)",
                    "Anfrage wird gesendet…",
                    "Warte auf Bestätigung am Telefon…",
                    "Datei wird gesendet…",
                    "Datei gesendet! ✓",
                    "Fehler: ",
                    "Wird heruntergeladen...",
                    "Heruntergeladen ✓",
                    "Alle Dateien heruntergeladen!",
                    "Übertragung erfolgreich abgeschlossen",
                    "Server beendet",
                    "Übertragung beendet. Bis zum nächsten Mal! :)",
                    "Vom Benutzer abgelehnt.",
                    "Abbrechen");
                case "fr": return new PageStrings(
                    "Fichiers prêts à télécharger",
                    "↑ Envoyer un fichier au téléphone",
                    "⇧ Choisir un fichier à envoyer",
                    "ou glisser un fichier ici",
                    "↓ Télécharger",
                    "↓ Tout télécharger (ZIP)",
                    "Envoi de la demande…",
                    "En attente de confirmation sur le téléphone…",
                    "Envoi du fichier…",
                    "Fichier envoyé ! ✓",
                    "Erreur : ",
                    "Téléchargement...",
                    "Téléchargé ✓",
                    "Tous les fichiers téléchargés !",
                    "Transfert terminé avec succès",
                    "Serveur arrêté",
                    "Transfert terminé. À bientôt ! :)",
                    "Refusé par l'utilisateur.",
                    "Annuler");
                case "es": return new PageStrings(
                    "Archivos listos para descargar",
                    "↑ Enviar archivo al teléfono",
                    "⇧ Elegir archivo a enviar",
                    "o arrastrar archivo aquí",
                    "↓ Descargar",
                    "↓ Descargar todo (ZIP)",
                    "Enviando solicitud…",
                    "Esperando confirmación en el teléfono…",
                    "Enviando archivo…",
                    "¡Archivo enviado! ✓",
                    "Error: ",
                    "Descargando...",
                    "Descargado ✓",
                    "¡Todos los archivos descargados!",
                    "Transferencia completada con éxito",
                    "Servidor detenido",
                    "Transferencia completada. ¡Hasta la próxima! :)",
                    "Rechazado por el usuario.",
                    "Cancelar");
                case "pt-BR": return new PageStrings(
                    "Arquivos prontos para baixar do seu celular",
                    "↑ Enviar arquivo para o celular",
                    "⇧ Escolher arquivo para enviar",
                    "ou arraste o arquivo aqui",
                    "↓ Baixar",
                    "↓ Baixar tudo (ZIP)",
                    "Enviando solicitação…",
                    "Aguardando confirmação no celular…",
                    "Enviando arquivo…",
                    "Arquivo enviado! ✓",
                    "Erro: ",
                    "Baixando...",
                    "Baixado ✓",
                    "Todos os arquivos baixados!",
                    "Transferência concluída com sucesso",
                    "Servidor parado",
                    "Transferência concluída. Até a próxima! :)",
                    "Rejeitado pelo usuário.",
                    "Cancelar");
                case "ar": return new PageStrings(
                    "الملفات جاهزة للتنزيل من هاتفك",
                    "↑ إرسال ملف إلى الهاتف",
                    "⇧ اختر ملفًا للإرسال",
                    "أو اسحب الملف هنا",
                    "↓ تنزيل",
                    "↓ تنزيل الكل (ZIP)",
                    "جارٍ إرسال الطلب…",
                    "في انتظار التأكيد على الهاتف…",
                    "جارٍ إرسال الملف…",
                    "تم إرسال الملف! ✓",
                    "خطأ: ",
                    "جارٍ التنزيل...",
                    "تم التنزيل ✓",
                    "تم تنزيل جميع الملفات!",
                    "اكتمل النقل بنجاح",
                    "تم إيقاف الخادم",
                    "انتهى النقل. إلى اللقاء! :)",
                    "تم الرفض من قبل المستخدم.",
                    "إلغاء");
                case "ru": return new PageStrings(
                    "Файлы готовы для скачивания с телефона",
                    "↑ Отправить файл на телефон",
                    "⇧ Выбрать файл для отправки",
                    "или перетащите файл сюда",
                    "↓ Скачать",
                    "↓ Скачать всё (ZIP)",
                    "Отправка запроса…",
                    "Ожидание подтверждения на телефоне…",
                    "Отправка файла…",
                    "Файл отправлен! ✓",
                    "Ошибка: ",
                    "Скачивание...",
                    "Скачано ✓",
                    "Все файлы скачаны!",
                    "Передача успешно завершена",
                    "Сервер остановлен",
                    "Передача завершена. До встречи! :)",
                    "Отклонено пользователем.",
                    "Отмена");
                case "id": return new PageStrings(
                    "File siap diunduh dari ponsel Anda",
                    "↑ Kirim file ke ponsel",
                    "⇧ Pilih file untuk dikirim",
                    "atau seret file di sini",
                    "↓ Unduh",
                    "↓ Unduh Semua (ZIP)",
                    "Mengirim permintaan…",
                    "Menunggu konfirmasi di ponsel…",
                    "Mengirim file…",
                    "File terkirim! ✓",
                    "Kesalahan: ",
                    "Mengunduh...",
                    "Terunduh ✓",
                    "Semua file terunduh!",
                    "Transfer berhasil diselesaikan",
                    "Server dihentikan",
                    "Transfer selesai. Sampai jumpa lagi! :)",
                    "Ditolak oleh pengguna.",
                    "Batal");
                case "ja": return new PageStrings(
                    "スマートフォンからダウンロードできるファイル",
                    "↑ スマートフォンにファイルを送信",
                    "⇧ 送信するファイルを選択",
                    "またはここにファイルをドラッグ",
                    "↓ ダウンロード",
                    "↓ すべてダウンロード (ZIP)",
                    "リクエストを送信中…",
                    "スマートフォンでの確認を待っています…",
                    "ファイルを送信中…",
                    "ファイルを送信しました！ ✓",
                    "エラー: ",
                    "ダウンロード中...",
                    "ダウンロード完了 ✓",
                    "すべてのファイルをダウンロードしました！",
                    "転送が正常に完了しました",
                    "サーバーを停止しました",
                    "転送が終了しました。またね！ :)",
                    "ユーザーによって拒否されました。",
                    "キャンセル");
                default: return new PageStrings(
                    "Pliki gotowe do pobrania z telefonu",
                    "↑ Wyślij plik na telefon",
                    "⇧ Wybierz plik do wysłania",
                    "lub przeciągnij plik tutaj",
                    "↓ Pobierz",
                    "↓ Pobierz wszystko (ZIP)",
                    "Wysyłanie zgłoszenia…",
                    "Oczekiwanie na potwierdzenie na telefonie…",
                    "Wysyłanie pliku…",
                    "Plik przesłany! ✓",
                    "Błąd: ",
                    "Pobieranie...",
                    "Pobrano ✓",
                    "Wszystkie pliki pobrane!",
                    "Transfer zakończony pomyślnie",
                    "Serwer wyłączony",
                    "Transfer zakończony. Do następnego razu! :)",
                    "Odrzucono przez użytkownika.",
                    "Anuluj");
            }
        }
    }

    public void setUploadStatus(String status) { this.uploadStatus = status; }

    void updateFiles(Map<String, DirectDropPlugin.FileEntry> newFiles) {
        synchronized (files) {
            files.clear();
            files.putAll(newFiles);
            filesVersion++;
        }
    }

    void notifyShutdown() {
        this.serverStopping = true;
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        String clientIp = session.getHeaders().get("http-client-ip");
        if (clientIp == null) clientIp = session.getHeaders().get("remote-addr");
        if (clientIp == null) clientIp = "unknown";

        if (!connectedClients.containsKey(clientIp)) {
            String userAgent = session.getHeaders().get("user-agent");
            connectedClients.put(clientIp, new ClientInfo(clientIp, userAgent != null ? userAgent : "", System.currentTimeMillis()));
            plugin.emitClientConnected(connectedClients.values());
        }

        if (uri.startsWith("/api/")) {
            return serveApi(session, uri);
        }

        if (uri.equals("/upload") && Method.POST.equals(session.getMethod())) {
            return serveUpload(session);
        }

        if (uri.equals("/zip")) {
            return serveZip();
        }

        if (uri.startsWith("/download/")) {
            String encoded = uri.substring("/download/".length());
            try {
                String filename = URLDecoder.decode(encoded, "UTF-8");
                return serveFile(clientIp, filename);
            } catch (Exception e) {
                return newFixedLengthResponse(Response.Status.BAD_REQUEST, "text/plain", "Bad filename");
            }
        }

        return newFixedLengthResponse(Response.Status.OK, PAGE_MIME, buildHtmlPage());
    }

    // ── API ────────────────────────────────────────────────────────────────────

    private Response serveApi(IHTTPSession session, String uri) {
        Response r;
        switch (uri) {
            case "/api/files":
                r = newFixedLengthResponse(Response.Status.OK, "application/json", buildFilesJson());
                break;
            case "/api/theme":
                r = newFixedLengthResponse(Response.Status.OK, "application/json",
                    "{\"dark\":" + dark + "}");
                break;
            case "/api/progress":
                r = newFixedLengthResponse(Response.Status.OK, "application/json", buildProgressJson());
                break;
            case "/api/upload-intent":
                return handleUploadIntent(session);
            case "/api/upload-status":
                return handleUploadStatus();
            default:
                r = newFixedLengthResponse(Response.Status.NOT_FOUND, "application/json",
                    "{\"error\":\"not found\"}");
        }
        r.addHeader("Access-Control-Allow-Origin", "*");
        r.addHeader("Cache-Control", "no-cache");
        return r;
    }

    private Response handleUploadIntent(IHTTPSession session) {
        Map<String, String> body = new HashMap<>();
        try { session.parseBody(body); } catch (Exception ignored) {}
        String raw = body.get("postData");

        if (raw == null || raw.isEmpty()) {
            Response r = newFixedLengthResponse(Response.Status.BAD_REQUEST,
                "application/json", "{\"error\":\"body required\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        List<String> names = new ArrayList<>();
        List<Long>   sizes = new ArrayList<>();
        try {
            JSONArray arr = new JSONObject(raw).getJSONArray("files");
            for (int i = 0; i < arr.length(); i++) {
                JSONObject f = arr.getJSONObject(i);
                String n = f.getString("name");
                if (n != null && !n.isEmpty()) {
                    names.add(n);
                    sizes.add(f.optLong("size", 0));
                }
            }
        } catch (Exception e) {
            Response r = newFixedLengthResponse(Response.Status.BAD_REQUEST,
                "application/json", "{\"error\":\"invalid json\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        if (names.isEmpty()) {
            Response r = newFixedLengthResponse(Response.Status.BAD_REQUEST,
                "application/json", "{\"error\":\"no files\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        pendingUploadTotal = names.size();
        uploadedCount      = 0;
        uploadStatus       = "pending";
        plugin.emitUploadIntent(names, sizes);

        Response r = newFixedLengthResponse(Response.Status.OK,
            "application/json", "{\"status\":\"pending\"}");
        r.addHeader("Access-Control-Allow-Origin", "*");
        r.addHeader("Cache-Control", "no-cache");
        return r;
    }

    private Response handleUploadStatus() {
        String st = uploadStatus != null ? uploadStatus : "none";
        Response r = newFixedLengthResponse(Response.Status.OK,
            "application/json", "{\"status\":\"" + st + "\"}");
        r.addHeader("Access-Control-Allow-Origin", "*");
        r.addHeader("Cache-Control", "no-cache");
        return r;
    }

    private Response serveUpload(IHTTPSession session) {
        if (!"accepted".equals(uploadStatus)) {
            Response r = newFixedLengthResponse(Response.Status.FORBIDDEN,
                "application/json", "{\"error\":\"not authorized\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        Map<String, String> files = new HashMap<>();
        try { session.parseBody(files); } catch (Exception e) {
            Response r = newFixedLengthResponse(Response.Status.INTERNAL_ERROR,
                "application/json", "{\"error\":\"parse error\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        String tmpPath = files.get("file");
        String name    = session.getParms().get("filename");
        if (name == null || name.isEmpty()) name = "upload";
        if (tmpPath == null) {
            Response r = newFixedLengthResponse(Response.Status.BAD_REQUEST,
                "application/json", "{\"error\":\"no file field\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        uploadedCount++;
        if (uploadedCount >= pendingUploadTotal) uploadStatus = null;

        String savedPath = plugin.saveReceivedFile(name, new java.io.File(tmpPath));
        plugin.emitUploadComplete(name, savedPath);

        Response r = newFixedLengthResponse(Response.Status.OK,
            "application/json", "{\"status\":\"ok\",\"name\":\"" + escapeJson(name) + "\"}");
        r.addHeader("Access-Control-Allow-Origin", "*");
        return r;
    }

    private static String extractJsonString(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start < 0) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        return end < 0 ? null : json.substring(start, end);
    }

    private static long extractJsonLong(String json, String key) {
        String search = "\"" + key + "\":";
        int start = json.indexOf(search);
        if (start < 0) return 0;
        start += search.length();
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        try { return Long.parseLong(json.substring(start, end)); } catch (Exception e) { return 0; }
    }

    private String buildFilesJson() {
        if (serverStopping) {
            return "{\"stopping\":true,\"v\":" + filesVersion + ",\"session\":\"" + sessionId + "\",\"files\":[]}";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("{\"v\":").append(filesVersion)
          .append(",\"session\":\"").append(sessionId).append("\",\"files\":[");
        boolean first = true;
        synchronized (files) {
            for (DirectDropPlugin.FileEntry fe : files.values()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("{\"name\":\"").append(escapeJson(fe.name))
                  .append("\",\"size\":").append(fe.size).append("}");
            }
        }
        return sb.append("]}").toString();
    }

    private String buildProgressJson() {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        synchronized (progressMap) {
            for (Map.Entry<String, long[]> e : progressMap.entrySet()) {
                if (!first) sb.append(",");
                first = false;
                long[] p = e.getValue();
                sb.append("{\"name\":\"").append(escapeJson(e.getKey()))
                  .append("\",\"bytesSent\":").append(p[0])
                  .append(",\"total\":").append(p[1]).append("}");
            }
        }
        return sb.append("]").toString();
    }

    // ── File streaming ─────────────────────────────────────────────────────────

    private Response serveFile(String clientIp, String filename) {
        DirectDropPlugin.FileEntry entry;
        synchronized (files) { entry = files.get(filename); }
        if (entry == null)
            return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "File not found");

        try {
            Uri contentUri = Uri.parse(entry.uri);
            InputStream raw = new BufferedInputStream(resolver.openInputStream(contentUri), 512 * 1024);
            if (raw == null)
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "text/plain", "Cannot open file");

            final String fname = filename;
            final long   fsize = entry.size;

            synchronized (progressMap) { progressMap.put(fname, new long[]{0, fsize}); }

            InputStream tracked = new InputStream() {
                long sent = 0;
                long lastNotify = 0;

                @Override public int read() throws IOException {
                    int b = raw.read();
                    if (b >= 0) tick(1);
                    return b;
                }
                @Override public int read(byte[] buf, int off, int len) throws IOException {
                    int n = raw.read(buf, off, len);
                    if (n > 0) tick(n);
                    return n;
                }
                @Override public void close() throws IOException {
                    raw.close();
                    // Emit 100% here (stream fully consumed) - not in tick() - so the phone
                    // doesn't show "done" before the browser has actually finished receiving.
                    long finalBytes = fsize > 0 ? fsize : sent;
                    synchronized (progressMap) { progressMap.put(fname, new long[]{finalBytes, finalBytes}); }
                    plugin.emitFileProgress(fname, finalBytes, finalBytes);
                }

                private void tick(int n) {
                    sent += n;
                    synchronized (progressMap) { progressMap.put(fname, new long[]{sent, fsize}); }
                    // Notify every 64 KB for live progress; never emit 100% here.
                    if (sent - lastNotify >= 65_536) {
                        plugin.emitFileProgress(fname, sent, fsize);
                        lastNotify = sent;
                    }
                }
            };

            String mime = "application/octet-stream";
            Response response = newFixedLengthResponse(Response.Status.OK, mime, tracked, fsize);
            response.addHeader("Content-Disposition",
                "attachment; filename*=UTF-8''" + encodeRfc5987(filename));
            response.addHeader("Cache-Control", "no-store");
            response.addHeader("Access-Control-Allow-Origin", "*");
            return response;

        } catch (IOException e) {
            return newFixedLengthResponse(Response.Status.INTERNAL_ERROR,
                "text/plain", "Read error: " + e.getMessage());
        }
    }

    // ── ZIP download ───────────────────────────────────────────────────────────

    private Response serveZip() {
        List<DirectDropPlugin.FileEntry> fileList;
        synchronized (files) { fileList = new ArrayList<>(files.values()); }
        if (fileList.isEmpty()) {
            return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "No files");
        }
        PipedOutputStream pipedOut = new PipedOutputStream();
        PipedInputStream pipedIn;
        try {
            pipedIn = new PipedInputStream(pipedOut, 128 * 1024);
        } catch (IOException e) {
            return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "text/plain", "Error");
        }
        new Thread(() -> {
            try {
                try (ZipOutputStream zos = new ZipOutputStream(pipedOut)) {
                    zos.setLevel(0);
                    for (DirectDropPlugin.FileEntry fe : fileList) {
                        Uri contentUri = Uri.parse(fe.uri);
                        try (InputStream is = resolver.openInputStream(contentUri)) {
                            if (is == null) continue;
                            zos.putNextEntry(new ZipEntry(fe.name));
                            byte[] buf = new byte[65536];
                            int n;
                            while ((n = is.read(buf)) > 0) zos.write(buf, 0, n);
                            zos.closeEntry();
                        } catch (IOException ignored) {}
                    }
                }
                for (DirectDropPlugin.FileEntry fe : fileList) {
                    synchronized (progressMap) { progressMap.put(fe.name, new long[]{fe.size, fe.size}); }
                    plugin.emitFileProgress(fe.name, fe.size, fe.size);
                }
            } catch (IOException e) {
                try { pipedOut.close(); } catch (IOException ignored) {}
            }
        }).start();
        Response r = newChunkedResponse(Response.Status.OK, "application/zip", pipedIn);
        r.addHeader("Content-Disposition", "attachment; filename=\"DirectDrop.zip\"");
        r.addHeader("Cache-Control", "no-store");
        r.addHeader("Access-Control-Allow-Origin", "*");
        return r;
    }

    // ── HTML download page ─────────────────────────────────────────────────────

    private String buildHtmlPage() {
        boolean isDark = this.dark;
        PageStrings s = PageStrings.forLang(this.lang);
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html lang='pl'><head>");
        sb.append("<meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>");
        sb.append("<title>DirectDrop</title>");
        sb.append("<link rel='icon' type='image/png' href='data:image/png;base64,").append(FAVICON_B64).append("'>");
        sb.append("<style>");
        sb.append("*{box-sizing:border-box;margin:0;padding:0}");
        sb.append("body{font-family:system-ui,sans-serif;padding:32px 16px;max-width:520px;margin:0 auto;transition:background .3s,color .3s}");
        sb.append("body.light{background:#fbfaf7;color:#1a1a1a}");
        sb.append("body.dark{background:#16171c;color:#f3f1ea}");
        sb.append("h1{font-size:22px;font-weight:800;margin-bottom:4px}");
        sb.append(".sub{font-size:13px;margin-bottom:24px}");
        sb.append("body.light .sub{color:#444}body.dark .sub{color:#c8c4bb}");
        sb.append(".file{display:flex;align-items:center;gap:12px;border-radius:14px;padding:14px 16px;margin-bottom:10px;transition:background .3s,border-color .3s}");
        sb.append("body.light .file{background:#fff;border:1.5px solid #e8e6e1}");
        sb.append("body.dark .file{background:#1f2128;border:1.5px solid rgba(255,255,255,.08)}");
        sb.append(".finfo{flex:1;min-width:0}");
        sb.append(".fname{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}");
        sb.append(".fsize{font-size:12px;margin-top:2px}");
        sb.append("body.light .fsize{color:#5a5755}body.dark .fsize{color:#9e9b94}");
        sb.append(".btn{display:inline-flex;align-items:center;gap:6px;background:#1f6feb;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;flex-shrink:0}");
        sb.append(".btn:hover{background:#1a60d6}");
        sb.append(".prog{height:4px;border-radius:4px;margin-top:10px;overflow:hidden;display:none;transition:background .3s}");
        sb.append("body.light .prog{background:#e8e6e1}body.dark .prog{background:#262932}");
        sb.append(".prog-bar{height:100%;background:#1f6feb;border-radius:4px;width:0;transition:width .25s linear}");
        sb.append(".prog-bar.done{background:#3ec27a}");
        sb.append(".status{font-size:12px;margin-top:4px;display:none}");
        sb.append("body.light .status{color:#5a5755}body.dark .status{color:#c8c4bb}");
        sb.append("footer{margin-top:32px;padding-top:14px;border-top:1px solid #e8e6e1;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6b6760}");
        sb.append("body.dark footer{border-top-color:rgba(255,255,255,.08);color:#9e9b94}");
        sb.append(".file{transition:opacity .45s,transform .45s}");
        sb.append(".all-done{text-align:center;padding:48px 16px}");
        sb.append(".all-done .chk{font-size:44px;line-height:1;margin-bottom:12px}");
        sb.append("body.light .all-done .chk{color:#1f9d57}body.dark .all-done .chk{color:#3ec27a}");
        sb.append(".all-done h3{font-size:18px;font-weight:800;margin:0 0 6px}");
        sb.append(".all-done p{font-size:13px;margin:0;opacity:.6}");
        sb.append(".up-sec{margin-top:28px;padding-top:20px;border-top:1px solid #e8e6e1}");
        sb.append("body.dark .up-sec{border-top-color:rgba(255,255,255,.08)}");
        sb.append(".up-title{font-size:11px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;margin-bottom:14px}");
        sb.append("body.light .up-title{color:#888}body.dark .up-title{color:#6f6d66}");
        sb.append(".btn-up{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;border-radius:12px;border:1.5px solid #1f6feb;background:transparent;color:#1f6feb;font-size:14px;font-weight:700;cursor:pointer}");
        sb.append(".btn-up:hover{background:rgba(31,111,235,.07)}");
        sb.append(".up-file{display:flex;align-items:center;gap:12px;border-radius:14px;padding:14px 16px;margin-bottom:10px}");
        sb.append("body.light .up-file{background:#fff;border:1.5px solid #e8e6e1}");
        sb.append("body.dark .up-file{background:#1f2128;border:1.5px solid rgba(255,255,255,.08)}");
        sb.append(".up-state{font-size:13px;font-weight:600;text-align:center;padding:6px 0 2px}");
        sb.append("body.light .up-state{color:#666}body.dark .up-state{color:#a8a49a}");
        sb.append(".btn-xcancel{background:none;border:none;cursor:pointer;font-size:18px;line-height:1;padding:4px;color:#999;flex-shrink:0}");
        sb.append(".drop-zone{border:1.5px dashed #aaa;border-radius:12px;padding:12px 16px;min-height:88px;text-align:center;transition:background .2s,border-color .2s;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px}");
        sb.append(".drop-zone.over{background:rgba(31,111,235,.07);border-color:#1f6feb}");
        sb.append("body.dark .drop-zone{border-color:rgba(255,255,255,.2)}");
        sb.append("body.dark .drop-zone.over{background:rgba(31,111,235,.12);border-color:#1f6feb}");
        sb.append(".drop-text{font-size:12px;font-weight:600;color:#999}");
        sb.append(".btn-all{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;border-radius:12px;background:#1f6feb;color:#fff;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:14px;border:none}");
        sb.append(".btn-all:hover{background:#1a60d6}");
        sb.append("</style></head>");
        sb.append("<body class='").append(isDark ? "dark" : "light").append("'>");
        sb.append("<div style='display:flex;align-items:center;gap:14px;margin-bottom:24px'>");
        sb.append("<img src='data:image/jpeg;base64,").append(ICON_HEADER_B64).append("' style='width:52px;height:52px;border-radius:14px;flex-shrink:0' alt='DirectDrop'>");
        sb.append("<div><h1 style='margin:0 0 2px'>DirectDrop</h1><p class='sub' style='margin:0'>").append(escapeHtml(s.pageSubtitle)).append("</p></div>");
        sb.append("</div>");
        sb.append("<div id='files'>");

        synchronized (files) {
            if (files.size() > 1) {
                sb.append("<a class='btn-all' href='/zip' download='DirectDrop.zip' onclick='startZipTrack()'>").append(escapeHtml(s.downloadAllBtn)).append("</a>");
            }
            for (DirectDropPlugin.FileEntry fe : files.values()) {
                String enc = encodeUrl(fe.name);
                String sid = safeId(fe.name);
                sb.append("<div class='file' id='f-").append(sid).append("'>");
                sb.append("<div class='finfo'>");
                sb.append("<div class='fname'>").append(escapeHtml(fe.name)).append("</div>");
                sb.append("<div class='fsize'>").append(fmtSize(fe.size)).append("</div>");
                sb.append("<div class='prog' id='prog-").append(sid).append("'>");
                sb.append("<div class='prog-bar' id='bar-").append(sid).append("'></div></div>");
                sb.append("<div class='status' id='stat-").append(sid).append("'></div>");
                sb.append("</div>");
                sb.append("<a class='btn' href='/download/").append(enc)
                  .append("' download='").append(escapeHtml(fe.name))
                  .append("' data-fname='").append(escapeHtml(fe.name))
                  .append("' onclick='startTrack(this)'>").append(escapeHtml(s.downloadBtn)).append("</a>");
                sb.append("</div>");
            }
        }

        sb.append("</div>");
        sb.append("<div class='up-sec'>");
        sb.append("<div class='up-title'>").append(escapeHtml(s.uploadTitle)).append("</div>");
        sb.append("<input type='file' id='upIn' multiple style='display:none' onchange='onUpSel(this)'>");
        sb.append("<div id='upArea'>");
        sb.append("<button class='btn-up' onclick='document.getElementById(\"upIn\").click()'>").append(escapeHtml(s.chooseFileBtn)).append("</button>");
        sb.append("<div id='dropZone' class='drop-zone' ondragover='onDragOver(event)' ondragleave='onDragLeave(event)' ondrop='onDrop(event)'>");
        sb.append("<span style='font-size:14px;color:#aaa'>&#8681;</span>");
        sb.append("<span class='drop-text'>").append(escapeHtml(s.dragDropHint)).append("</span>");
        sb.append("</div></div>");
        sb.append("<div id='upSt' style='display:none'>");
        sb.append("<div class='up-file'><div style='flex:1;min-width:0'><div class='fname' id='upName'></div><div class='fsize' id='upSz'></div></div>");
        sb.append("<button class='btn-xcancel' onclick='resetUp()' title='Anuluj'>&#10005;</button></div>");
        sb.append("<div class='up-state' id='upMsg'></div></div></div>");
        sb.append("<footer><span>Created by Tomasz Pieczara</span><span>DirectDrop V0.39</span></footer>");
        sb.append("<script>");
                sb.append("var TR={");
        sb.append("downloading:").append(jsStr(s.downloading)).append(",");
        sb.append("downloaded:").append(jsStr(s.downloaded)).append(",");
        sb.append("allDoneTitle:").append(jsStr(s.allDoneTitle)).append(",");
        sb.append("allDoneDesc:").append(jsStr(s.allDoneDesc)).append(",");
        sb.append("shutdownTitle:").append(jsStr(s.shutdownTitle)).append(",");
        sb.append("shutdownDesc:").append(jsStr(s.shutdownDesc)).append(",");
        sb.append("sendingIntent:").append(jsStr(s.sendingIntent)).append(",");
        sb.append("waitingConfirm:").append(jsStr(s.waitingConfirm)).append(",");
        sb.append("sendingFile:").append(jsStr(s.sendingFile)).append(",");
        sb.append("fileSent:").append(jsStr(s.fileSent)).append(",");
        sb.append("errPrefix:").append(jsStr(s.errPrefix)).append(",");
        sb.append("rejectedMsg:").append(jsStr(s.rejectedMsg));
        sb.append("};");
        sb.append("var FVER=").append(filesVersion).append(";var SESSION='").append(sessionId).append("';");
        // Auto-reload when server gets new files (e.g. after phone picks new files)
        sb.append("var failCount=0,shutdownShown=false;");
        sb.append("setInterval(function(){if(shutdownShown)return;fetch('/api/files').then(function(r){return r.json();}).then(function(d){failCount=0;if(d.stopping){shutdownShown=true;showShutdown();return;}if(d.session!==SESSION||d.v!==FVER)location.reload();}).catch(function(){failCount++;if(failCount>=2&&!shutdownShown){shutdownShown=true;showShutdown();}});},2000);");
        sb.append("function sid(n){return n.replace(/[^a-zA-Z0-9]/g,'_');}");
        sb.append("var active={};");
        sb.append("var startTimes={};");
        // Called when user clicks download - shows progress bar immediately
        sb.append("function startZipTrack(){document.querySelectorAll('#files a.btn').forEach(function(a){var n=a.getAttribute('data-fname');if(!n)return;active[n]=true;startTimes[n]=Date.now();var p=document.getElementById('prog-'+sid(n));var s=document.getElementById('stat-'+sid(n));if(p)p.style.display='block';if(s){s.style.display='block';s.textContent=TR.downloading;}});}");
        sb.append("function startTrack(el){");
        sb.append("var name=el.getAttribute('data-fname');");
        sb.append("active[name]=true;");
        sb.append("startTimes[name]=Date.now();");
        sb.append("var p=document.getElementById('prog-'+sid(name));");
        sb.append("var s=document.getElementById('stat-'+sid(name));");
        sb.append("if(p)p.style.display='block';");
        sb.append("if(s){s.style.display='block';s.textContent=TR.downloading;}");
        sb.append("}");
        sb.append("function fmtEta(sec){var m=Math.floor(sec/60),s=sec%60;return m+':'+(s<10?'0':'')+s;}");
        // Poll /api/progress every 500ms while downloads are active
        sb.append("function pollProgress(){");
        sb.append("if(!Object.keys(active).length)return;");
        sb.append("fetch('/api/progress').then(function(r){return r.json();}).then(function(data){");
        sb.append("data.forEach(function(f){");
        sb.append("if(!active[f.name])return;");
        sb.append("var pct=f.total>0?Math.round(f.bytesSent/f.total*100):0;");
        sb.append("var bar=document.getElementById('bar-'+sid(f.name));");
        sb.append("var stat=document.getElementById('stat-'+sid(f.name));");
        sb.append("if(bar){bar.style.width=pct+'%';if(pct>=100)bar.classList.add('done');}");
        sb.append("if(stat){if(pct>=100){stat.textContent=TR.downloaded;delete active[f.name];delete startTimes[f.name];");
        sb.append("(function(n){setTimeout(function(){");
        sb.append("var row=document.getElementById('f-'+sid(n));");
        sb.append("if(row){row.style.opacity='0';row.style.transform='translateY(-6px)';");
        sb.append("setTimeout(function(){if(row.parentNode)row.parentNode.removeChild(row);checkAllDone();},460);}");
        sb.append("},800);})(f.name);");
        sb.append("}else{");
        sb.append("var elapsed=startTimes[f.name]?(Date.now()-startTimes[f.name])/1000:0;");
        sb.append("var spd=elapsed>0.5?(f.bytesSent/elapsed/1048576).toFixed(1):'--';");
        sb.append("var rem=(elapsed>0.5&&f.bytesSent>0)?Math.round((f.total-f.bytesSent)/(f.bytesSent/elapsed)):0;");
        sb.append("var etaStr=rem>0?' · '+fmtEta(rem):'';");
        sb.append("stat.textContent=pct+'% · '+spd+' MB/s'+etaStr;}}");
        sb.append("});");
        sb.append("}).catch(function(){});");
        sb.append("}");
        sb.append("setInterval(pollProgress,500);");
        sb.append("function checkAllDone(){");
        sb.append("var fl=document.getElementById('files');");
        sb.append("if(fl&&fl.querySelectorAll('a.btn').length===0){");
        sb.append("fl.innerHTML='<div class=\"all-done\">'");
        sb.append("+'<div class=\"chk\">&#10003;</div>'");
        sb.append("+'<h3>'+TR.allDoneTitle+'</h3>'");
        sb.append("+'<p>'+TR.allDoneDesc+'</p>'");
        sb.append("+'</div>';}}");
        sb.append("function showShutdown(){");
        sb.append("document.body.innerHTML=");
        sb.append("'<div style=\"min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px\">'");
        sb.append("+'<img src=\"data:image/jpeg;base64,").append(ICON_HEADER_B64).append("\" style=\"width:80px;height:80px;border-radius:22px;margin-bottom:24px\" alt=\"DirectDrop\">'");
        sb.append("+'<div style=\"font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:8px\">DirectDrop</div>'");
        sb.append("+'<div style=\"font-size:16px;font-weight:700;margin-bottom:12px;opacity:.7\">'+TR.shutdownTitle+'</div>'");
        sb.append("+'<div style=\"font-size:14px;max-width:280px;line-height:1.55;opacity:.5\">'+TR.shutdownDesc+'</div>'");
        sb.append("+'</div>';}");
        // Poll /api/theme every 3s to sync dark/light mode from phone
        sb.append("function pollTheme(){");
        sb.append("fetch('/api/theme').then(function(r){return r.json();}).then(function(d){");
        sb.append("document.body.className=d.dark?'dark':'light';");
        sb.append("}).catch(function(){});");
        sb.append("}");
        sb.append("setInterval(pollTheme,3000);");
        sb.append("function fmtSz(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';if(b<1073741824)return(b/1048576).toFixed(1)+' MB';return(b/1073741824).toFixed(2)+' GB';}");
        sb.append("var _upQueue=[],_upIdx=0,_upPoll=null;");
        sb.append("function onDragOver(e){e.preventDefault();e.stopPropagation();document.getElementById('dropZone').classList.add('over');}");
        sb.append("function onDragLeave(e){e.preventDefault();e.stopPropagation();document.getElementById('dropZone').classList.remove('over');}");
        sb.append("function onDrop(e){e.preventDefault();e.stopPropagation();document.getElementById('dropZone').classList.remove('over');var dt=e.dataTransfer;if(dt&&dt.files&&dt.files.length){handleFiles(dt.files);}}");
        sb.append("function handleFiles(fl){_upQueue=Array.prototype.slice.call(fl);_upIdx=0;");
        sb.append("var tot=0;_upQueue.forEach(function(f){tot+=f.size;});");
        sb.append("document.getElementById('upName').textContent=_upQueue.length===1?_upQueue[0].name:_upQueue[0].name+' +'+ (_upQueue.length-1);");
        sb.append("document.getElementById('upSz').textContent=fmtSz(tot);");
        sb.append("document.getElementById('upArea').style.display='none';");
        sb.append("document.getElementById('upSt').style.display='block';");
        sb.append("document.getElementById('upMsg').textContent=TR.sendingIntent;");
        sb.append("var fArr=JSON.stringify(_upQueue.map(function(f){return {name:f.name,size:f.size};}));");
        sb.append("fetch('/api/upload-intent',{method:'POST',headers:{'Content-Type':'application/json'},body:'{\"files\":'+fArr+'}'})");
        sb.append(".then(function(r){return r.json();}).then(function(){");
        sb.append("document.getElementById('upMsg').textContent=TR.waitingConfirm;");
        sb.append("_upPoll=setInterval(pollUpSt,1000);");
        sb.append("}).catch(function(e){document.getElementById('upMsg').textContent=TR.errPrefix+e.message;});}");
        sb.append("function onUpSel(inp){if(!inp.files.length)return;handleFiles(inp.files);}");
        sb.append("function pollUpSt(){fetch('/api/upload-status').then(function(r){return r.json();}).then(function(d){");
        sb.append("if(d.status==='accepted'){clearInterval(_upPoll);_upPoll=null;uploadNext();}");
        sb.append("else if(d.status==='rejected'){clearInterval(_upPoll);_upPoll=null;");
        sb.append("document.getElementById('upMsg').textContent=TR.rejectedMsg;");
        sb.append("setTimeout(resetUp,2500);}}).catch(function(){});}");
        sb.append("function uploadNext(){if(_upIdx>=_upQueue.length){document.getElementById('upMsg').textContent=TR.fileSent;setTimeout(resetUp,3000);return;}");
        sb.append("var f=_upQueue[_upIdx];");
        sb.append("document.getElementById('upMsg').textContent=TR.sendingFile+' '+(_upIdx+1)+'/'+_upQueue.length;");
        sb.append("document.getElementById('upName').textContent=f.name;");
        sb.append("document.getElementById('upSz').textContent=fmtSz(f.size);");
        sb.append("var fd=new FormData();fd.append('filename',f.name);fd.append('file',f,f.name);");
        sb.append("fetch('/upload',{method:'POST',body:fd}).then(function(r){return r.json();})");
        sb.append(".then(function(){_upIdx++;uploadNext();})");
        sb.append(".catch(function(e){document.getElementById('upMsg').textContent=TR.errPrefix+e.message;});}");
        sb.append("function resetUp(){_upQueue=[];_upIdx=0;if(_upPoll){clearInterval(_upPoll);_upPoll=null;}");
        sb.append("document.getElementById('upIn').value='';");
        sb.append("document.getElementById('upArea').style.display='block';");
        sb.append("document.getElementById('upSt').style.display='none';}");
        sb.append("</script></body></html>");
        return sb.toString();
    }

    // ── Utilities ──────────────────────────────────────────────────────────────

    private static String jsStr(String s) {
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    private static String fmtSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1073741824) return String.format("%.1f MB", bytes / 1048576.0);
        return String.format("%.2f GB", bytes / 1073741824.0);
    }

    private static String escapeHtml(String s) {
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#39;");
    }

    private static String escapeJson(String s) {
        return s.replace("\\","\\\\").replace("\"","\\\"");
    }

    private static String safeId(String name) {
        return name.replaceAll("[^a-zA-Z0-9]", "_");
    }

    private static String encodeUrl(String s) {
        try { return java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20"); }
        catch (Exception e) { return s; }
    }

    private static String encodeRfc5987(String s) {
        try { return java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20"); }
        catch (Exception e) { return s; }
    }
}
