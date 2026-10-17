package com.wsr.tycoon;

import android.webkit.JavascriptInterface;
import java.io.*;
import java.net.*;
import java.security.SecureRandom;
import java.util.*;

/**
 * On-device language model host. Runs llama.cpp's llama-server, packaged as lib/arm64-v8a/libllamasrv*.so so the
 * installer places it in the (executable) native-library directory, as a child process on 127.0.0.1; downloads GGUF
 * models into app storage; and relays streamed chat completions to the page. Every call from the page returns at once:
 * long work runs on background threads and the page polls info() / poll().
 */
public class Lm {
    private final MainActivity a;
    private Process proc;
    private volatile int port;
    private volatile String key = "";
    private volatile boolean up;
    private volatile String model = "", eng = "";
    private volatile int exit = -999;
    private volatile String herr = "";
    private final StringBuilder log = new StringBuilder();
    private volatile long dlDone, dlTotal;
    private volatile String dlState = "idle", dlErr = "", dlName = "", dlFrom = "";
    private volatile boolean dlCancel;
    private final HashMap<Integer, Req> reqs = new HashMap<Integer, Req>();
    private int nextId = 1;
    private Boolean i8;
    private String freqs;

    static class Req {
        final StringBuilder t = new StringBuilder();
        volatile boolean done, cancel;
        volatile String err = "";
        volatile double tps, pps, pn, pp = -1;
        volatile HttpURLConnection c;
    }

    public Lm(MainActivity a) { this.a = a; }

    /** Background work without anonymous classes (keeps the bytecode simple for the dex converter). */
    static final class Job implements Runnable {
        private final Lm lm;
        private final int k;
        private final Object x, y;

        Job(Lm lm, int k, Object x, Object y) { this.lm = lm; this.k = k; this.x = x; this.y = y; }

        public void run() {
            switch (k) {
                case 0: lm.doDownload((String) x, (String) y, true); break;
                case 1: lm.doAdopt((String) x, (String) y); break;
                case 2: lm.drain((InputStream) x); break;
                case 3: lm.watch((Process) x); break;
                case 4: lm.waitGone((Process) x, 4000); break;
                case 5: lm.doAsk((Req) x, (String) y); break;
                case 6: try { ((HttpURLConnection) x).disconnect(); } catch (Exception e) { } break;
                default: break;
            }
        }
    }

    void bg(int k, Object x, Object y) { new Thread(new Job(this, k, x, y)).start(); }


    File dir() { File d = new File(a.getFilesDir(), "models"); d.mkdirs(); return d; }
    File libDir() { return new File(a.getApplicationInfo().nativeLibraryDir); }
    /** libllamasrv8.so is built for ARMv8.6 int8 matrix instructions (much faster prompt reading); the base one for ARMv8.2 + dot product. */
    File bin(boolean fast) {
        File f = new File(libDir(), "libllamasrv8.so");
        return fast && f.exists() && i8mm() ? f : new File(libDir(), "libllamasrv.so");
    }

    synchronized boolean i8mm() {
        if (i8 == null) i8 = cpuHas("i8mm");
        return i8;
    }

    /** True when every core lists the feature in /proc/cpuinfo (big and little cores of one phone could differ). */
    static boolean cpuHas(String feat) {
        BufferedReader r = null;
        try {
            r = new BufferedReader(new FileReader("/proc/cpuinfo"));
            String l;
            int n = 0;
            while ((l = r.readLine()) != null) {
                if (!l.startsWith("Features")) continue;
                n++;
                if (!(" " + l.substring(l.indexOf(':') + 1) + " ").contains(" " + feat + " ")) return false;
            }
            return n > 0;
        } catch (Exception e) {
            return false;
        } finally {
            try { if (r != null) r.close(); } catch (Exception e) { }
        }
    }

    /** Highest clock of every core (kHz), or its relative capacity when clocks cannot be read; -1 when neither can. */
    synchronized String freqs() {
        if (freqs != null) return freqs;
        int n = Runtime.getRuntime().availableProcessors();
        long[] f = new long[n];
        boolean ok = true;
        for (int i = 0; i < n; i++) { f[i] = readLong("/sys/devices/system/cpu/cpu" + i + "/cpufreq/cpuinfo_max_freq"); ok &= f[i] > 0; }
        if (!ok) {
            ok = true;
            for (int i = 0; i < n; i++) { f[i] = readLong("/sys/devices/system/cpu/cpu" + i + "/cpu_capacity"); ok &= f[i] > 0; }
        }
        StringBuilder s = new StringBuilder("[");
        for (int i = 0; i < n; i++) s.append(i > 0 ? "," : "").append(ok ? f[i] : -1);
        return freqs = s.append(']').toString();
    }

