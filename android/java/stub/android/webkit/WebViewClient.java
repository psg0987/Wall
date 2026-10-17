package android.webkit;
public class WebViewClient { public WebViewClient(){} public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r){return null;} public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){return false;} public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e){} }
