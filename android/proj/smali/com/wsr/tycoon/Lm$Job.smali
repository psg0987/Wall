.class final Lcom/wsr/tycoon/Lm$Job;
.super Ljava/lang/Object;
.source "Lm.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wsr/tycoon/Lm;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x18
    name = "Job"
.end annotation


# instance fields
.field private final k:I

.field private final lm:Lcom/wsr/tycoon/Lm;

.field private final x:Ljava/lang/Object;

.field private final y:Ljava/lang/Object;


# direct methods
.method constructor <init>(Lcom/wsr/tycoon/Lm;ILjava/lang/Object;Ljava/lang/Object;)V
    .registers 5

    .line 49
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iput p2, p0, Lcom/wsr/tycoon/Lm$Job;->k:I

    iput-object p3, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    iput-object p4, p0, Lcom/wsr/tycoon/Lm$Job;->y:Ljava/lang/Object;

    return-void
.end method


# virtual methods
.method public run()V
    .registers 5

    .line 52
    iget v0, p0, Lcom/wsr/tycoon/Lm$Job;->k:I

    packed-switch v0, :pswitch_data_5a

    goto :goto_58

    .line 59
    :pswitch_6
    :try_start_6
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v0, Ljava/net/HttpURLConnection;

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    :try_end_d
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_d} :catch_58

    goto :goto_58

    .line 58
    :pswitch_e
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v1, Lcom/wsr/tycoon/Lm$Req;

    iget-object v2, p0, Lcom/wsr/tycoon/Lm$Job;->y:Ljava/lang/Object;

    check-cast v2, Ljava/lang/String;

    invoke-virtual {v0, v1, v2}, Lcom/wsr/tycoon/Lm;->doAsk(Lcom/wsr/tycoon/Lm$Req;Ljava/lang/String;)V

    goto :goto_58

    .line 57
    :pswitch_1c
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v1, Ljava/lang/Process;

    const-wide/16 v2, 0xfa0

    invoke-virtual {v0, v1, v2, v3}, Lcom/wsr/tycoon/Lm;->waitGone(Ljava/lang/Process;J)V

    goto :goto_58

    .line 56
    :pswitch_28
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v1, Ljava/lang/Process;

    invoke-virtual {v0, v1}, Lcom/wsr/tycoon/Lm;->watch(Ljava/lang/Process;)V

    goto :goto_58

    .line 55
    :pswitch_32
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v1, Ljava/io/InputStream;

    invoke-virtual {v0, v1}, Lcom/wsr/tycoon/Lm;->drain(Ljava/io/InputStream;)V

    goto :goto_58

    .line 54
    :pswitch_3c
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v1, Ljava/lang/String;

    iget-object v2, p0, Lcom/wsr/tycoon/Lm$Job;->y:Ljava/lang/Object;

    check-cast v2, Ljava/lang/String;

    invoke-virtual {v0, v1, v2}, Lcom/wsr/tycoon/Lm;->doAdopt(Ljava/lang/String;Ljava/lang/String;)V

    goto :goto_58

    .line 53
    :pswitch_4a
    iget-object v0, p0, Lcom/wsr/tycoon/Lm$Job;->lm:Lcom/wsr/tycoon/Lm;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm$Job;->x:Ljava/lang/Object;

    check-cast v1, Ljava/lang/String;

    iget-object v2, p0, Lcom/wsr/tycoon/Lm$Job;->y:Ljava/lang/Object;

    check-cast v2, Ljava/lang/String;

    const/4 v3, 0x1

    invoke-virtual {v0, v1, v2, v3}, Lcom/wsr/tycoon/Lm;->doDownload(Ljava/lang/String;Ljava/lang/String;Z)V

    :catch_58
    :goto_58
    return-void

    nop

    :pswitch_data_5a
    .packed-switch 0x0
        :pswitch_4a
        :pswitch_3c
        :pswitch_32
        :pswitch_28
        :pswitch_1c
        :pswitch_e
        :pswitch_6
    .end packed-switch
.end method