    static long readLong(String path) {
        BufferedReader r = null;
        try {
            r = new BufferedReader(new FileReader(path));
            String l = r.readLine();
            return l == null ? -1 : Long.parseLong(l.trim());
        } catch (Exception e) {
            return -1;
        } finally {
            try { if (r != null) r.close(); } catch (Exception e) { }
        }
    }

    boolean alive(Process p) {
        if (p == null) return false;
        try { p.exitValue(); return false; } catch (IllegalThreadStateException e) { return true; }
    }

    @JavascriptInterface
    public String info() {
        Process p = proc;
        boolean run = alive(p);
        StringBuilder s = new StringBuilder("{");
        s.append("\"v\":3");
        s.append(",\"freq\":").append(freqs());
        s.append(",\"bin\":").append(bin(false).exists());
        s.append(",\"fast\":").append(bin(true).getName().equals("libllamasrv8.so"));
        s.append(",\"cores\":").append(Runtime.getRuntime().availableProcessors());
        s.append(",\"free\":").append(dir().getUsableSpace());
        s.append(",\"run\":").append(run);
        s.append(",\"up\":").append(up && run);
        s.append(",\"exit\":").append(exit);
        s.append(",\"herr\":").append(q(herr));
        s.append(",\"model\":").append(q(model));
        s.append(",\"eng\":").append(q(eng));
        s.append(",\"files\":[");
        File[] fs = dir().listFiles();
        boolean first = true;
        if (fs != null) for (File f : fs) {
            if (!f.getName().endsWith(".gguf")) continue;
            if (!first) s.append(',');
            first = false;
            s.append("{\"n\":").append(q(f.getName())).append(",\"s\":").append(f.length()).append('}');
        }
        s.append("],\"dl\":{\"st\":").append(q(dlState)).append(",\"n\":").append(q(dlName)).append(",\"from\":").append(q(dlFrom))
         .append(",\"d\":").append(dlDone).append(",\"t\":").append(dlTotal).append(",\"e\":").append(q(dlErr)).append('}');
        s.append(",\"log\":").append(q(tail()));
        return s.append('}').toString();
    }

    boolean busy() { return "run".equals(dlState) || "scan".equals(dlState); }

    @JavascriptInterface
    public boolean download(final String url, final String name) {
        if (busy() || !safe(name) || url == null || !url.startsWith("https://")) return false;
        dlState = "run"; dlErr = ""; dlName = name; dlFrom = "net"; dlDone = 0; dlTotal = 0; dlCancel = false;
        bg(0, url, name);
        return true;
    }

    @JavascriptInterface
    public void cancelDownload() { dlCancel = true; }

    void doDownload(String url, String name, boolean retry) {
        File out = new File(dir(), name), part = new File(dir(), name + ".part");
        try {
            long have = part.exists() ? part.length() : 0;
            HttpURLConnection c = open(url, have);
            int code = c.getResponseCode();
            if (code == 416 && retry) { c.disconnect(); part.delete(); doDownload(url, name, false); return; }
            if (code == 200) have = 0;
            else if (code != 206) throw new IOException("HTTP " + code);
            long len = c.getContentLength();
            String cl = c.getHeaderField("Content-Length");
            try { if (cl != null) len = Long.parseLong(cl.trim()); } catch (Exception e) { }
            dlTotal = len > 0 ? len + have : 0;
            dlDone = have;
            InputStream in = c.getInputStream();
            OutputStream o = new FileOutputStream(part, have > 0);
            byte[] b = new byte[1 << 16];
            int n;
            try {
                while ((n = in.read(b)) > 0) {
                    if (dlCancel) throw new IOException("cancelled");
                    o.write(b, 0, n);
                    dlDone += n;
                }
            } finally { o.close(); in.close(); c.disconnect(); }
            if (dlTotal > 0 && part.length() != dlTotal) throw new IOException("incomplete " + part.length() + "/" + dlTotal);
            if (out.exists()) out.delete();
            if (!part.renameTo(out)) throw new IOException("rename failed");
            dlState = "done";
        } catch (Exception e) {
            dlErr = String.valueOf(e.getMessage());
            dlState = dlCancel ? "idle" : "err";
        }
    }

