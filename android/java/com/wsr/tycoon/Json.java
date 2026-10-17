package com.wsr.tycoon;

/** Just enough JSON reading for llama-server's streamed chunks: the first value of a key, as a string or a number. */
final class Json {
    private Json() {}

    static String str(String s, String key) {
        int i = s.indexOf(key);
        if (i < 0) return null;
        i += key.length();
        while (i < s.length() && s.charAt(i) == ' ') i++;
        if (i >= s.length() || s.charAt(i) != '"') return null;
        StringBuilder b = new StringBuilder();
        for (i++; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"') return b.toString();
            if (c != '\\') { b.append(c); continue; }
            if (++i >= s.length()) break;
            char e = s.charAt(i);
            switch (e) {
                case 'n': b.append('\n'); break;
                case 't': b.append('\t'); break;
                case 'r': b.append('\r'); break;
                case 'b': b.append('\b'); break;
                case 'f': b.append('\f'); break;
                case 'u':
                    if (i + 4 < s.length()) { b.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16)); i += 4; }
                    break;
                default: b.append(e);
            }
        }
        return null;
    }

    static double num(String s, String key) {
        int i = s.indexOf(key);
        if (i < 0) return 0;
        i += key.length();
        int j = i;
        while (j < s.length() && "+-.0123456789eE".indexOf(s.charAt(j)) >= 0) j++;
        try { return Double.parseDouble(s.substring(i, j)); } catch (Exception e) { return 0; }
    }
}
