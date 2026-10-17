.class public Lcom/wsr/tycoon/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"


# instance fields
.field private lm:Lcom/wsr/tycoon/Lm;

.field private w:Landroid/webkit/WebView;


# direct methods
.method public constructor <init>()V
    .registers 1

    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method


# virtual methods
.method protected onCreate(Landroid/os/Bundle;)V
    .registers 7

    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    # keep the screen on while the game is in front (FLAG_KEEP_SCREEN_ON)
    invoke-virtual {p0}, Lcom/wsr/tycoon/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    const/16 v1, 0x80

    invoke-virtual {v0, v1}, Landroid/view/Window;->addFlags(I)V

    new-instance v0, Landroid/webkit/WebView;

    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V

    iput-object v0, p0, Lcom/wsr/tycoon/MainActivity;->w:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object v1

    const/4 v2, 0x1

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V

    const/16 v3, 0x64

    invoke-virtual {v1, v3}, Landroid/webkit/WebSettings;->setTextZoom(I)V

    const v3, 0xff060b13

    invoke-virtual {v0, v3}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    new-instance v3, Lcom/wsr/tycoon/Bridge;

    invoke-direct {v3, p0}, Lcom/wsr/tycoon/Bridge;-><init>(Lcom/wsr/tycoon/MainActivity;)V

    const-string v4, "Android"

    invoke-virtual {v0, v3, v4}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    # on-device language model host: runs the packaged llama.cpp server as a child process (see Lm.smali)
    new-instance v3, Lcom/wsr/tycoon/Lm;

    invoke-direct {v3, p0}, Lcom/wsr/tycoon/Lm;-><init>(Lcom/wsr/tycoon/MainActivity;)V

    iput-object v3, p0, Lcom/wsr/tycoon/MainActivity;->lm:Lcom/wsr/tycoon/Lm;

    const-string v4, "AndroidLM"

    invoke-virtual {v0, v3, v4}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    # serve the game from an https origin with cross-origin isolation (multi-core on-device AI); see Web.smali
    new-instance v3, Lcom/wsr/tycoon/Web;

    invoke-direct {v3, p0}, Lcom/wsr/tycoon/Web;-><init>(Lcom/wsr/tycoon/MainActivity;)V

    invoke-virtual {v0, v3}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    invoke-virtual {p0, v0}, Lcom/wsr/tycoon/MainActivity;->setContentView(Landroid/view/View;)V

    const-string v3, "https://appassets.androidplatform.net/index.html"

    invoke-virtual {v0, v3}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void
.end method

.method public onBackPressed()V
    .registers 4

    iget-object v0, p0, Lcom/wsr/tycoon/MainActivity;->w:Landroid/webkit/WebView;

    if-eqz v0, :cond_done

    const-string v1, "window.andBack?andBack():Android.exit()"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    :cond_done
    return-void
.end method

.method protected onPause()V
    .registers 4

    iget-object v0, p0, Lcom/wsr/tycoon/MainActivity;->w:Landroid/webkit/WebView;

    if-eqz v0, :cond_skip

    const-string v1, "window.andPause&&andPause()"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    invoke-virtual {v0}, Landroid/webkit/WebView;->onPause()V

    :cond_skip
    invoke-super {p0}, Landroid/app/Activity;->onPause()V

    return-void
.end method

.method protected onResume()V
    .registers 4

    invoke-super {p0}, Landroid/app/Activity;->onResume()V

    iget-object v0, p0, Lcom/wsr/tycoon/MainActivity;->w:Landroid/webkit/WebView;

    if-eqz v0, :cond_skip

    invoke-virtual {v0}, Landroid/webkit/WebView;->onResume()V

    const-string v1, "window.andResume&&andResume()"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    :cond_skip
    return-void
.end method

.method protected onDestroy()V
    .registers 2

    # stop the language model server with the app
    iget-object v0, p0, Lcom/wsr/tycoon/MainActivity;->lm:Lcom/wsr/tycoon/Lm;

    if-eqz v0, :cond_skip

    invoke-virtual {v0}, Lcom/wsr/tycoon/Lm;->stop()V

    :cond_skip
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V

    return-void
.end method