    /** Follows redirects by hand (Hugging Face answers with a cross-host redirect to its file store). */
    static HttpURLConnection open(String url, long from) throws IOException {
        for (int i = 0; i < 8; i++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(20000);
            c.setReadTimeout(60000);
            c.setRequestProperty("User-Agent", "RaiderTycoon/1.8");
            if (from > 0) c.setRequestProperty("Range", "bytes=" + from + "-");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = c.getHeaderField("Location");
                c.disconnect();
                if (loc == null) throw new IOException("redirect without location");
                url = new URL(new URL(url), loc).toString();
                continue;
            }
            return c;
        }
        throw new IOException("too many redirects");
    }

    /**
     * Reuses a model the web engine (wllama, app 1.7) already downloaded into the page's private storage: finds a GGUF
     * file of the given architecture under app_webview and copies it into the models folder, so it is not downloaded twice.
     * The page polls info().dl: "scan" → "run" (copying) → "done", or "none" when nothing was found.
     */
    @JavascriptInterface
    public boolean adopt(final String name, final String arch) {
        if (busy() || !safe(name) || arch == null) return false;
        dlState = "scan"; dlErr = ""; dlName = name; dlFrom = "web"; dlDone = 0; dlTotal = 0; dlCancel = false;
        bg(1, name, arch);
        return true;
    }

    void doAdopt(String name, String arch) {
        File part = new File(dir(), name + ".part"), out = new File(dir(), name);
        try {
            File src = find(new File(a.getFilesDir().getParentFile(), "app_webview"), arch, 0);
            if (src == null) { dlState = "none"; return; }
            if (dir().getUsableSpace() < src.length() + (64L << 20)) { dlState = "none"; return; }
            dlTotal = src.length();
            dlState = "run";
            InputStream in = new FileInputStream(src);
            OutputStream o = new FileOutputStream(part, false);
            byte[] b = new byte[1 << 20];
            int n;
            try {
                while ((n = in.read(b)) > 0) {
                    if (dlCancel) throw new IOException("cancelled");
                    o.write(b, 0, n);
                    dlDone += n;
                }
            } finally { o.close(); in.close(); }
            if (part.length() != src.length()) throw new IOException("copy incomplete");
            if (out.exists()) out.delete();
            if (!part.renameTo(out)) throw new IOException("rename failed");
            dlState = "done";
        } catch (Exception e) {
            part.delete();
            dlErr = String.valueOf(e.getMessage());
            dlState = dlCancel ? "idle" : "err";
        }
    }

    static File find(File d, String arch, int depth) {
        if (depth > 12) return null;
        File[] fs = d.listFiles();
        if (fs == null) return null;
        for (File f : fs) {
            if (f.isDirectory()) {
                File r = find(f, arch, depth + 1);
                if (r != null) return r;
            } else if (f.length() > (100L << 20) && arch.equals(ggufArch(f))) {
                return f;
            }
        }
        return null;
    }

    /** general.architecture of a GGUF file ("GGUF", u32 version, u64 tensors, u64 kv count, then key/value pairs), or null. */
    static String ggufArch(File f) {
        InputStream in = null;
        try {
            in = new FileInputStream(f);
            byte[] b = new byte[65536];
            int n = 0, r;
            while (n < b.length && (r = in.read(b, n, b.length - n)) > 0) n += r;
            if (n < 32 || b[0] != 'G' || b[1] != 'G' || b[2] != 'U' || b[3] != 'F') return null;
            byte[] k = "general.architecture".getBytes("UTF-8");
            int i = indexOf(b, n, k);
            if (i < 0) return null;
            int p = i + k.length;
            if (p + 12 > n || le(b, p, 4) != 8) return null;
            long len = le(b, p + 4, 8);
            p += 12;
            if (len <= 0 || len > 64 || p + len > n) return null;
            return new String(b, p, (int) len, "UTF-8");
        } catch (Exception e) {
            return null;
        } finally {
            try { if (in != null) in.close(); } catch (Exception e) { }
        }
    }

    static long le(byte[] b, int p, int w) {
        long v = 0;
        for (int i = w - 1; i >= 0; i--) v = (v << 8) | (b[p + i] & 0xff);
        return v;
    }

    static int indexOf(byte[] b, int n, byte[] k) {
        outer:
        for (int i = 0; i + k.length <= n; i++) {
            for (int j = 0; j < k.length; j++) if (b[i + j] != k[j]) continue outer;
            return i;
        }
        return -1;
    }

    static boolean safe(String name) { return name != null && name.matches("[A-Za-z0-9._-]{1,120}") && !name.contains(".."); }

    @JavascriptInterface
    public boolean del(String name) {
        if (!safe(name)) return false;
        if (name.equals(model)) stop();
        new File(dir(), name + ".part").delete();
        return new File(dir(), name).delete();
    }

    /** Deletes every model file except keep (pass "" to delete all). Returns how many files were removed. */
    @JavascriptInterface
    public int clean(String keep) {
        int n = 0;
        File[] fs = dir().listFiles();
        if (fs != null) for (File f : fs) {
            if (f.getName().equals(keep) || f.getName().equals(model) || (busy() && f.getName().startsWith(dlName))) continue;
            if (f.delete()) n++;
        }
        return n;
    }

    @JavascriptInterface
    public synchronized String start(String name, int threads, int tbatch, int ctx, boolean fast, String mask, String maskb) {
        Process old = detach();
        if (old != null) { old.destroy(); waitGone(old, 3000); }
        if (!safe(name)) return "{\"ok\":false,\"e\":\"bad name\"}";
        File m = new File(dir(), name);
        if (!m.exists()) return "{\"ok\":false,\"e\":\"model missing\"}";
        File b = bin(fast);
        if (!b.exists()) return "{\"ok\":false,\"e\":\"engine missing\"}";
        try {
            ServerSocket ss = new ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"));
            port = ss.getLocalPort();
            ss.close();
            byte[] kb = new byte[16];
            new SecureRandom().nextBytes(kb);
            StringBuilder ks = new StringBuilder();
            for (byte x : kb) ks.append(String.format("%02x", x & 0xff));
            key = ks.toString();
            int t = Math.max(1, Math.min(threads, 16)), tb = Math.max(1, Math.min(tbatch, 16));
            List<String> cmd = new ArrayList<String>(Arrays.asList(b.getAbsolutePath(), "-m", m.getAbsolutePath(),
                "--host", "127.0.0.1", "--port", String.valueOf(port), "-t", String.valueOf(t), "-tb", String.valueOf(tb),
                "-c", String.valueOf(ctx), "-b", "256", "-ub", "256",
                "-np", "1", "--jinja", "-rea", "off", "--no-ui", "--no-slots", "-cram", "0"));
            // keep the work on the chosen cores (writing: -C, reading the question: -Cb); threads still move among them.
            // Reading in 256-token steps lets the page show how far the question has been read.
            if (mask != null && mask.matches("[0-9a-fA-F]{1,16}")) { cmd.add("-C"); cmd.add(mask); }
            if (maskb != null && maskb.matches("[0-9a-fA-F]{1,16}")) { cmd.add("-Cb"); cmd.add(maskb); }
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            pb.directory(dir());
            pb.environment().put("LLAMA_API_KEY", key);
            pb.environment().put("LLAMA_PARENT_WATCH", "1");
            synchronized (log) { log.setLength(0); }
            up = false;
            exit = -999;
            herr = "";
            final Process p = pb.start();
            proc = p;
            model = name;
            eng = b.getName();
            final InputStream in = p.getInputStream();
            bg(2, in, null);
            bg(3, p, null);
            return "{\"ok\":true,\"port\":" + port + ",\"eng\":" + q(eng) + "}";
        } catch (Exception e) {
            return "{\"ok\":false,\"e\":" + q(String.valueOf(e.getMessage())) + "}";
        }
    }

    synchronized Process detach() {
        Process p = proc;
        proc = null;
        up = false;
        model = "";
        return p;
    }

    void waitGone(Process p, long ms) {
        for (long t = 0; t < ms && alive(p); t += 50) {
            try { Thread.sleep(50); } catch (InterruptedException e) { return; }
        }
    }

    /** Polls /health until the model is loaded, then waits for the process to end and keeps its exit code. */
    void watch(Process p) {
        for (int i = 0; i < 900 && proc == p && !up && alive(p); i++) {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL("http://127.0.0.1:" + port + "/health").openConnection();
                c.setConnectTimeout(500);
                c.setReadTimeout(1500);
                int code = c.getResponseCode();
                c.disconnect();
                if (code == 200 && proc == p) { up = true; break; }
                if (code != 503) herr = "HTTP " + code;
            } catch (Exception e) {
                // connection refused is normal while the model loads; anything else is worth showing
                String m = String.valueOf(e.getMessage());
                if (!(e instanceof ConnectException) && !m.contains("refused")) herr = e.getClass().getSimpleName() + ": " + m;
            }
            try { Thread.sleep(250); } catch (InterruptedException e) { return; }
        }
        try {
            int x = p.waitFor();
            if (proc == p || proc == null) exit = x;
        } catch (Exception e) { }
    }

    void drain(InputStream in) {
        try {
            BufferedReader r = new BufferedReader(new InputStreamReader(in, "UTF-8"));
            String l;
            while ((l = r.readLine()) != null) {
                synchronized (log) {
                    log.append(l).append('\n');
                    if (log.length() > 12000) log.delete(0, log.length() - 8000);
                }
            }
        } catch (Exception e) { }
    }

    String tail() { synchronized (log) { int n = log.length(); return log.substring(Math.max(0, n - 1500)); } }

    @JavascriptInterface
    public void stop() {
        final Process p = detach();
        if (p == null) return;
        p.destroy();
        // make sure it is gone even if it ignores the polite signal; the page does not wait for this
        bg(4, p, null);
    }

    @JavascriptInterface
    public int ask(final String body) {
        final Req r = new Req();
        final int id;
        synchronized (reqs) {
            id = nextId++;
            reqs.put(id, r);
        }
        bg(5, r, body);
        return id;
    }

    void doAsk(Req r, String body) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL("http://127.0.0.1:" + port + "/v1/chat/completions").openConnection();
            r.c = c;
            c.setDoOutput(true);
            c.setRequestMethod("POST");
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("Authorization", "Bearer " + key);
            c.setConnectTimeout(3000);
            c.setReadTimeout(180000);
            OutputStream o = c.getOutputStream();
            o.write(body.getBytes("UTF-8"));
            o.close();
            int code = c.getResponseCode();
            if (code != 200) {
                String eb = readAll(c.getErrorStream()), m = Json.str(eb, "\"message\":");
                r.err = "HTTP " + code + " " + (m != null ? m : eb);
                return;
            }
            BufferedReader br = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
            String l;
            while (!r.cancel && (l = br.readLine()) != null) {
                if (!l.startsWith("data:")) continue;
                String d = l.substring(5).trim();
                if (d.equals("[DONE]")) break;
                if (d.startsWith("{\"error\"")) { String m = Json.str(d, "\"message\":"); r.err = m != null ? m : d; break; }
                String ct = Json.str(d, "\"content\":");
                if (ct != null) synchronized (r.t) { r.t.append(ct); }
                double tps = Json.num(d, "\"predicted_per_second\":"), pps = Json.num(d, "\"prompt_per_second\":"), pn = Json.num(d, "\"prompt_n\":");
                if (tps > 0) r.tps = tps;
                if (pps > 0) r.pps = pps;
                if (pn > 0) r.pn = pn;
                if (d.contains("\"prompt_progress\"")) {
                    double tot = Json.num(d, "\"total\":"), done = Json.num(d, "\"processed\":");
                    if (tot > 0) r.pp = Math.min(1, done / tot);
                }
            }
            br.close();
        } catch (Exception e) {
            if (!r.cancel) r.err = String.valueOf(e.getMessage());
        } finally {
            try { if (c != null) c.disconnect(); } catch (Exception e) { }
            r.done = true;
        }
    }

    @JavascriptInterface
    public String poll(int id) {
        Req r;
        synchronized (reqs) { r = reqs.get(id); }
        if (r == null) return "{\"t\":\"\",\"d\":true,\"e\":\"no request\",\"s\":0,\"p\":0,\"n\":0}";
        boolean d = r.done;
        String t;
        synchronized (r.t) { t = r.t.toString(); }
        String s = "{\"t\":" + q(t) + ",\"d\":" + d + ",\"e\":" + q(r.err) + ",\"s\":" + r.tps + ",\"p\":" + r.pps + ",\"n\":" + r.pn + ",\"pp\":" + r.pp + "}";
        if (d) synchronized (reqs) { reqs.remove(id); }
        return s;
    }

    @JavascriptInterface
    public void cancel(int id) {
        Req r;
        synchronized (reqs) { r = reqs.get(id); }
        if (r == null) return;
        r.cancel = true;
        final HttpURLConnection c = r.c;
        // disconnecting can block on the network stack; do it off the page's thread
        if (c != null) bg(6, c, null);
    }

    static String readAll(InputStream in) {
        if (in == null) return "";
        try {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] b = new byte[4096];
            int n;
            while ((n = in.read(b)) > 0 && o.size() < 4000) o.write(b, 0, n);
            in.close();
            return o.toString("UTF-8");
        } catch (Exception e) { return ""; }
    }

    static String q(String s) {
        if (s == null) return "null";
        StringBuilder b = new StringBuilder(s.length() + 2).append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n"); break;
                case '\r': b.append("\\r"); break;
                case '\t': b.append("\\t"); break;
                default:
                    if (c < 0x20 || c == 0x2028 || c == 0x2029) b.append(String.format("\\u%04x", (int) c));
                    else b.append(c);
            }
        }
        return b.append('"').toString();
    }
}
