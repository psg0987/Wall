package com.wsr.tycoon;
import android.content.Intent;import android.net.Uri;import android.webkit.*;import java.io.*;import java.util.HashMap;
public class Web extends WebViewClient {
  private final MainActivity a;
  public Web(MainActivity a){this.a=a;}
  public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r){
    Uri u=r.getUrl();
    if(!"appassets.androidplatform.net".equals(u.getHost())) return null;
    String p=u.getPath();
    if(p==null||p.length()<2) p="/index.html";
    p=p.substring(1);
    HashMap<String,String> h=new HashMap<String,String>();
    h.put("Cross-Origin-Opener-Policy","same-origin");
    h.put("Cross-Origin-Embedder-Policy","require-corp");
    h.put("Cross-Origin-Resource-Policy","cross-origin");
    h.put("Cache-Control","no-cache");
    String m=mime(p);
    try{
      InputStream in=a.getAssets().open(p);
      return new WebResourceResponse(m,m.startsWith("text/")?"utf-8":null,200,"OK",h,in);
    }catch(Exception e){
      return new WebResourceResponse("text/plain","utf-8",404,"Not Found",h,new ByteArrayInputStream(new byte[0]));
    }
  }
  static String mime(String p){
    if(p.endsWith(".html")) return "text/html";
    if(p.endsWith(".js")) return "text/javascript";
    if(p.endsWith(".wasm")) return "application/wasm";
    if(p.endsWith(".css")) return "text/css";
    if(p.endsWith(".woff2")) return "font/woff2";
    if(p.endsWith(".json")) return "application/json";
    if(p.endsWith(".png")) return "image/png";
    return "application/octet-stream";
  }
  public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){
    Uri u=r.getUrl();
    if("appassets.androidplatform.net".equals(u.getHost())) return false;
    try{ a.startActivity(new Intent(Intent.ACTION_VIEW,u)); }catch(Exception e){}
    return true;
  }
  public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e){
    if(r.isForMainFrame()&&"appassets.androidplatform.net".equals(r.getUrl().getHost())) v.loadUrl("file:///android_asset/index.html");
  }
}
