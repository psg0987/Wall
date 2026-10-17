.class public Lcom/wsr/tycoon/Web;
.super Landroid/webkit/WebViewClient;
.source "Web.java"


# instance fields
.field private final a:Lcom/wsr/tycoon/MainActivity;


# direct methods
.method public constructor <init>(Lcom/wsr/tycoon/MainActivity;)V
    .registers 2

    .line 5
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V

    iput-object p1, p0, Lcom/wsr/tycoon/Web;->a:Lcom/wsr/tycoon/MainActivity;

    return-void
.end method

.method static mime(Ljava/lang/String;)Ljava/lang/String;
    .registers 2

    const-string v0, ".html"

    .line 26
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_b

    const-string p0, "text/html"

    return-object p0

    :cond_b
    const-string v0, ".js"

    .line 27
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_16

    const-string p0, "text/javascript"

    return-object p0

    :cond_16
    const-string v0, ".wasm"

    .line 28
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_21

    const-string p0, "application/wasm"

    return-object p0

    :cond_21
    const-string v0, ".css"

    .line 29
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_2c

    const-string p0, "text/css"

    return-object p0

    :cond_2c
    const-string v0, ".woff2"

    .line 30
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_37

    const-string p0, "font/woff2"

    return-object p0

    :cond_37
    const-string v0, ".json"

    .line 31
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_42

    const-string p0, "application/json"

    return-object p0

    :cond_42
    const-string v0, ".png"

    .line 32
    invoke-virtual {p0, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result p0

    if-eqz p0, :cond_4d

    const-string p0, "image/png"

    return-object p0

    :cond_4d
    const-string p0, "application/octet-stream"

    return-object p0
.end method


# virtual methods
.method public onReceivedError(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;Landroid/webkit/WebResourceError;)V
    .registers 4

    .line 42
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->isForMainFrame()Z

    move-result p3

    if-eqz p3, :cond_1b

    const-string p3, "appassets.androidplatform.net"

    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p2

    invoke-virtual {p2}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p3, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-eqz p2, :cond_1b

    const-string p2, "file:///android_asset/index.html"

    invoke-virtual {p1, p2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    :cond_1b
    return-void
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .registers 11

    .line 7
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p1

    const-string p2, "appassets.androidplatform.net"

    .line 8
    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    const/4 v0, 0x0

    if-nez p2, :cond_12

    return-object v0

    .line 9
    :cond_12
    invoke-virtual {p1}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object p1

    if-eqz p1, :cond_1f

    .line 10
    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result p2

    const/4 v1, 0x2

    if-ge p2, v1, :cond_21

    :cond_1f
    const-string p1, "/index.html"

    :cond_21
    const/4 p2, 0x1

    .line 11
    invoke-virtual {p1, p2}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    .line 12
    new-instance p2, Ljava/util/HashMap;

    invoke-direct {p2}, Ljava/util/HashMap;-><init>()V

    const-string v1, "Cross-Origin-Opener-Policy"

    const-string v2, "same-origin"

    .line 13
    invoke-virtual {p2, v1, v2}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    const-string v1, "Cross-Origin-Embedder-Policy"

    const-string v2, "require-corp"

    .line 14
    invoke-virtual {p2, v1, v2}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    const-string v1, "Cross-Origin-Resource-Policy"

    const-string v2, "cross-origin"

    .line 15
    invoke-virtual {p2, v1, v2}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    const-string v1, "Cache-Control"

    const-string v2, "no-cache"

    .line 16
    invoke-virtual {p2, v1, v2}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 17
    invoke-static {p1}, Lcom/wsr/tycoon/Web;->mime(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    .line 19
    :try_start_4b
    iget-object v1, p0, Lcom/wsr/tycoon/Web;->a:Lcom/wsr/tycoon/MainActivity;

    invoke-virtual {v1}, Lcom/wsr/tycoon/MainActivity;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v1

    invoke-virtual {v1, p1}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;

    move-result-object v7

    .line 20
    new-instance p1, Landroid/webkit/WebResourceResponse;

    const-string v1, "text/"

    invoke-virtual {v2, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :cond_61

    const-string v0, "utf-8"

    :cond_61
    move-object v3, v0

    const/16 v4, 0xc8

    const-string v5, "OK"

    move-object v1, p1

    move-object v6, p2

    invoke-direct/range {v1 .. v7}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V
    :try_end_6b
    .catch Ljava/lang/Exception; {:try_start_4b .. :try_end_6b} :catch_6c

    return-object p1

    .line 22
    :catch_6c
    new-instance p1, Landroid/webkit/WebResourceResponse;

    const-string v2, "text/plain"

    const-string v3, "utf-8"

    const/16 v4, 0x194

    const-string v5, "Not Found"

    new-instance v7, Ljava/io/ByteArrayInputStream;

    const/4 v0, 0x0

    new-array v0, v0, [B

    invoke-direct {v7, v0}, Ljava/io/ByteArrayInputStream;-><init>([B)V

    move-object v1, p1

    move-object v6, p2

    invoke-direct/range {v1 .. v7}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V

    return-object p1
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .registers 5

    .line 36
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p1

    const-string p2, "appassets.androidplatform.net"

    .line 37
    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-eqz p2, :cond_12

    const/4 p1, 0x0

    return p1

    .line 38
    :cond_12
    :try_start_12
    iget-object p2, p0, Lcom/wsr/tycoon/Web;->a:Lcom/wsr/tycoon/MainActivity;

    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.VIEW"

    invoke-direct {v0, v1, p1}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    invoke-virtual {p2, v0}, Lcom/wsr/tycoon/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_1e
    .catch Ljava/lang/Exception; {:try_start_12 .. :try_end_1e} :catch_1e

    :catch_1e
    const/4 p1, 0x1

    return p1
.end method
