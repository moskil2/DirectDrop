package com.directdrop.app;

import android.content.ContentResolver;
import android.net.Uri;

import fi.iki.elonen.NanoHTTPD;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

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
    private volatile String pendingUploadName = null;
    private volatile long pendingUploadSize = 0;
    private volatile String uploadStatus = null; // "pending", "accepted", "rejected"
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
        final String pageSubtitle, uploadTitle, chooseFileBtn, dragDropHint, downloadBtn;
        final String sendingIntent, waitingConfirm, sendingFile, fileSent, errPrefix;
        final String downloading, downloaded, allDoneTitle, allDoneDesc;
        final String shutdownTitle, shutdownDesc, rejectedMsg, cancelBtn;

        PageStrings(String pageSubtitle, String uploadTitle, String chooseFileBtn,
                    String dragDropHint, String downloadBtn, String sendingIntent,
                    String waitingConfirm, String sendingFile, String fileSent,
                    String errPrefix, String downloading, String downloaded,
                    String allDoneTitle, String allDoneDesc, String shutdownTitle,
                    String shutdownDesc, String rejectedMsg, String cancelBtn) {
            this.pageSubtitle = pageSubtitle; this.uploadTitle = uploadTitle;
            this.chooseFileBtn = chooseFileBtn; this.dragDropHint = dragDropHint;
            this.downloadBtn = downloadBtn; this.sendingIntent = sendingIntent;
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
        String raw  = body.get("postData");
        String name = raw != null ? extractJsonString(raw, "name") : null;
        long   size = raw != null ? extractJsonLong(raw, "size")   : 0;

        if (name == null || name.isEmpty()) {
            Response r = newFixedLengthResponse(Response.Status.BAD_REQUEST,
                "application/json", "{\"error\":\"name required\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        pendingUploadName = name;
        pendingUploadSize = size;
        uploadStatus      = "pending";
        plugin.emitUploadIntent(name, size);

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

        String name = pendingUploadName;
        Map<String, String> files = new HashMap<>();
        try { session.parseBody(files); } catch (Exception e) {
            Response r = newFixedLengthResponse(Response.Status.INTERNAL_ERROR,
                "application/json", "{\"error\":\"parse error\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        String tmpPath = files.get("file");
        if (tmpPath == null) {
            Response r = newFixedLengthResponse(Response.Status.BAD_REQUEST,
                "application/json", "{\"error\":\"no file field\"}");
            r.addHeader("Access-Control-Allow-Origin", "*");
            return r;
        }

        uploadStatus      = null;
        pendingUploadName = null;
        pendingUploadSize = 0;

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
        sb.append("body.light .sub{color:#666}body.dark .sub{color:#a8a49a}");
        sb.append(".file{display:flex;align-items:center;gap:12px;border-radius:14px;padding:14px 16px;margin-bottom:10px;transition:background .3s,border-color .3s}");
        sb.append("body.light .file{background:#fff;border:1.5px solid #e8e6e1}");
        sb.append("body.dark .file{background:#1f2128;border:1.5px solid rgba(255,255,255,.08)}");
        sb.append(".finfo{flex:1;min-width:0}");
        sb.append(".fname{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}");
        sb.append(".fsize{font-size:12px;margin-top:2px}");
        sb.append("body.light .fsize{color:#888}body.dark .fsize{color:#6f6d66}");
        sb.append(".btn{display:inline-flex;align-items:center;gap:6px;background:#1f6feb;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;flex-shrink:0}");
        sb.append(".btn:hover{background:#1a60d6}");
        sb.append(".prog{height:4px;border-radius:4px;margin-top:10px;overflow:hidden;display:none;transition:background .3s}");
        sb.append("body.light .prog{background:#e8e6e1}body.dark .prog{background:#262932}");
        sb.append(".prog-bar{height:100%;background:#1f6feb;border-radius:4px;width:0;transition:width .25s linear}");
        sb.append(".prog-bar.done{background:#3ec27a}");
        sb.append(".status{font-size:12px;margin-top:4px;display:none}");
        sb.append("body.light .status{color:#888}body.dark .status{color:#a8a49a}");
        sb.append("footer{margin-top:32px;padding-top:14px;border-top:1px solid #e8e6e1;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#999}");
        sb.append("body.dark footer{border-top-color:rgba(255,255,255,.08);color:#6f6d66}");
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
        sb.append("</style></head>");
        sb.append("<body class='").append(isDark ? "dark" : "light").append("'>");
        sb.append("<div style='display:flex;align-items:center;gap:14px;margin-bottom:24px'>");
        sb.append("<img src='data:image/png;base64,").append(ICON_HEADER_B64).append("' style='width:52px;height:52px;border-radius:14px;flex-shrink:0' alt='DirectDrop'>");
        sb.append("<div><h1 style='margin:0 0 2px'>DirectDrop</h1><p class='sub' style='margin:0'>").append(escapeHtml(s.pageSubtitle)).append("</p></div>");
        sb.append("</div>");
        sb.append("<div id='files'>");

        synchronized (files) {
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
        sb.append("<input type='file' id='upIn' style='display:none' onchange='onUpSel(this)'>");
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
        sb.append("<footer><span>Created by Tomasz Pieczara</span><span>DirectDrop V0.36</span></footer>");
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
        sb.append("if(fl&&fl.children.length===0){");
        sb.append("fl.innerHTML='<div class=\"all-done\">'");
        sb.append("+'<div class=\"chk\">&#10003;</div>'");
        sb.append("+'<h3>'+TR.allDoneTitle+'</h3>'");
        sb.append("+'<p>'+TR.allDoneDesc+'</p>'");
        sb.append("+'</div>';}}");
        sb.append("function showShutdown(){");
        sb.append("document.body.innerHTML=");
        sb.append("'<div style=\"min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px\">'");
        sb.append("+'<img src=\"data:image/png;base64,").append(ICON_HEADER_B64).append("\" style=\"width:80px;height:80px;border-radius:22px;margin-bottom:24px\" alt=\"DirectDrop\">'");
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
        sb.append("var _upFile=null,_upPoll=null;");
        sb.append("function onDragOver(e){e.preventDefault();e.stopPropagation();document.getElementById('dropZone').classList.add('over');}");
        sb.append("function onDragLeave(e){e.preventDefault();e.stopPropagation();document.getElementById('dropZone').classList.remove('over');}");
        sb.append("function onDrop(e){e.preventDefault();e.stopPropagation();document.getElementById('dropZone').classList.remove('over');var dt=e.dataTransfer;if(dt&&dt.files&&dt.files.length){handleFile(dt.files[0]);}}");
        sb.append("function handleFile(f){_upFile=f;");
        sb.append("document.getElementById('upName').textContent=_upFile.name;");
        sb.append("document.getElementById('upSz').textContent=fmtSz(_upFile.size);");
        sb.append("document.getElementById('upArea').style.display='none';");
        sb.append("document.getElementById('upSt').style.display='block';");
        sb.append("document.getElementById('upMsg').textContent=TR.sendingIntent;");
        sb.append("fetch('/api/upload-intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:_upFile.name,size:_upFile.size})})");
        sb.append(".then(function(r){return r.json();}).then(function(){");
        sb.append("document.getElementById('upMsg').textContent=TR.waitingConfirm;");
        sb.append("_upPoll=setInterval(pollUpSt,1000);");
        sb.append("}).catch(function(e){document.getElementById('upMsg').textContent=TR.errPrefix+e.message;});}");
        sb.append("function onUpSel(inp){if(!inp.files.length)return;handleFile(inp.files[0]);}");
        sb.append("function pollUpSt(){fetch('/api/upload-status').then(function(r){return r.json();}).then(function(d){");
        sb.append("if(d.status==='accepted'){clearInterval(_upPoll);_upPoll=null;");
        sb.append("document.getElementById('upMsg').textContent=TR.sendingFile;sendUp();}");
        sb.append("else if(d.status==='rejected'){clearInterval(_upPoll);_upPoll=null;");
        sb.append("document.getElementById('upMsg').textContent=TR.rejectedMsg;");
        sb.append("setTimeout(resetUp,2500);}}).catch(function(){});}");
        sb.append("function sendUp(){var fd=new FormData();fd.append('file',_upFile,_upFile.name);");
        sb.append("fetch('/upload',{method:'POST',body:fd}).then(function(r){return r.json();})");
        sb.append(".then(function(){document.getElementById('upMsg').textContent=TR.fileSent;setTimeout(resetUp,3000);})");
        sb.append(".catch(function(e){document.getElementById('upMsg').textContent=TR.errPrefix+e.message;});}");
        sb.append("function resetUp(){_upFile=null;if(_upPoll){clearInterval(_upPoll);_upPoll=null;}");
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
