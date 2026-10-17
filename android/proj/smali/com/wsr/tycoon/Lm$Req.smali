.class Lcom/wsr/tycoon/Lm$Req;
.super Ljava/lang/Object;
.source "Lm.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wsr/tycoon/Lm;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x8
    name = "Req"
.end annotation


# instance fields
.field volatile c:Ljava/net/HttpURLConnection;

.field volatile cancel:Z

.field volatile done:Z

.field volatile err:Ljava/lang/String;

.field volatile pn:D

.field volatile pp:D

.field volatile pps:D

.field final t:Ljava/lang/StringBuilder;

.field volatile tps:D


# direct methods
.method constructor <init>()V
    .registers 3

    .line 33
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 34
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iput-object v0, p0, Lcom/wsr/tycoon/Lm$Req;->t:Ljava/lang/StringBuilder;

    const-string v0, ""

    .line 36
    iput-object v0, p0, Lcom/wsr/tycoon/Lm$Req;->err:Ljava/lang/String;

    const-wide/high16 v0, -0x4010000000000000L    # -1.0

    .line 37
    iput-wide v0, p0, Lcom/wsr/tycoon/Lm$Req;->pp:D

    return-void
.end method
