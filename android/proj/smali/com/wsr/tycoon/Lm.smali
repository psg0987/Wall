.class public Lcom/wsr/tycoon/Lm;
.super Ljava/lang/Object;
.source "Lm.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/wsr/tycoon/Lm$Job;,
        Lcom/wsr/tycoon/Lm$Req;
    }
.end annotation


# instance fields
.field private final a:Lcom/wsr/tycoon/MainActivity;

.field private volatile dlCancel:Z

.field private volatile dlDone:J

.field private volatile dlErr:Ljava/lang/String;

.field private volatile dlFrom:Ljava/lang/String;

.field private volatile dlName:Ljava/lang/String;

.field private volatile dlState:Ljava/lang/String;

.field private volatile dlTotal:J

.field private volatile eng:Ljava/lang/String;

.field private volatile exit:I

.field private freqs:Ljava/lang/String;

.field private volatile herr:Ljava/lang/String;

.field private i8:Ljava/lang/Boolean;

.field private volatile key:Ljava/lang/String;

.field private final log:Ljava/lang/StringBuilder;

.field private volatile model:Ljava/lang/String;

.field private nextId:I

.field private volatile port:I

.field private proc:Ljava/lang/Process;

.field private final reqs:Ljava/util/HashMap;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/HashMap<",
            "Ljava/lang/Integer;",
            "Lcom/wsr/tycoon/Lm$Req;",
            ">;"
        }
    .end annotation
.end field

.field private volatile up:Z


# direct methods
.method public constructor <init>(Lcom/wsr/tycoon/MainActivity;)V
    .registers 3

    .line 41
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const-string v0, ""

    .line 19
    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->key:Ljava/lang/String;

    const-string v0, ""

    .line 21
    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->model:Ljava/lang/String;

    const-string v0, ""

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->eng:Ljava/lang/String;

    const/16 v0, -0x3e7

    .line 22
    iput v0, p0, Lcom/wsr/tycoon/Lm;->exit:I

    const-string v0, ""

    .line 23
    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->herr:Ljava/lang/String;

    .line 24
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    const-string v0, "idle"

    .line 26
    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    const-string v0, ""

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlErr:Ljava/lang/String;

    const-string v0, ""

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlName:Ljava/lang/String;

    const-string v0, ""

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlFrom:Ljava/lang/String;

    .line 28
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    const/4 v0, 0x1

    .line 29
    iput v0, p0, Lcom/wsr/tycoon/Lm;->nextId:I

    .line 41
    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->a:Lcom/wsr/tycoon/MainActivity;

    return-void
.end method

.method static cpuHas(Ljava/lang/String;)Z
    .registers 8

    const/4 v0, 0x0

    const/4 v1, 0x0

    .line 85
    :try_start_2
    new-instance v2, Ljava/io/BufferedReader;

    new-instance v3, Ljava/io/FileReader;

    const-string v4, "/proc/cpuinfo"

    invoke-direct {v3, v4}, Ljava/io/FileReader;-><init>(Ljava/lang/String;)V

    invoke-direct {v2, v3}, Ljava/io/BufferedReader;-><init>(Ljava/io/Reader;)V
    :try_end_e
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_e} :catch_77
    .catchall {:try_start_2 .. :try_end_e} :catchall_6f

    const/4 v1, 0x0

    .line 88
    :cond_f
    :goto_f
    :try_start_f
    invoke-virtual {v2}, Ljava/io/BufferedReader;->readLine()Ljava/lang/String;

    move-result-object v3

    const/4 v4, 0x1

    if-eqz v3, :cond_64

    const-string v5, "Features"

    .line 89
    invoke-virtual {v3, v5}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v5

    if-nez v5, :cond_1f

    goto :goto_f

    :cond_1f
    add-int/lit8 v1, v1, 0x1

    .line 91
    new-instance v5, Ljava/lang/StringBuilder;

    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    const-string v6, " "

    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/16 v6, 0x3a

    invoke-virtual {v3, v6}, Ljava/lang/String;->indexOf(I)I

    move-result v6

    add-int/2addr v6, v4

    invoke-virtual {v3, v6}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v5, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, " "

    invoke-virtual {v5, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v5}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, " "

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v5, " "

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v3
    :try_end_5c
    .catch Ljava/lang/Exception; {:try_start_f .. :try_end_5c} :catch_78
    .catchall {:try_start_f .. :try_end_5c} :catchall_6d

    if-nez v3, :cond_f

    if-eqz v2, :cond_63

    .line 97
    :try_start_60
    invoke-virtual {v2}, Ljava/io/BufferedReader;->close()V
    :try_end_63
    .catch Ljava/lang/Exception; {:try_start_60 .. :try_end_63} :catch_63

    :catch_63
    :cond_63
    return v0

    :cond_64
    if-lez v1, :cond_67

    const/4 v0, 0x1

    :cond_67
    if-eqz v2, :cond_6c

    :try_start_69
    invoke-virtual {v2}, Ljava/io/BufferedReader;->close()V
    :try_end_6c
    .catch Ljava/lang/Exception; {:try_start_69 .. :try_end_6c} :catch_6c

    :catch_6c
    :cond_6c
    return v0

    :catchall_6d
    move-exception p0

    goto :goto_71

    :catchall_6f
    move-exception p0

    move-object v2, v1

    :goto_71
    if-eqz v2, :cond_76

    :try_start_73
    invoke-virtual {v2}, Ljava/io/BufferedReader;->close()V
    :try_end_76
    .catch Ljava/lang/Exception; {:try_start_73 .. :try_end_76} :catch_76

    .line 98
    :catch_76
    :cond_76
    throw p0

    :catch_77
    move-object v2, v1

    :catch_78
    if-eqz v2, :cond_7d

    .line 97
    :try_start_7a
    invoke-virtual {v2}, Ljava/io/BufferedReader;->close()V
    :try_end_7d
    .catch Ljava/lang/Exception; {:try_start_7a .. :try_end_7d} :catch_7d

    :catch_7d
    :cond_7d
    return v0
.end method

.method static find(Ljava/io/File;Ljava/lang/String;I)Ljava/io/File;
    .registers 11

    const/4 v0, 0x0

    const/16 v1, 0xc

    if-le p2, v1, :cond_6

    return-object v0

    .line 282
    :cond_6
    invoke-virtual {p0}, Ljava/io/File;->listFiles()[Ljava/io/File;

    move-result-object p0

    if-nez p0, :cond_d

    return-object v0

    .line 284
    :cond_d
    array-length v1, p0

    const/4 v2, 0x0

    :goto_f
    if-ge v2, v1, :cond_3d

    aget-object v3, p0, v2

    .line 285
    invoke-virtual {v3}, Ljava/io/File;->isDirectory()Z

    move-result v4

    if-eqz v4, :cond_22

    add-int/lit8 v4, p2, 0x1

    .line 286
    invoke-static {v3, p1, v4}, Lcom/wsr/tycoon/Lm;->find(Ljava/io/File;Ljava/lang/String;I)Ljava/io/File;

    move-result-object v3

    if-eqz v3, :cond_3a

    return-object v3

    .line 288
    :cond_22
    invoke-virtual {v3}, Ljava/io/File;->length()J

    move-result-wide v4

    const-wide v6, 0x6400000

    cmp-long v4, v4, v6

    if-lez v4, :cond_3a

    invoke-static {v3}, Lcom/wsr/tycoon/Lm;->ggufArch(Ljava/io/File;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {p1, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_3a

    return-object v3

    :cond_3a
    add-int/lit8 v2, v2, 0x1

    goto :goto_f

    :cond_3d
    return-object v0
.end method

.method static ggufArch(Ljava/io/File;)Ljava/lang/String;
    .registers 11

    const/4 v0, 0x0

    .line 299
    :try_start_1
    new-instance v1, Ljava/io/FileInputStream;

    invoke-direct {v1, p0}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_6} :catch_a2
    .catchall {:try_start_1 .. :try_end_6} :catchall_9a

    const/high16 p0, 0x10000

    .line 300
    :try_start_8
    new-array p0, p0, [B

    const/4 v2, 0x0

    const/4 v3, 0x0

    .line 302
    :goto_c
    array-length v4, p0

    if-ge v3, v4, :cond_19

    array-length v4, p0

    sub-int/2addr v4, v3

    invoke-virtual {v1, p0, v3, v4}, Ljava/io/InputStream;->read([BII)I

    move-result v4

    if-lez v4, :cond_19

    add-int/2addr v3, v4

    goto :goto_c

    :cond_19
    const/16 v4, 0x20

    if-lt v3, v4, :cond_92

    .line 303
    aget-byte v2, p0, v2

    const/16 v4, 0x47

    if-ne v2, v4, :cond_92

    const/4 v2, 0x1

    aget-byte v2, p0, v2

    if-ne v2, v4, :cond_92

    const/4 v2, 0x2

    aget-byte v2, p0, v2

    const/16 v4, 0x55

    if-ne v2, v4, :cond_92

    const/4 v2, 0x3

    aget-byte v2, p0, v2

    const/16 v4, 0x46

    if-eq v2, v4, :cond_37

    goto :goto_92

    :cond_37
    const-string v2, "general.architecture"

    const-string v4, "UTF-8"

    .line 304
    invoke-virtual {v2, v4}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B

    move-result-object v2

    .line 305
    invoke-static {p0, v3, v2}, Lcom/wsr/tycoon/Lm;->indexOf([BI[B)I

    move-result v4
    :try_end_43
    .catch Ljava/lang/Exception; {:try_start_8 .. :try_end_43} :catch_a3
    .catchall {:try_start_8 .. :try_end_43} :catchall_98

    if-gez v4, :cond_4b

    if-eqz v1, :cond_4a

    .line 316
    :try_start_47
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_4a
    .catch Ljava/lang/Exception; {:try_start_47 .. :try_end_4a} :catch_4a

    :catch_4a
    :cond_4a
    return-object v0

    .line 307
    :cond_4b
    :try_start_4b
    array-length v2, v2

    add-int/2addr v4, v2

    add-int/lit8 v2, v4, 0xc

    if-gt v2, v3, :cond_8c

    const/4 v5, 0x4

    .line 308
    invoke-static {p0, v4, v5}, Lcom/wsr/tycoon/Lm;->le([BII)J

    move-result-wide v6

    const-wide/16 v8, 0x8

    cmp-long v6, v6, v8

    if-eqz v6, :cond_5d

    goto :goto_8c

    :cond_5d
    add-int/2addr v4, v5

    const/16 v5, 0x8

    .line 309
    invoke-static {p0, v4, v5}, Lcom/wsr/tycoon/Lm;->le([BII)J

    move-result-wide v4

    const-wide/16 v6, 0x0

    cmp-long v6, v4, v6

    if-lez v6, :cond_86

    const-wide/16 v6, 0x40

    cmp-long v6, v4, v6

    if-gtz v6, :cond_86

    int-to-long v6, v2

    add-long/2addr v6, v4

    int-to-long v8, v3

    cmp-long v3, v6, v8

    if-lez v3, :cond_78

    goto :goto_86

    .line 312
    :cond_78
    new-instance v3, Ljava/lang/String;

    long-to-int v4, v4

    const-string v5, "UTF-8"

    invoke-direct {v3, p0, v2, v4, v5}, Ljava/lang/String;-><init>([BIILjava/lang/String;)V
    :try_end_80
    .catch Ljava/lang/Exception; {:try_start_4b .. :try_end_80} :catch_a3
    .catchall {:try_start_4b .. :try_end_80} :catchall_98

    if-eqz v1, :cond_85

    .line 316
    :try_start_82
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_85
    .catch Ljava/lang/Exception; {:try_start_82 .. :try_end_85} :catch_85

    :catch_85
    :cond_85
    return-object v3

    :cond_86
    :goto_86
    if-eqz v1, :cond_8b

    :try_start_88
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_8b
    .catch Ljava/lang/Exception; {:try_start_88 .. :try_end_8b} :catch_8b

    :catch_8b
    :cond_8b
    return-object v0

    :cond_8c
    :goto_8c
    if-eqz v1, :cond_91

    :try_start_8e
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_91
    .catch Ljava/lang/Exception; {:try_start_8e .. :try_end_91} :catch_91

    :catch_91
    :cond_91
    return-object v0

    :cond_92
    :goto_92
    if-eqz v1, :cond_97

    :try_start_94
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_97
    .catch Ljava/lang/Exception; {:try_start_94 .. :try_end_97} :catch_97

    :catch_97
    :cond_97
    return-object v0

    :catchall_98
    move-exception p0

    goto :goto_9c

    :catchall_9a
    move-exception p0

    move-object v1, v0

    :goto_9c
    if-eqz v1, :cond_a1

    :try_start_9e
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_a1
    .catch Ljava/lang/Exception; {:try_start_9e .. :try_end_a1} :catch_a1

    .line 317
    :catch_a1
    :cond_a1
    throw p0

    :catch_a2
    move-object v1, v0

    :catch_a3
    if-eqz v1, :cond_a8

    .line 316
    :try_start_a5
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_a8
    .catch Ljava/lang/Exception; {:try_start_a5 .. :try_end_a8} :catch_a8

    :catch_a8
    :cond_a8
    return-object v0
.end method

.method static indexOf([BI[B)I
    .registers 8

    const/4 v0, 0x0

    const/4 v1, 0x0

    .line 328
    :goto_2
    array-length v2, p2

    add-int/2addr v2, v1

    if-gt v2, p1, :cond_19

    const/4 v2, 0x0

    .line 329
    :goto_7
    array-length v3, p2

    if-ge v2, v3, :cond_18

    add-int v3, v1, v2

    aget-byte v3, p0, v3

    aget-byte v4, p2, v2

    if-eq v3, v4, :cond_15

    add-int/lit8 v1, v1, 0x1

    goto :goto_2

    :cond_15
    add-int/lit8 v2, v2, 0x1

    goto :goto_7

    :cond_18
    return v1

    :cond_19
    const/4 p0, -0x1

    return p0
.end method

.method static le([BII)J
    .registers 7

    add-int/lit8 p2, p2, -0x1

    const-wide/16 v0, 0x0

    :goto_4
    if-ltz p2, :cond_14

    const/16 v2, 0x8

    shl-long/2addr v0, v2

    add-int v2, p1, p2

    .line 322
    aget-byte v2, p0, v2

    and-int/lit16 v2, v2, 0xff

    int-to-long v2, v2

    or-long/2addr v0, v2

    add-int/lit8 p2, p2, -0x1

    goto :goto_4

    :cond_14
    return-wide v0
.end method

.method static open(Ljava/lang/String;J)Ljava/net/HttpURLConnection;
    .registers 9
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    const/4 v0, 0x0

    move-object v1, p0

    const/4 p0, 0x0

    :goto_3
    const/16 v2, 0x8

    if-ge p0, v2, :cond_79

    .line 218
    new-instance v2, Ljava/net/URL;

    invoke-direct {v2, v1}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-virtual {v2}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;

    move-result-object v2

    check-cast v2, Ljava/net/HttpURLConnection;

    .line 219
    invoke-virtual {v2, v0}, Ljava/net/HttpURLConnection;->setInstanceFollowRedirects(Z)V

    const/16 v3, 0x4e20

    .line 220
    invoke-virtual {v2, v3}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V

    const v3, 0xea60

    .line 221
    invoke-virtual {v2, v3}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    const-string v3, "User-Agent"

    const-string v4, "RaiderTycoon/1.8"

    .line 222
    invoke-virtual {v2, v3, v4}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    const-wide/16 v3, 0x0

    cmp-long v3, p1, v3

    if-lez v3, :cond_48

    const-string v3, "Range"

    .line 223
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "bytes="

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, p1, p2}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v5, "-"

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v2, v3, v4}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    .line 224
    :cond_48
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getResponseCode()I

    move-result v3

    const/16 v4, 0x12c

    if-lt v3, v4, :cond_78

    const/16 v4, 0x190

    if-ge v3, v4, :cond_78

    const-string v3, "Location"

    .line 226
    invoke-virtual {v2, v3}, Ljava/net/HttpURLConnection;->getHeaderField(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 227
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V

    if-nez v3, :cond_67

    .line 228
    new-instance p0, Ljava/io/IOException;

    const-string p1, "redirect without location"

    invoke-direct {p0, p1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 229
    :cond_67
    new-instance v2, Ljava/net/URL;

    new-instance v4, Ljava/net/URL;

    invoke-direct {v4, v1}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-direct {v2, v4, v3}, Ljava/net/URL;-><init>(Ljava/net/URL;Ljava/lang/String;)V

    invoke-virtual {v2}, Ljava/net/URL;->toString()Ljava/lang/String;

    move-result-object v1

    add-int/lit8 p0, p0, 0x1

    goto :goto_3

    :cond_78
    return-object v2

    .line 234
    :cond_79
    new-instance p0, Ljava/io/IOException;

    const-string p1, "too many redirects"

    invoke-direct {p0, p1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0
.end method

.method static q(Ljava/lang/String;)Ljava/lang/String;
    .registers 8

    if-nez p0, :cond_5

    const-string p0, "null"

    return-object p0

    .line 565
    :cond_5
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v1

    add-int/lit8 v1, v1, 0x2

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(I)V

    const/16 v1, 0x22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    const/4 v2, 0x0

    const/4 v3, 0x0

    .line 566
    :goto_17
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v4

    if-ge v3, v4, :cond_72

    .line 567
    invoke-virtual {p0, v3}, Ljava/lang/String;->charAt(I)C

    move-result v4

    const/16 v5, 0xd

    if-eq v4, v5, :cond_6a

    if-eq v4, v1, :cond_64

    const/16 v5, 0x5c

    if-eq v4, v5, :cond_5e

    packed-switch v4, :pswitch_data_7a

    const/16 v5, 0x20

    if-lt v4, v5, :cond_3f

    const/16 v5, 0x2028

    if-eq v4, v5, :cond_3f

    const/16 v5, 0x2029

    if-ne v4, v5, :cond_3b

    goto :goto_3f

    .line 576
    :cond_3b
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    goto :goto_6f

    :cond_3f
    :goto_3f
    const-string v5, "\\u%04x"

    const/4 v6, 0x1

    .line 575
    new-array v6, v6, [Ljava/lang/Object;

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    aput-object v4, v6, v2

    invoke-static {v5, v6}, Ljava/lang/String;->format(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_6f

    :pswitch_52
    const-string v4, "\\n"

    .line 571
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_6f

    :pswitch_58
    const-string v4, "\\t"

    .line 573
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_6f

    :cond_5e
    const-string v4, "\\\\"

    .line 570
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_6f

    :cond_64
    const-string v4, "\\\""

    .line 569
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_6f

    :cond_6a
    const-string v4, "\\r"

    .line 572
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_6f
    add-int/lit8 v3, v3, 0x1

    goto :goto_17

    .line 579
    :cond_72
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    return-object p0

    :pswitch_data_7a
    .packed-switch 0x9
        :pswitch_58
        :pswitch_52
    .end packed-switch
.end method

.method static readAll(Ljava/io/InputStream;)Ljava/lang/String;
    .registers 6

    if-nez p0, :cond_5

    const-string p0, ""

    return-object p0

    .line 554
    :cond_5
    :try_start_5
    new-instance v0, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v0}, Ljava/io/ByteArrayOutputStream;-><init>()V

    const/16 v1, 0x1000

    .line 555
    new-array v1, v1, [B

    .line 557
    :goto_e
    invoke-virtual {p0, v1}, Ljava/io/InputStream;->read([B)I

    move-result v2

    if-lez v2, :cond_21

    invoke-virtual {v0}, Ljava/io/ByteArrayOutputStream;->size()I

    move-result v3

    const/16 v4, 0xfa0

    if-ge v3, v4, :cond_21

    const/4 v3, 0x0

    invoke-virtual {v0, v1, v3, v2}, Ljava/io/ByteArrayOutputStream;->write([BII)V

    goto :goto_e

    .line 558
    :cond_21
    invoke-virtual {p0}, Ljava/io/InputStream;->close()V

    const-string p0, "UTF-8"

    .line 559
    invoke-virtual {v0, p0}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0
    :try_end_2a
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_2a} :catch_2b

    return-object p0

    :catch_2b
    const-string p0, ""

    return-object p0
.end method

.method static readLong(Ljava/lang/String;)J
    .registers 7

    const-wide/16 v0, -0x1

    const/4 v2, 0x0

    .line 120
    :try_start_3
    new-instance v3, Ljava/io/BufferedReader;

    new-instance v4, Ljava/io/FileReader;

    invoke-direct {v4, p0}, Ljava/io/FileReader;-><init>(Ljava/lang/String;)V

    invoke-direct {v3, v4}, Ljava/io/BufferedReader;-><init>(Ljava/io/Reader;)V
    :try_end_d
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_d} :catch_2f
    .catchall {:try_start_3 .. :try_end_d} :catchall_28

    .line 121
    :try_start_d
    invoke-virtual {v3}, Ljava/io/BufferedReader;->readLine()Ljava/lang/String;

    move-result-object p0

    if-nez p0, :cond_14

    goto :goto_1d

    .line 122
    :cond_14
    invoke-virtual {p0}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Ljava/lang/Long;->parseLong(Ljava/lang/String;)J

    move-result-wide v4
    :try_end_1c
    .catch Ljava/lang/Exception; {:try_start_d .. :try_end_1c} :catch_26
    .catchall {:try_start_d .. :try_end_1c} :catchall_23

    move-wide v0, v4

    :goto_1d
    if-eqz v3, :cond_22

    .line 126
    :try_start_1f
    invoke-virtual {v3}, Ljava/io/BufferedReader;->close()V
    :try_end_22
    .catch Ljava/lang/Exception; {:try_start_1f .. :try_end_22} :catch_22

    :catch_22
    :cond_22
    return-wide v0

    :catchall_23
    move-exception p0

    move-object v2, v3

    goto :goto_29

    :catch_26
    move-object v2, v3

    goto :goto_2f

    :catchall_28
    move-exception p0

    :goto_29
    if-eqz v2, :cond_2e

    :try_start_2b
    invoke-virtual {v2}, Ljava/io/BufferedReader;->close()V
    :try_end_2e
    .catch Ljava/lang/Exception; {:try_start_2b .. :try_end_2e} :catch_2e

    .line 127
    :catch_2e
    :cond_2e
    throw p0

    :catch_2f
    :goto_2f
    if-eqz v2, :cond_34

    .line 126
    :try_start_31
    invoke-virtual {v2}, Ljava/io/BufferedReader;->close()V
    :try_end_34
    .catch Ljava/lang/Exception; {:try_start_31 .. :try_end_34} :catch_34

    :catch_34
    :cond_34
    return-wide v0
.end method

.method static safe(Ljava/lang/String;)Z
    .registers 2

    if-eqz p0, :cond_14

    const-string v0, "[A-Za-z0-9._-]{1,120}"

    .line 335
    invoke-virtual {p0, v0}, Ljava/lang/String;->matches(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_14

    const-string v0, ".."

    invoke-virtual {p0, v0}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result p0

    if-nez p0, :cond_14

    const/4 p0, 0x1

    goto :goto_15

    :cond_14
    const/4 p0, 0x0

    :goto_15
    return p0
.end method


# virtual methods
.method public adopt(Ljava/lang/String;Ljava/lang/String;)Z
    .registers 7
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 244
    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->busy()Z

    move-result v0

    const/4 v1, 0x0

    if-nez v0, :cond_2b

    invoke-static {p1}, Lcom/wsr/tycoon/Lm;->safe(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_2b

    if-nez p2, :cond_10

    goto :goto_2b

    :cond_10
    const-string v0, "scan"

    .line 245
    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    const-string v0, ""

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlErr:Ljava/lang/String;

    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlName:Ljava/lang/String;

    const-string v0, "web"

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlFrom:Ljava/lang/String;

    const-wide/16 v2, 0x0

    iput-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlDone:J

    iput-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    iput-boolean v1, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    const/4 v0, 0x1

    .line 246
    invoke-virtual {p0, v0, p1, p2}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    return v0

    :cond_2b
    :goto_2b
    return v1
.end method

.method alive(Ljava/lang/Process;)Z
    .registers 3

    const/4 v0, 0x0

    if-nez p1, :cond_4

    return v0

    .line 132
    :cond_4
    :try_start_4
    invoke-virtual {p1}, Ljava/lang/Process;->exitValue()I
    :try_end_7
    .catch Ljava/lang/IllegalThreadStateException; {:try_start_4 .. :try_end_7} :catch_8

    return v0

    :catch_8
    const/4 p1, 0x1

    return p1
.end method

.method public ask(Ljava/lang/String;)I
    .registers 7
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 470
    new-instance v0, Lcom/wsr/tycoon/Lm$Req;

    invoke-direct {v0}, Lcom/wsr/tycoon/Lm$Req;-><init>()V

    .line 472
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    monitor-enter v1

    .line 473
    :try_start_8
    iget v2, p0, Lcom/wsr/tycoon/Lm;->nextId:I

    add-int/lit8 v3, v2, 0x1

    iput v3, p0, Lcom/wsr/tycoon/Lm;->nextId:I

    .line 474
    iget-object v3, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    invoke-virtual {v3, v4, v0}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 475
    monitor-exit v1
    :try_end_18
    .catchall {:try_start_8 .. :try_end_18} :catchall_1d

    const/4 v1, 0x5

    .line 476
    invoke-virtual {p0, v1, v0, p1}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    return v2

    :catchall_1d
    move-exception p1

    .line 475
    :try_start_1e
    monitor-exit v1
    :try_end_1f
    .catchall {:try_start_1e .. :try_end_1f} :catchall_1d

    throw p1
.end method

.method bg(ILjava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 65
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Lcom/wsr/tycoon/Lm$Job;

    invoke-direct {v1, p0, p1, p2, p3}, Lcom/wsr/tycoon/Lm$Job;-><init>(Lcom/wsr/tycoon/Lm;ILjava/lang/Object;Ljava/lang/Object;)V

    invoke-direct {v0, v1}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    return-void
.end method

.method bin(Z)Ljava/io/File;
    .registers 5

    .line 72
    new-instance v0, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->libDir()Ljava/io/File;

    move-result-object v1

    const-string v2, "libllamasrv8.so"

    invoke-direct {v0, v1, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    if-eqz p1, :cond_1a

    .line 73
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result p1

    if-eqz p1, :cond_1a

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->i8mm()Z

    move-result p1

    if-eqz p1, :cond_1a

    goto :goto_25

    :cond_1a
    new-instance v0, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->libDir()Ljava/io/File;

    move-result-object p1

    const-string v1, "libllamasrv.so"

    invoke-direct {v0, p1, v1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    :goto_25
    return-object v0
.end method

.method busy()Z
    .registers 3

    const-string v0, "run"

    .line 167
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_17

    const-string v0, "scan"

    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_15

    goto :goto_17

    :cond_15
    const/4 v0, 0x0

    goto :goto_18

    :cond_17
    :goto_17
    const/4 v0, 0x1

    :goto_18
    return v0
.end method

.method public cancel(I)V
    .registers 4
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 543
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    monitor-enter v0

    :try_start_3
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    invoke-virtual {v1, p1}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Lcom/wsr/tycoon/Lm$Req;

    monitor-exit v0
    :try_end_10
    .catchall {:try_start_3 .. :try_end_10} :catchall_20

    if-nez p1, :cond_13

    return-void

    :cond_13
    const/4 v0, 0x1

    .line 545
    iput-boolean v0, p1, Lcom/wsr/tycoon/Lm$Req;->cancel:Z

    .line 546
    iget-object p1, p1, Lcom/wsr/tycoon/Lm$Req;->c:Ljava/net/HttpURLConnection;

    if-eqz p1, :cond_1f

    const/4 v0, 0x6

    const/4 v1, 0x0

    .line 548
    invoke-virtual {p0, v0, p1, v1}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    :cond_1f
    return-void

    :catchall_20
    move-exception p1

    .line 543
    :try_start_21
    monitor-exit v0
    :try_end_22
    .catchall {:try_start_21 .. :try_end_22} :catchall_20

    throw p1
.end method

.method public cancelDownload()V
    .registers 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const/4 v0, 0x1

    .line 178
    iput-boolean v0, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    return-void
.end method

.method public clean(Ljava/lang/String;)I
    .registers 9
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 349
    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v0

    invoke-virtual {v0}, Ljava/io/File;->listFiles()[Ljava/io/File;

    move-result-object v0

    const/4 v1, 0x0

    if-eqz v0, :cond_46

    .line 350
    array-length v2, v0

    const/4 v3, 0x0

    :goto_d
    if-ge v1, v2, :cond_45

    aget-object v4, v0, v1

    .line 351
    invoke-virtual {v4}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v5

    invoke-virtual {v5, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-nez v5, :cond_42

    invoke-virtual {v4}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v5

    iget-object v6, p0, Lcom/wsr/tycoon/Lm;->model:Ljava/lang/String;

    invoke-virtual {v5, v6}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-nez v5, :cond_42

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->busy()Z

    move-result v5

    if-eqz v5, :cond_3a

    invoke-virtual {v4}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v5

    iget-object v6, p0, Lcom/wsr/tycoon/Lm;->dlName:Ljava/lang/String;

    invoke-virtual {v5, v6}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v5

    if-eqz v5, :cond_3a

    goto :goto_42

    .line 352
    :cond_3a
    invoke-virtual {v4}, Ljava/io/File;->delete()Z

    move-result v4

    if-eqz v4, :cond_42

    add-int/lit8 v3, v3, 0x1

    :cond_42
    :goto_42
    add-int/lit8 v1, v1, 0x1

    goto :goto_d

    :cond_45
    move v1, v3

    :cond_46
    return v1
.end method

.method public del(Ljava/lang/String;)Z
    .registers 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 339
    invoke-static {p1}, Lcom/wsr/tycoon/Lm;->safe(Ljava/lang/String;)Z

    move-result v0

    if-nez v0, :cond_8

    const/4 p1, 0x0

    return p1

    .line 340
    :cond_8
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->model:Ljava/lang/String;

    invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_13

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->stop()V

    .line 341
    :cond_13
    new-instance v0, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v1

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, ".part"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-direct {v0, v1, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    .line 342
    new-instance v0, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v1

    invoke-direct {v0, v1, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    move-result p1

    return p1
.end method

.method declared-synchronized detach()Ljava/lang/Process;
    .registers 3

    monitor-enter p0

    .line 407
    :try_start_1
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    const/4 v1, 0x0

    .line 408
    iput-object v1, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    const/4 v1, 0x0

    .line 409
    iput-boolean v1, p0, Lcom/wsr/tycoon/Lm;->up:Z

    const-string v1, ""

    .line 410
    iput-object v1, p0, Lcom/wsr/tycoon/Lm;->model:Ljava/lang/String;
    :try_end_d
    .catchall {:try_start_1 .. :try_end_d} :catchall_f

    .line 411
    monitor-exit p0

    return-object v0

    :catchall_f
    move-exception v0

    .line 406
    monitor-exit p0

    throw v0
.end method

.method dir()Ljava/io/File;
    .registers 4

    .line 68
    new-instance v0, Ljava/io/File;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->a:Lcom/wsr/tycoon/MainActivity;

    invoke-virtual {v1}, Lcom/wsr/tycoon/MainActivity;->getFilesDir()Ljava/io/File;

    move-result-object v1

    const-string v2, "models"

    invoke-direct {v0, v1, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/io/File;->mkdirs()Z

    return-object v0
.end method

.method doAdopt(Ljava/lang/String;Ljava/lang/String;)V
    .registers 13

    .line 251
    new-instance v0, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v1

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, ".part"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-direct {v0, v1, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    new-instance v1, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v2

    invoke-direct {v1, v2, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 253
    :try_start_23
    new-instance p1, Ljava/io/File;

    iget-object v2, p0, Lcom/wsr/tycoon/Lm;->a:Lcom/wsr/tycoon/MainActivity;

    invoke-virtual {v2}, Lcom/wsr/tycoon/MainActivity;->getFilesDir()Ljava/io/File;

    move-result-object v2

    invoke-virtual {v2}, Ljava/io/File;->getParentFile()Ljava/io/File;

    move-result-object v2

    const-string v3, "app_webview"

    invoke-direct {p1, v2, v3}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    const/4 v2, 0x0

    invoke-static {p1, p2, v2}, Lcom/wsr/tycoon/Lm;->find(Ljava/io/File;Ljava/lang/String;I)Ljava/io/File;

    move-result-object p1

    if-nez p1, :cond_40

    const-string p1, "none"

    .line 254
    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    return-void

    .line 255
    :cond_40
    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object p2

    invoke-virtual {p2}, Ljava/io/File;->getUsableSpace()J

    move-result-wide v3

    invoke-virtual {p1}, Ljava/io/File;->length()J

    move-result-wide v5

    const-wide v7, 0x4000000

    add-long/2addr v5, v7

    cmp-long p2, v3, v5

    if-gez p2, :cond_5b

    const-string p1, "none"

    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    return-void

    .line 256
    :cond_5b
    invoke-virtual {p1}, Ljava/io/File;->length()J

    move-result-wide v3

    iput-wide v3, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    const-string p2, "run"

    .line 257
    iput-object p2, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    .line 258
    new-instance p2, Ljava/io/FileInputStream;

    invoke-direct {p2, p1}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    .line 259
    new-instance v3, Ljava/io/FileOutputStream;

    invoke-direct {v3, v0, v2}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;Z)V

    const/high16 v4, 0x100000

    .line 260
    new-array v4, v4, [B
    :try_end_73
    .catch Ljava/lang/Exception; {:try_start_23 .. :try_end_73} :catch_cd

    .line 263
    :goto_73
    :try_start_73
    invoke-virtual {p2, v4}, Ljava/io/InputStream;->read([B)I

    move-result v5

    if-lez v5, :cond_8f

    .line 264
    iget-boolean v6, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    if-eqz v6, :cond_85

    new-instance p1, Ljava/io/IOException;

    const-string v1, "cancelled"

    invoke-direct {p1, v1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 265
    :cond_85
    invoke-virtual {v3, v4, v2, v5}, Ljava/io/OutputStream;->write([BII)V

    .line 266
    iget-wide v6, p0, Lcom/wsr/tycoon/Lm;->dlDone:J

    int-to-long v8, v5

    add-long/2addr v6, v8

    iput-wide v6, p0, Lcom/wsr/tycoon/Lm;->dlDone:J
    :try_end_8e
    .catchall {:try_start_73 .. :try_end_8e} :catchall_c5

    goto :goto_73

    .line 268
    :cond_8f
    :try_start_8f
    invoke-virtual {v3}, Ljava/io/OutputStream;->close()V

    invoke-virtual {p2}, Ljava/io/InputStream;->close()V

    .line 269
    invoke-virtual {v0}, Ljava/io/File;->length()J

    move-result-wide v2

    invoke-virtual {p1}, Ljava/io/File;->length()J

    move-result-wide p1

    cmp-long p1, v2, p1

    if-eqz p1, :cond_a9

    new-instance p1, Ljava/io/IOException;

    const-string p2, "copy incomplete"

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 270
    :cond_a9
    invoke-virtual {v1}, Ljava/io/File;->exists()Z

    move-result p1

    if-eqz p1, :cond_b2

    invoke-virtual {v1}, Ljava/io/File;->delete()Z

    .line 271
    :cond_b2
    invoke-virtual {v0, v1}, Ljava/io/File;->renameTo(Ljava/io/File;)Z

    move-result p1

    if-nez p1, :cond_c0

    new-instance p1, Ljava/io/IOException;

    const-string p2, "rename failed"

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    :cond_c0
    const-string p1, "done"

    .line 272
    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    goto :goto_e6

    :catchall_c5
    move-exception p1

    .line 268
    invoke-virtual {v3}, Ljava/io/OutputStream;->close()V

    invoke-virtual {p2}, Ljava/io/InputStream;->close()V

    throw p1
    :try_end_cd
    .catch Ljava/lang/Exception; {:try_start_8f .. :try_end_cd} :catch_cd

    :catch_cd
    move-exception p1

    .line 274
    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    .line 275
    invoke-virtual {p1}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlErr:Ljava/lang/String;

    .line 276
    iget-boolean p1, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    if-eqz p1, :cond_e2

    const-string p1, "idle"

    goto :goto_e4

    :cond_e2
    const-string p1, "err"

    :goto_e4
    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    :goto_e6
    return-void
.end method

.method doAsk(Lcom/wsr/tycoon/Lm$Req;Ljava/lang/String;)V
    .registers 15

    const/4 v0, 0x1

    const/4 v1, 0x0

    .line 483
    :try_start_2
    new-instance v2, Ljava/net/URL;

    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "http://127.0.0.1:"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v4, p0, Lcom/wsr/tycoon/Lm;->port:I

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v4, "/v1/chat/completions"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-direct {v2, v3}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-virtual {v2}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;

    move-result-object v2

    check-cast v2, Ljava/net/HttpURLConnection;
    :try_end_25
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_25} :catch_15e
    .catchall {:try_start_2 .. :try_end_25} :catchall_15b

    .line 484
    :try_start_25
    iput-object v2, p1, Lcom/wsr/tycoon/Lm$Req;->c:Ljava/net/HttpURLConnection;

    .line 485
    invoke-virtual {v2, v0}, Ljava/net/HttpURLConnection;->setDoOutput(Z)V

    const-string v1, "POST"

    .line 486
    invoke-virtual {v2, v1}, Ljava/net/HttpURLConnection;->setRequestMethod(Ljava/lang/String;)V

    const-string v1, "Content-Type"

    const-string v3, "application/json"

    .line 487
    invoke-virtual {v2, v1, v3}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    const-string v1, "Authorization"

    .line 488
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Bearer "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v4, p0, Lcom/wsr/tycoon/Lm;->key:Ljava/lang/String;

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v1, v3}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    const/16 v1, 0xbb8

    .line 489
    invoke-virtual {v2, v1}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V

    const v1, 0x2bf20

    .line 490
    invoke-virtual {v2, v1}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    .line 491
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getOutputStream()Ljava/io/OutputStream;

    move-result-object v1

    const-string v3, "UTF-8"

    .line 492
    invoke-virtual {p2, v3}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B

    move-result-object p2

    invoke-virtual {v1, p2}, Ljava/io/OutputStream;->write([B)V

    .line 493
    invoke-virtual {v1}, Ljava/io/OutputStream;->close()V

    .line 494
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getResponseCode()I

    move-result p2

    const/16 v1, 0xc8

    if-eq p2, v1, :cond_a5

    .line 496
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getErrorStream()Ljava/io/InputStream;

    move-result-object v1

    invoke-static {v1}, Lcom/wsr/tycoon/Lm;->readAll(Ljava/io/InputStream;)Ljava/lang/String;

    move-result-object v1

    const-string v3, "\"message\":"

    invoke-static {v1, v3}, Lcom/wsr/tycoon/Json;->str(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 497
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "HTTP "

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string p2, " "

    invoke-virtual {v4, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    if-eqz v3, :cond_94

    move-object v1, v3

    :cond_94
    invoke-virtual {v4, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    iput-object p2, p1, Lcom/wsr/tycoon/Lm$Req;->err:Ljava/lang/String;
    :try_end_9d
    .catch Ljava/lang/Exception; {:try_start_25 .. :try_end_9d} :catch_158
    .catchall {:try_start_25 .. :try_end_9d} :catchall_156

    if-eqz v2, :cond_a2

    .line 522
    :try_start_9f
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V
    :try_end_a2
    .catch Ljava/lang/Exception; {:try_start_9f .. :try_end_a2} :catch_a2

    .line 523
    :catch_a2
    :cond_a2
    iput-boolean v0, p1, Lcom/wsr/tycoon/Lm$Req;->done:Z

    return-void

    .line 500
    :cond_a5
    :try_start_a5
    new-instance p2, Ljava/io/BufferedReader;

    new-instance v1, Ljava/io/InputStreamReader;

    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;

    move-result-object v3

    const-string v4, "UTF-8"

    invoke-direct {v1, v3, v4}, Ljava/io/InputStreamReader;-><init>(Ljava/io/InputStream;Ljava/lang/String;)V

    invoke-direct {p2, v1}, Ljava/io/BufferedReader;-><init>(Ljava/io/Reader;)V

    .line 502
    :cond_b5
    :goto_b5
    iget-boolean v1, p1, Lcom/wsr/tycoon/Lm$Req;->cancel:Z

    if-nez v1, :cond_14d

    invoke-virtual {p2}, Ljava/io/BufferedReader;->readLine()Ljava/lang/String;

    move-result-object v1

    if-eqz v1, :cond_14d

    const-string v3, "data:"

    .line 503
    invoke-virtual {v1, v3}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v3

    if-nez v3, :cond_c8

    goto :goto_b5

    :cond_c8
    const/4 v3, 0x5

    .line 504
    invoke-virtual {v1, v3}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v1

    const-string v3, "[DONE]"

    .line 505
    invoke-virtual {v1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_db

    goto/16 :goto_14d

    :cond_db
    const-string v3, "{\"error\""

    .line 506
    invoke-virtual {v1, v3}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v3

    if-eqz v3, :cond_ef

    const-string v3, "\"message\":"

    invoke-static {v1, v3}, Lcom/wsr/tycoon/Json;->str(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    if-eqz v3, :cond_ec

    move-object v1, v3

    :cond_ec
    iput-object v1, p1, Lcom/wsr/tycoon/Lm$Req;->err:Ljava/lang/String;

    goto :goto_14d

    :cond_ef
    const-string v3, "\"content\":"

    .line 507
    invoke-static {v1, v3}, Lcom/wsr/tycoon/Json;->str(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    if-eqz v3, :cond_104

    .line 508
    iget-object v4, p1, Lcom/wsr/tycoon/Lm$Req;->t:Ljava/lang/StringBuilder;

    monitor-enter v4
    :try_end_fa
    .catch Ljava/lang/Exception; {:try_start_a5 .. :try_end_fa} :catch_158
    .catchall {:try_start_a5 .. :try_end_fa} :catchall_156

    :try_start_fa
    iget-object v5, p1, Lcom/wsr/tycoon/Lm$Req;->t:Ljava/lang/StringBuilder;

    invoke-virtual {v5, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    monitor-exit v4

    goto :goto_104

    :catchall_101
    move-exception p2

    monitor-exit v4
    :try_end_103
    .catchall {:try_start_fa .. :try_end_103} :catchall_101

    :try_start_103
    throw p2

    :cond_104
    :goto_104
    const-string v3, "\"predicted_per_second\":"

    .line 509
    invoke-static {v1, v3}, Lcom/wsr/tycoon/Json;->num(Ljava/lang/String;Ljava/lang/String;)D

    move-result-wide v3

    const-string v5, "\"prompt_per_second\":"

    invoke-static {v1, v5}, Lcom/wsr/tycoon/Json;->num(Ljava/lang/String;Ljava/lang/String;)D

    move-result-wide v5

    const-string v7, "\"prompt_n\":"

    invoke-static {v1, v7}, Lcom/wsr/tycoon/Json;->num(Ljava/lang/String;Ljava/lang/String;)D

    move-result-wide v7

    const-wide/16 v9, 0x0

    cmpl-double v11, v3, v9

    if-lez v11, :cond_11e

    .line 510
    iput-wide v3, p1, Lcom/wsr/tycoon/Lm$Req;->tps:D

    :cond_11e
    cmpl-double v3, v5, v9

    if-lez v3, :cond_124

    .line 511
    iput-wide v5, p1, Lcom/wsr/tycoon/Lm$Req;->pps:D

    :cond_124
    cmpl-double v3, v7, v9

    if-lez v3, :cond_12a

    .line 512
    iput-wide v7, p1, Lcom/wsr/tycoon/Lm$Req;->pn:D

    :cond_12a
    const-string v3, "\"prompt_progress\""

    .line 513
    invoke-virtual {v1, v3}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v3

    if-eqz v3, :cond_b5

    const-string v3, "\"total\":"

    .line 514
    invoke-static {v1, v3}, Lcom/wsr/tycoon/Json;->num(Ljava/lang/String;Ljava/lang/String;)D

    move-result-wide v3

    const-string v5, "\"processed\":"

    invoke-static {v1, v5}, Lcom/wsr/tycoon/Json;->num(Ljava/lang/String;Ljava/lang/String;)D

    move-result-wide v5

    cmpl-double v1, v3, v9

    if-lez v1, :cond_b5

    const-wide/high16 v7, 0x3ff0000000000000L    # 1.0

    div-double/2addr v5, v3

    .line 515
    invoke-static {v7, v8, v5, v6}, Ljava/lang/Math;->min(DD)D

    move-result-wide v3

    iput-wide v3, p1, Lcom/wsr/tycoon/Lm$Req;->pp:D

    goto/16 :goto_b5

    .line 518
    :cond_14d
    :goto_14d
    invoke-virtual {p2}, Ljava/io/BufferedReader;->close()V
    :try_end_150
    .catch Ljava/lang/Exception; {:try_start_103 .. :try_end_150} :catch_158
    .catchall {:try_start_103 .. :try_end_150} :catchall_156

    if-eqz v2, :cond_172

    .line 522
    :try_start_152
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V
    :try_end_155
    .catch Ljava/lang/Exception; {:try_start_152 .. :try_end_155} :catch_172

    goto :goto_172

    :catchall_156
    move-exception p2

    goto :goto_175

    :catch_158
    move-exception p2

    move-object v1, v2

    goto :goto_15f

    :catchall_15b
    move-exception p2

    move-object v2, v1

    goto :goto_175

    :catch_15e
    move-exception p2

    .line 520
    :goto_15f
    :try_start_15f
    iget-boolean v2, p1, Lcom/wsr/tycoon/Lm$Req;->cancel:Z

    if-nez v2, :cond_16d

    invoke-virtual {p2}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object p2

    invoke-static {p2}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object p2

    iput-object p2, p1, Lcom/wsr/tycoon/Lm$Req;->err:Ljava/lang/String;
    :try_end_16d
    .catchall {:try_start_15f .. :try_end_16d} :catchall_15b

    :cond_16d
    if-eqz v1, :cond_172

    .line 522
    :try_start_16f
    invoke-virtual {v1}, Ljava/net/HttpURLConnection;->disconnect()V
    :try_end_172
    .catch Ljava/lang/Exception; {:try_start_16f .. :try_end_172} :catch_172

    .line 523
    :catch_172
    :cond_172
    :goto_172
    iput-boolean v0, p1, Lcom/wsr/tycoon/Lm$Req;->done:Z

    return-void

    :goto_175
    if-eqz v2, :cond_17a

    .line 522
    :try_start_177
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V
    :try_end_17a
    .catch Ljava/lang/Exception; {:try_start_177 .. :try_end_17a} :catch_17a

    .line 523
    :catch_17a
    :cond_17a
    iput-boolean v0, p1, Lcom/wsr/tycoon/Lm$Req;->done:Z

    .line 524
    throw p2
.end method

.method doDownload(Ljava/lang/String;Ljava/lang/String;Z)V
    .registers 16

    .line 181
    new-instance v0, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v1

    invoke-direct {v0, v1, p2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    new-instance v1, Ljava/io/File;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v2

    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v3, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v4, ".part"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-direct {v1, v2, v3}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 183
    :try_start_23
    invoke-virtual {v1}, Ljava/io/File;->exists()Z

    move-result v2

    const-wide/16 v3, 0x0

    if-eqz v2, :cond_30

    invoke-virtual {v1}, Ljava/io/File;->length()J

    move-result-wide v5

    goto :goto_31

    :cond_30
    move-wide v5, v3

    .line 184
    :goto_31
    invoke-static {p1, v5, v6}, Lcom/wsr/tycoon/Lm;->open(Ljava/lang/String;J)Ljava/net/HttpURLConnection;

    move-result-object v2

    .line 185
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getResponseCode()I

    move-result v7

    const/16 v8, 0x1a0

    const/4 v9, 0x0

    if-ne v7, v8, :cond_4a

    if-eqz p3, :cond_4a

    .line 186
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V

    invoke-virtual {v1}, Ljava/io/File;->delete()Z

    invoke-virtual {p0, p1, p2, v9}, Lcom/wsr/tycoon/Lm;->doDownload(Ljava/lang/String;Ljava/lang/String;Z)V

    return-void

    :cond_4a
    const/16 p1, 0xc8

    if-ne v7, p1, :cond_50

    move-wide v5, v3

    goto :goto_6b

    :cond_50
    const/16 p1, 0xce

    if-eq v7, p1, :cond_6b

    .line 188
    new-instance p1, Ljava/io/IOException;

    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2}, Ljava/lang/StringBuilder;-><init>()V

    const-string p3, "HTTP "

    invoke-virtual {p2, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p2, v7}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 189
    :cond_6b
    :goto_6b
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getContentLength()I

    move-result p1

    int-to-long p1, p1

    const-string p3, "Content-Length"

    .line 190
    invoke-virtual {v2, p3}, Ljava/net/HttpURLConnection;->getHeaderField(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p3
    :try_end_76
    .catch Ljava/lang/Exception; {:try_start_23 .. :try_end_76} :catch_121

    if-eqz p3, :cond_81

    .line 191
    :try_start_78
    invoke-virtual {p3}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p3

    invoke-static {p3}, Ljava/lang/Long;->parseLong(Ljava/lang/String;)J

    move-result-wide v7
    :try_end_80
    .catch Ljava/lang/Exception; {:try_start_78 .. :try_end_80} :catch_81

    move-wide p1, v7

    :catch_81
    :cond_81
    cmp-long p3, p1, v3

    if-lez p3, :cond_87

    add-long/2addr p1, v5

    goto :goto_88

    :cond_87
    move-wide p1, v3

    .line 192
    :goto_88
    :try_start_88
    iput-wide p1, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    .line 193
    iput-wide v5, p0, Lcom/wsr/tycoon/Lm;->dlDone:J

    .line 194
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;

    move-result-object p1

    .line 195
    new-instance p2, Ljava/io/FileOutputStream;

    cmp-long p3, v5, v3

    if-lez p3, :cond_98

    const/4 p3, 0x1

    goto :goto_99

    :cond_98
    const/4 p3, 0x0

    :goto_99
    invoke-direct {p2, v1, p3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;Z)V

    const/high16 p3, 0x10000

    .line 196
    new-array p3, p3, [B
    :try_end_a0
    .catch Ljava/lang/Exception; {:try_start_88 .. :try_end_a0} :catch_121

    .line 199
    :goto_a0
    :try_start_a0
    invoke-virtual {p1, p3}, Ljava/io/InputStream;->read([B)I

    move-result v5

    if-lez v5, :cond_bc

    .line 200
    iget-boolean v6, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    if-eqz v6, :cond_b2

    new-instance p3, Ljava/io/IOException;

    const-string v0, "cancelled"

    invoke-direct {p3, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p3

    .line 201
    :cond_b2
    invoke-virtual {p2, p3, v9, v5}, Ljava/io/OutputStream;->write([BII)V

    .line 202
    iget-wide v6, p0, Lcom/wsr/tycoon/Lm;->dlDone:J

    int-to-long v10, v5

    add-long/2addr v6, v10

    iput-wide v6, p0, Lcom/wsr/tycoon/Lm;->dlDone:J
    :try_end_bb
    .catchall {:try_start_a0 .. :try_end_bb} :catchall_116

    goto :goto_a0

    .line 204
    :cond_bc
    :try_start_bc
    invoke-virtual {p2}, Ljava/io/OutputStream;->close()V

    invoke-virtual {p1}, Ljava/io/InputStream;->close()V

    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 205
    iget-wide p1, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    cmp-long p1, p1, v3

    if-lez p1, :cond_fa

    invoke-virtual {v1}, Ljava/io/File;->length()J

    move-result-wide p1

    iget-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    cmp-long p1, p1, v2

    if-eqz p1, :cond_fa

    new-instance p1, Ljava/io/IOException;

    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2}, Ljava/lang/StringBuilder;-><init>()V

    const-string p3, "incomplete "

    invoke-virtual {p2, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/io/File;->length()J

    move-result-wide v0

    invoke-virtual {p2, v0, v1}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string p3, "/"

    invoke-virtual {p2, p3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v0, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    invoke-virtual {p2, v0, v1}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 206
    :cond_fa
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result p1

    if-eqz p1, :cond_103

    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    .line 207
    :cond_103
    invoke-virtual {v1, v0}, Ljava/io/File;->renameTo(Ljava/io/File;)Z

    move-result p1

    if-nez p1, :cond_111

    new-instance p1, Ljava/io/IOException;

    const-string p2, "rename failed"

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    :cond_111
    const-string p1, "done"

    .line 208
    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    goto :goto_137

    :catchall_116
    move-exception p3

    .line 204
    invoke-virtual {p2}, Ljava/io/OutputStream;->close()V

    invoke-virtual {p1}, Ljava/io/InputStream;->close()V

    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V

    throw p3
    :try_end_121
    .catch Ljava/lang/Exception; {:try_start_bc .. :try_end_121} :catch_121

    :catch_121
    move-exception p1

    .line 210
    invoke-virtual {p1}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlErr:Ljava/lang/String;

    .line 211
    iget-boolean p1, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    if-eqz p1, :cond_133

    const-string p1, "idle"

    goto :goto_135

    :cond_133
    const-string p1, "err"

    :goto_135
    iput-object p1, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    :goto_137
    return-void
.end method

.method public download(Ljava/lang/String;Ljava/lang/String;)Z
    .registers 7
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 171
    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->busy()Z

    move-result v0

    const/4 v1, 0x0

    if-nez v0, :cond_33

    invoke-static {p2}, Lcom/wsr/tycoon/Lm;->safe(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_33

    if-eqz p1, :cond_33

    const-string v0, "https://"

    invoke-virtual {p1, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v0

    if-nez v0, :cond_18

    goto :goto_33

    :cond_18
    const-string v0, "run"

    .line 172
    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    const-string v0, ""

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlErr:Ljava/lang/String;

    iput-object p2, p0, Lcom/wsr/tycoon/Lm;->dlName:Ljava/lang/String;

    const-string v0, "net"

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->dlFrom:Ljava/lang/String;

    const-wide/16 v2, 0x0

    iput-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlDone:J

    iput-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    iput-boolean v1, p0, Lcom/wsr/tycoon/Lm;->dlCancel:Z

    .line 173
    invoke-virtual {p0, v1, p1, p2}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    const/4 p1, 0x1

    return p1

    :cond_33
    :goto_33
    return v1
.end method

.method drain(Ljava/io/InputStream;)V
    .registers 6

    .line 446
    :try_start_0
    new-instance v0, Ljava/io/BufferedReader;

    new-instance v1, Ljava/io/InputStreamReader;

    const-string v2, "UTF-8"

    invoke-direct {v1, p1, v2}, Ljava/io/InputStreamReader;-><init>(Ljava/io/InputStream;Ljava/lang/String;)V

    invoke-direct {v0, v1}, Ljava/io/BufferedReader;-><init>(Ljava/io/Reader;)V

    .line 448
    :goto_c
    invoke-virtual {v0}, Ljava/io/BufferedReader;->readLine()Ljava/lang/String;

    move-result-object p1

    if-eqz p1, :cond_3c

    .line 449
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    monitor-enter v1
    :try_end_15
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_15} :catch_3c

    .line 450
    :try_start_15
    iget-object v2, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    invoke-virtual {v2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/16 p1, 0xa

    invoke-virtual {v2, p1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    .line 451
    iget-object p1, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->length()I

    move-result p1

    const/16 v2, 0x2ee0

    if-le p1, v2, :cond_37

    iget-object p1, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    const/4 v2, 0x0

    iget-object v3, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->length()I

    move-result v3

    add-int/lit16 v3, v3, -0x1f40

    invoke-virtual {p1, v2, v3}, Ljava/lang/StringBuilder;->delete(II)Ljava/lang/StringBuilder;

    .line 452
    :cond_37
    monitor-exit v1

    goto :goto_c

    :catchall_39
    move-exception p1

    monitor-exit v1
    :try_end_3b
    .catchall {:try_start_15 .. :try_end_3b} :catchall_39

    :try_start_3b
    throw p1
    :try_end_3c
    .catch Ljava/lang/Exception; {:try_start_3b .. :try_end_3c} :catch_3c

    :catch_3c
    :cond_3c
    return-void
.end method

.method declared-synchronized freqs()Ljava/lang/String;
    .registers 11

    monitor-enter p0

    .line 103
    :try_start_1
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->freqs:Ljava/lang/String;

    if-eqz v0, :cond_9

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->freqs:Ljava/lang/String;
    :try_end_7
    .catchall {:try_start_1 .. :try_end_7} :catchall_a0

    monitor-exit p0

    return-object v0

    .line 104
    :cond_9
    :try_start_9
    invoke-static {}, Ljava/lang/Runtime;->getRuntime()Ljava/lang/Runtime;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Runtime;->availableProcessors()I

    move-result v0

    .line 105
    new-array v1, v0, [J

    const/4 v2, 0x0

    const/4 v3, 0x1

    const/4 v4, 0x0

    const/4 v5, 0x1

    :goto_17
    const-wide/16 v6, 0x0

    if-ge v4, v0, :cond_44

    .line 107
    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8}, Ljava/lang/StringBuilder;-><init>()V

    const-string v9, "/sys/devices/system/cpu/cpu"

    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v8, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v9, "/cpufreq/cpuinfo_max_freq"

    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v8}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v8

    invoke-static {v8}, Lcom/wsr/tycoon/Lm;->readLong(Ljava/lang/String;)J

    move-result-wide v8

    aput-wide v8, v1, v4

    aget-wide v8, v1, v4

    cmp-long v6, v8, v6

    if-lez v6, :cond_3f

    const/4 v6, 0x1

    goto :goto_40

    :cond_3f
    const/4 v6, 0x0

    :goto_40
    and-int/2addr v5, v6

    add-int/lit8 v4, v4, 0x1

    goto :goto_17

    :cond_44
    if-nez v5, :cond_73

    const/4 v4, 0x0

    const/4 v5, 0x1

    :goto_48
    if-ge v4, v0, :cond_73

    .line 110
    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8}, Ljava/lang/StringBuilder;-><init>()V

    const-string v9, "/sys/devices/system/cpu/cpu"

    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v8, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v9, "/cpu_capacity"

    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v8}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v8

    invoke-static {v8}, Lcom/wsr/tycoon/Lm;->readLong(Ljava/lang/String;)J

    move-result-wide v8

    aput-wide v8, v1, v4

    aget-wide v8, v1, v4

    cmp-long v8, v8, v6

    if-lez v8, :cond_6e

    const/4 v8, 0x1

    goto :goto_6f

    :cond_6e
    const/4 v8, 0x0

    :goto_6f
    and-int/2addr v5, v8

    add-int/lit8 v4, v4, 0x1

    goto :goto_48

    .line 112
    :cond_73
    new-instance v3, Ljava/lang/StringBuilder;

    const-string v4, "["

    invoke-direct {v3, v4}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    :goto_7a
    if-ge v2, v0, :cond_93

    if-lez v2, :cond_81

    const-string v4, ","

    goto :goto_83

    :cond_81
    const-string v4, ""

    .line 113
    :goto_83
    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    if-eqz v5, :cond_8b

    aget-wide v6, v1, v2

    goto :goto_8d

    :cond_8b
    const-wide/16 v6, -0x1

    :goto_8d
    invoke-virtual {v3, v6, v7}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    add-int/lit8 v2, v2, 0x1

    goto :goto_7a

    :cond_93
    const/16 v0, 0x5d

    .line 114
    invoke-virtual {v3, v0}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->freqs:Ljava/lang/String;
    :try_end_9e
    .catchall {:try_start_9 .. :try_end_9e} :catchall_a0

    monitor-exit p0

    return-object v0

    :catchall_a0
    move-exception v0

    .line 102
    monitor-exit p0

    throw v0
.end method

.method declared-synchronized i8mm()Z
    .registers 2

    monitor-enter p0

    .line 77
    :try_start_1
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->i8:Ljava/lang/Boolean;

    if-nez v0, :cond_11

    const-string v0, "i8mm"

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->cpuHas(Ljava/lang/String;)Z

    move-result v0

    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    iput-object v0, p0, Lcom/wsr/tycoon/Lm;->i8:Ljava/lang/Boolean;

    .line 78
    :cond_11
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->i8:Ljava/lang/Boolean;

    invoke-virtual {v0}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0
    :try_end_17
    .catchall {:try_start_1 .. :try_end_17} :catchall_19

    monitor-exit p0

    return v0

    :catchall_19
    move-exception v0

    .line 76
    monitor-exit p0

    throw v0
.end method

.method public info()Ljava/lang/String;
    .registers 11
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 137
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    .line 138
    invoke-virtual {p0, v0}, Lcom/wsr/tycoon/Lm;->alive(Ljava/lang/Process;)Z

    move-result v0

    .line 139
    new-instance v1, Ljava/lang/StringBuilder;

    const-string v2, "{"

    invoke-direct {v1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v2, "\"v\":3"

    .line 140
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, ",\"freq\":"

    .line 141
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->freqs()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, ",\"bin\":"

    .line 142
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 v2, 0x0

    invoke-virtual {p0, v2}, Lcom/wsr/tycoon/Lm;->bin(Z)Ljava/io/File;

    move-result-object v3

    invoke-virtual {v3}, Ljava/io/File;->exists()Z

    move-result v3

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v3, ",\"fast\":"

    .line 143
    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 v3, 0x1

    invoke-virtual {p0, v3}, Lcom/wsr/tycoon/Lm;->bin(Z)Ljava/io/File;

    move-result-object v4

    invoke-virtual {v4}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v4

    const-string v5, "libllamasrv8.so"

    invoke-virtual {v4, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v4, ",\"cores\":"

    .line 144
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/Runtime;->getRuntime()Ljava/lang/Runtime;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/Runtime;->availableProcessors()I

    move-result v4

    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v4, ",\"free\":"

    .line 145
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v4

    invoke-virtual {v4}, Ljava/io/File;->getUsableSpace()J

    move-result-wide v4

    invoke-virtual {v1, v4, v5}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v4, ",\"run\":"

    .line 146
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v4, ",\"up\":"

    .line 147
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-boolean v4, p0, Lcom/wsr/tycoon/Lm;->up:Z

    if-eqz v4, :cond_7b

    if-eqz v0, :cond_7b

    const/4 v0, 0x1

    goto :goto_7c

    :cond_7b
    const/4 v0, 0x0

    :goto_7c
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v0, ",\"exit\":"

    .line 148
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v0, p0, Lcom/wsr/tycoon/Lm;->exit:I

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v0, ",\"herr\":"

    .line 149
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->herr:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ",\"model\":"

    .line 150
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->model:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ",\"eng\":"

    .line 151
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->eng:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ",\"files\":["

    .line 152
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 153
    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v0

    invoke-virtual {v0}, Ljava/io/File;->listFiles()[Ljava/io/File;

    move-result-object v0

    const/16 v4, 0x7d

    if-eqz v0, :cond_102

    .line 155
    array-length v5, v0

    const/4 v3, 0x0

    const/4 v6, 0x1

    :goto_c7
    if-ge v3, v5, :cond_102

    aget-object v7, v0, v3

    .line 156
    invoke-virtual {v7}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v8

    const-string v9, ".gguf"

    invoke-virtual {v8, v9}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v8

    if-nez v8, :cond_d8

    goto :goto_ff

    :cond_d8
    if-nez v6, :cond_df

    const/16 v6, 0x2c

    .line 157
    invoke-virtual {v1, v6}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    :cond_df
    const-string v6, "{\"n\":"

    .line 159
    invoke-virtual {v1, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v7}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v6

    invoke-static {v6}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v6

    invoke-virtual {v1, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v6, ",\"s\":"

    invoke-virtual {v1, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v7}, Ljava/io/File;->length()J

    move-result-wide v6

    invoke-virtual {v1, v6, v7}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    const/4 v6, 0x0

    :goto_ff
    add-int/lit8 v3, v3, 0x1

    goto :goto_c7

    :cond_102
    const-string v0, "],\"dl\":{\"st\":"

    .line 161
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->dlState:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ",\"n\":"

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->dlName:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ",\"from\":"

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->dlFrom:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ",\"d\":"

    .line 162
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlDone:J

    invoke-virtual {v1, v2, v3}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v0, ",\"t\":"

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v2, p0, Lcom/wsr/tycoon/Lm;->dlTotal:J

    invoke-virtual {v1, v2, v3}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v0, ",\"e\":"

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->dlErr:Ljava/lang/String;

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    const-string v0, ",\"log\":"

    .line 163
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->tail()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 164
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method libDir()Ljava/io/File;
    .registers 3

    .line 69
    new-instance v0, Ljava/io/File;

    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->a:Lcom/wsr/tycoon/MainActivity;

    invoke-virtual {v1}, Lcom/wsr/tycoon/MainActivity;->getApplicationInfo()Landroid/content/pm/ApplicationInfo;

    move-result-object v1

    iget-object v1, v1, Landroid/content/pm/ApplicationInfo;->nativeLibraryDir:Ljava/lang/String;

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    return-object v0
.end method

.method public poll(I)Ljava/lang/String;
    .registers 7
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 530
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    monitor-enter v0

    :try_start_3
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/wsr/tycoon/Lm$Req;

    monitor-exit v0
    :try_end_10
    .catchall {:try_start_3 .. :try_end_10} :catchall_90

    if-nez v1, :cond_15

    const-string p1, "{\"t\":\"\",\"d\":true,\"e\":\"no request\",\"s\":0,\"p\":0,\"n\":0}"

    return-object p1

    .line 532
    :cond_15
    iget-boolean v0, v1, Lcom/wsr/tycoon/Lm$Req;->done:Z

    .line 534
    iget-object v2, v1, Lcom/wsr/tycoon/Lm$Req;->t:Ljava/lang/StringBuilder;

    monitor-enter v2

    :try_start_1a
    iget-object v3, v1, Lcom/wsr/tycoon/Lm$Req;->t:Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    monitor-exit v2
    :try_end_21
    .catchall {:try_start_1a .. :try_end_21} :catchall_8d

    .line 535
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "{\"t\":"

    invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {v3}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, ",\"d\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v3, ",\"e\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v3, v1, Lcom/wsr/tycoon/Lm$Req;->err:Ljava/lang/String;

    invoke-static {v3}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, ",\"s\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v3, v1, Lcom/wsr/tycoon/Lm$Req;->tps:D

    invoke-virtual {v2, v3, v4}, Ljava/lang/StringBuilder;->append(D)Ljava/lang/StringBuilder;

    const-string v3, ",\"p\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v3, v1, Lcom/wsr/tycoon/Lm$Req;->pps:D

    invoke-virtual {v2, v3, v4}, Ljava/lang/StringBuilder;->append(D)Ljava/lang/StringBuilder;

    const-string v3, ",\"n\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v3, v1, Lcom/wsr/tycoon/Lm$Req;->pn:D

    invoke-virtual {v2, v3, v4}, Ljava/lang/StringBuilder;->append(D)Ljava/lang/StringBuilder;

    const-string v3, ",\"pp\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-wide v3, v1, Lcom/wsr/tycoon/Lm$Req;->pp:D

    invoke-virtual {v2, v3, v4}, Ljava/lang/StringBuilder;->append(D)Ljava/lang/StringBuilder;

    const-string v1, "}"

    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    if-eqz v0, :cond_8c

    .line 536
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    monitor-enter v0

    :try_start_7e
    iget-object v2, p0, Lcom/wsr/tycoon/Lm;->reqs:Ljava/util/HashMap;

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    invoke-virtual {v2, p1}, Ljava/util/HashMap;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    monitor-exit v0

    goto :goto_8c

    :catchall_89
    move-exception p1

    monitor-exit v0
    :try_end_8b
    .catchall {:try_start_7e .. :try_end_8b} :catchall_89

    throw p1

    :cond_8c
    :goto_8c
    return-object v1

    :catchall_8d
    move-exception p1

    .line 534
    :try_start_8e
    monitor-exit v2
    :try_end_8f
    .catchall {:try_start_8e .. :try_end_8f} :catchall_8d

    throw p1

    :catchall_90
    move-exception p1

    .line 530
    :try_start_91
    monitor-exit v0
    :try_end_92
    .catchall {:try_start_91 .. :try_end_92} :catchall_90

    throw p1
.end method

.method public declared-synchronized start(Ljava/lang/String;IIIZLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .registers 25
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    move-object/from16 v1, p0

    move-object/from16 v2, p1

    move-object/from16 v3, p6

    move-object/from16 v4, p7

    monitor-enter p0

    .line 359
    :try_start_9
    invoke-virtual/range {p0 .. p0}, Lcom/wsr/tycoon/Lm;->detach()Ljava/lang/Process;

    move-result-object v5

    if-eqz v5, :cond_17

    .line 360
    invoke-virtual {v5}, Ljava/lang/Process;->destroy()V

    const-wide/16 v6, 0xbb8

    invoke-virtual {v1, v5, v6, v7}, Lcom/wsr/tycoon/Lm;->waitGone(Ljava/lang/Process;J)V

    .line 361
    :cond_17
    invoke-static/range {p1 .. p1}, Lcom/wsr/tycoon/Lm;->safe(Ljava/lang/String;)Z

    move-result v5

    if-nez v5, :cond_21

    const-string v2, "{\"ok\":false,\"e\":\"bad name\"}"
    :try_end_1f
    .catchall {:try_start_9 .. :try_end_1f} :catchall_219

    monitor-exit p0

    return-object v2

    .line 362
    :cond_21
    :try_start_21
    new-instance v5, Ljava/io/File;

    invoke-virtual/range {p0 .. p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v6

    invoke-direct {v5, v6, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 363
    invoke-virtual {v5}, Ljava/io/File;->exists()Z

    move-result v6

    if-nez v6, :cond_34

    const-string v2, "{\"ok\":false,\"e\":\"model missing\"}"
    :try_end_32
    .catchall {:try_start_21 .. :try_end_32} :catchall_219

    monitor-exit p0

    return-object v2

    :cond_34
    move/from16 v6, p5

    .line 364
    :try_start_36
    invoke-virtual {v1, v6}, Lcom/wsr/tycoon/Lm;->bin(Z)Ljava/io/File;

    move-result-object v6

    .line 365
    invoke-virtual {v6}, Ljava/io/File;->exists()Z

    move-result v7

    if-nez v7, :cond_44

    const-string v2, "{\"ok\":false,\"e\":\"engine missing\"}"
    :try_end_42
    .catchall {:try_start_36 .. :try_end_42} :catchall_219

    monitor-exit p0

    return-object v2

    .line 367
    :cond_44
    :try_start_44
    new-instance v7, Ljava/net/ServerSocket;

    const-string v8, "127.0.0.1"

    invoke-static {v8}, Ljava/net/InetAddress;->getByName(Ljava/lang/String;)Ljava/net/InetAddress;

    move-result-object v8

    const/4 v9, 0x0

    const/4 v10, 0x1

    invoke-direct {v7, v9, v10, v8}, Ljava/net/ServerSocket;-><init>(IILjava/net/InetAddress;)V

    .line 368
    invoke-virtual {v7}, Ljava/net/ServerSocket;->getLocalPort()I

    move-result v8

    iput v8, v1, Lcom/wsr/tycoon/Lm;->port:I

    .line 369
    invoke-virtual {v7}, Ljava/net/ServerSocket;->close()V

    const/16 v7, 0x10

    .line 370
    new-array v8, v7, [B

    .line 371
    new-instance v11, Ljava/security/SecureRandom;

    invoke-direct {v11}, Ljava/security/SecureRandom;-><init>()V

    invoke-virtual {v11, v8}, Ljava/security/SecureRandom;->nextBytes([B)V

    .line 372
    new-instance v11, Ljava/lang/StringBuilder;

    invoke-direct {v11}, Ljava/lang/StringBuilder;-><init>()V

    .line 373
    array-length v12, v8

    const/4 v13, 0x0

    :goto_6d
    if-ge v13, v12, :cond_89

    aget-byte v14, v8, v13

    const-string v15, "%02x"

    new-array v7, v10, [Ljava/lang/Object;

    and-int/lit16 v14, v14, 0xff

    invoke-static {v14}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v14

    aput-object v14, v7, v9

    invoke-static {v15, v7}, Ljava/lang/String;->format(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v7

    invoke-virtual {v11, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    add-int/lit8 v13, v13, 0x1

    const/16 v7, 0x10

    goto :goto_6d

    .line 374
    :cond_89
    invoke-virtual {v11}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v7

    iput-object v7, v1, Lcom/wsr/tycoon/Lm;->key:Ljava/lang/String;

    move/from16 v7, p2

    const/16 v8, 0x10

    .line 375
    invoke-static {v7, v8}, Ljava/lang/Math;->min(II)I

    move-result v7

    invoke-static {v10, v7}, Ljava/lang/Math;->max(II)I

    move-result v7

    move/from16 v11, p3

    invoke-static {v11, v8}, Ljava/lang/Math;->min(II)I

    move-result v11

    invoke-static {v10, v11}, Ljava/lang/Math;->max(II)I

    move-result v8

    .line 376
    new-instance v11, Ljava/util/ArrayList;

    const/16 v12, 0x1a

    new-array v12, v12, [Ljava/lang/String;

    invoke-virtual {v6}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v13

    aput-object v13, v12, v9

    const-string v13, "-m"

    aput-object v13, v12, v10

    invoke-virtual {v5}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v5

    const/4 v13, 0x2

    aput-object v5, v12, v13

    const-string v5, "--host"

    const/4 v14, 0x3

    aput-object v5, v12, v14

    const/4 v5, 0x4

    const-string v15, "127.0.0.1"

    aput-object v15, v12, v5

    const/4 v5, 0x5

    const-string v15, "--port"

    aput-object v15, v12, v5

    const/4 v5, 0x6

    iget v15, v1, Lcom/wsr/tycoon/Lm;->port:I

    .line 377
    invoke-static {v15}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v15

    aput-object v15, v12, v5

    const/4 v5, 0x7

    const-string v15, "-t"

    aput-object v15, v12, v5

    const/16 v5, 0x8

    invoke-static {v7}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v7

    aput-object v7, v12, v5

    const/16 v5, 0x9

    const-string v7, "-tb"

    aput-object v7, v12, v5

    const/16 v5, 0xa

    invoke-static {v8}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v7

    aput-object v7, v12, v5

    const/16 v5, 0xb

    const-string v7, "-c"

    aput-object v7, v12, v5

    const/16 v5, 0xc

    .line 378
    invoke-static/range {p4 .. p4}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v7

    aput-object v7, v12, v5

    const/16 v5, 0xd

    const-string v7, "-b"

    aput-object v7, v12, v5

    const/16 v5, 0xe

    const-string v7, "256"

    aput-object v7, v12, v5

    const/16 v5, 0xf

    const-string v7, "-ub"

    aput-object v7, v12, v5

    const-string v5, "256"

    const/16 v7, 0x10

    aput-object v5, v12, v7

    const/16 v5, 0x11

    const-string v7, "-np"

    aput-object v7, v12, v5

    const/16 v5, 0x12

    const-string v7, "1"

    aput-object v7, v12, v5

    const/16 v5, 0x13

    const-string v7, "--jinja"

    aput-object v7, v12, v5

    const/16 v5, 0x14

    const-string v7, "-rea"

    aput-object v7, v12, v5

    const/16 v5, 0x15

    const-string v7, "off"

    aput-object v7, v12, v5

    const/16 v5, 0x16

    const-string v7, "--no-ui"

    aput-object v7, v12, v5

    const/16 v5, 0x17

    const-string v7, "--no-slots"

    aput-object v7, v12, v5

    const/16 v5, 0x18

    const-string v7, "-cram"

    aput-object v7, v12, v5

    const/16 v5, 0x19

    const-string v7, "0"

    aput-object v7, v12, v5

    .line 376
    invoke-static {v12}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object v5

    invoke-direct {v11, v5}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    if-eqz v3, :cond_164

    const-string v5, "[0-9a-fA-F]{1,16}"

    .line 382
    invoke-virtual {v3, v5}, Ljava/lang/String;->matches(Ljava/lang/String;)Z

    move-result v5

    if-eqz v5, :cond_164

    const-string v5, "-C"

    invoke-interface {v11, v5}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    invoke-interface {v11, v3}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    :cond_164
    if-eqz v4, :cond_176

    const-string v3, "[0-9a-fA-F]{1,16}"

    .line 383
    invoke-virtual {v4, v3}, Ljava/lang/String;->matches(Ljava/lang/String;)Z

    move-result v3

    if-eqz v3, :cond_176

    const-string v3, "-Cb"

    invoke-interface {v11, v3}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    invoke-interface {v11, v4}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    .line 384
    :cond_176
    new-instance v3, Ljava/lang/ProcessBuilder;

    invoke-direct {v3, v11}, Ljava/lang/ProcessBuilder;-><init>(Ljava/util/List;)V

    .line 385
    invoke-virtual {v3, v10}, Ljava/lang/ProcessBuilder;->redirectErrorStream(Z)Ljava/lang/ProcessBuilder;

    .line 386
    invoke-virtual/range {p0 .. p0}, Lcom/wsr/tycoon/Lm;->dir()Ljava/io/File;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/ProcessBuilder;->directory(Ljava/io/File;)Ljava/lang/ProcessBuilder;

    .line 387
    invoke-virtual {v3}, Ljava/lang/ProcessBuilder;->environment()Ljava/util/Map;

    move-result-object v4

    const-string v5, "LLAMA_API_KEY"

    iget-object v7, v1, Lcom/wsr/tycoon/Lm;->key:Ljava/lang/String;

    invoke-interface {v4, v5, v7}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 388
    invoke-virtual {v3}, Ljava/lang/ProcessBuilder;->environment()Ljava/util/Map;

    move-result-object v4

    const-string v5, "LLAMA_PARENT_WATCH"

    const-string v7, "1"

    invoke-interface {v4, v5, v7}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 389
    iget-object v4, v1, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    monitor-enter v4
    :try_end_19e
    .catch Ljava/lang/Exception; {:try_start_44 .. :try_end_19e} :catch_1f3
    .catchall {:try_start_44 .. :try_end_19e} :catchall_219

    :try_start_19e
    iget-object v5, v1, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    invoke-virtual {v5, v9}, Ljava/lang/StringBuilder;->setLength(I)V

    monitor-exit v4
    :try_end_1a4
    .catchall {:try_start_19e .. :try_end_1a4} :catchall_1ef

    .line 390
    :try_start_1a4
    iput-boolean v9, v1, Lcom/wsr/tycoon/Lm;->up:Z

    const/16 v4, -0x3e7

    .line 391
    iput v4, v1, Lcom/wsr/tycoon/Lm;->exit:I

    const-string v4, ""

    .line 392
    iput-object v4, v1, Lcom/wsr/tycoon/Lm;->herr:Ljava/lang/String;

    .line 393
    invoke-virtual {v3}, Ljava/lang/ProcessBuilder;->start()Ljava/lang/Process;

    move-result-object v3

    .line 394
    iput-object v3, v1, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    .line 395
    iput-object v2, v1, Lcom/wsr/tycoon/Lm;->model:Ljava/lang/String;

    .line 396
    invoke-virtual {v6}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v2

    iput-object v2, v1, Lcom/wsr/tycoon/Lm;->eng:Ljava/lang/String;

    .line 397
    invoke-virtual {v3}, Ljava/lang/Process;->getInputStream()Ljava/io/InputStream;

    move-result-object v2

    const/4 v4, 0x0

    .line 398
    invoke-virtual {v1, v13, v2, v4}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    .line 399
    invoke-virtual {v1, v14, v3, v4}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    .line 400
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "{\"ok\":true,\"port\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v3, v1, Lcom/wsr/tycoon/Lm;->port:I

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v3, ",\"eng\":"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v3, v1, Lcom/wsr/tycoon/Lm;->eng:Ljava/lang/String;

    invoke-static {v3}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, "}"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2
    :try_end_1ed
    .catch Ljava/lang/Exception; {:try_start_1a4 .. :try_end_1ed} :catch_1f3
    .catchall {:try_start_1a4 .. :try_end_1ed} :catchall_219

    monitor-exit p0

    return-object v2

    :catchall_1ef
    move-exception v0

    move-object v2, v0

    .line 389
    :try_start_1f1
    monitor-exit v4
    :try_end_1f2
    .catchall {:try_start_1f1 .. :try_end_1f2} :catchall_1ef

    :try_start_1f2
    throw v2
    :try_end_1f3
    .catch Ljava/lang/Exception; {:try_start_1f2 .. :try_end_1f3} :catch_1f3
    .catchall {:try_start_1f2 .. :try_end_1f3} :catchall_219

    :catch_1f3
    move-exception v0

    move-object v2, v0

    .line 402
    :try_start_1f5
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "{\"ok\":false,\"e\":"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/wsr/tycoon/Lm;->q(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, "}"

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2
    :try_end_217
    .catchall {:try_start_1f5 .. :try_end_217} :catchall_219

    monitor-exit p0

    return-object v2

    :catchall_219
    move-exception v0

    move-object v2, v0

    .line 358
    monitor-exit p0

    throw v2
.end method

.method public stop()V
    .registers 4
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 461
    invoke-virtual {p0}, Lcom/wsr/tycoon/Lm;->detach()Ljava/lang/Process;

    move-result-object v0

    if-nez v0, :cond_7

    return-void

    .line 463
    :cond_7
    invoke-virtual {v0}, Ljava/lang/Process;->destroy()V

    const/4 v1, 0x4

    const/4 v2, 0x0

    .line 465
    invoke-virtual {p0, v1, v0, v2}, Lcom/wsr/tycoon/Lm;->bg(ILjava/lang/Object;Ljava/lang/Object;)V

    return-void
.end method

.method tail()Ljava/lang/String;
    .registers 5

    .line 457
    iget-object v0, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    monitor-enter v0

    :try_start_3
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->length()I

    move-result v1

    iget-object v2, p0, Lcom/wsr/tycoon/Lm;->log:Ljava/lang/StringBuilder;

    const/4 v3, 0x0

    add-int/lit16 v1, v1, -0x5dc

    invoke-static {v3, v1}, Ljava/lang/Math;->max(II)I

    move-result v1

    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->substring(I)Ljava/lang/String;

    move-result-object v1

    monitor-exit v0

    return-object v1

    :catchall_18
    move-exception v1

    monitor-exit v0
    :try_end_1a
    .catchall {:try_start_3 .. :try_end_1a} :catchall_18

    throw v1
.end method

.method waitGone(Ljava/lang/Process;J)V
    .registers 9

    const-wide/16 v0, 0x0

    :goto_2
    cmp-long v2, v0, p2

    if-gez v2, :cond_15

    .line 415
    invoke-virtual {p0, p1}, Lcom/wsr/tycoon/Lm;->alive(Ljava/lang/Process;)Z

    move-result v2

    if-eqz v2, :cond_15

    const-wide/16 v2, 0x32

    .line 416
    :try_start_e
    invoke-static {v2, v3}, Ljava/lang/Thread;->sleep(J)V
    :try_end_11
    .catch Ljava/lang/InterruptedException; {:try_start_e .. :try_end_11} :catch_14

    const/4 v4, 0x0

    add-long/2addr v0, v2

    goto :goto_2

    :catch_14
    return-void

    :cond_15
    return-void
.end method

.method watch(Ljava/lang/Process;)V
    .registers 6

    const/4 v0, 0x0

    :goto_1
    const/16 v1, 0x384

    if-ge v0, v1, :cond_a8

    .line 422
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    if-ne v1, p1, :cond_a8

    iget-boolean v1, p0, Lcom/wsr/tycoon/Lm;->up:Z

    if-nez v1, :cond_a8

    invoke-virtual {p0, p1}, Lcom/wsr/tycoon/Lm;->alive(Ljava/lang/Process;)Z

    move-result v1

    if-eqz v1, :cond_a8

    .line 424
    :try_start_13
    new-instance v1, Ljava/net/URL;

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "http://127.0.0.1:"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v3, p0, Lcom/wsr/tycoon/Lm;->port:I

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v3, "/health"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;

    move-result-object v1

    check-cast v1, Ljava/net/HttpURLConnection;

    const/16 v2, 0x1f4

    .line 425
    invoke-virtual {v1, v2}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V

    const/16 v2, 0x5dc

    .line 426
    invoke-virtual {v1, v2}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    .line 427
    invoke-virtual {v1}, Ljava/net/HttpURLConnection;->getResponseCode()I

    move-result v2

    .line 428
    invoke-virtual {v1}, Ljava/net/HttpURLConnection;->disconnect()V

    const/16 v1, 0xc8

    if-ne v2, v1, :cond_53

    .line 429
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    if-ne v1, p1, :cond_53

    const/4 v1, 0x1

    iput-boolean v1, p0, Lcom/wsr/tycoon/Lm;->up:Z

    goto :goto_a8

    :cond_53
    const/16 v1, 0x1f7

    if-eq v2, v1, :cond_9e

    .line 430
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "HTTP "

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    iput-object v1, p0, Lcom/wsr/tycoon/Lm;->herr:Ljava/lang/String;
    :try_end_6a
    .catch Ljava/lang/Exception; {:try_start_13 .. :try_end_6a} :catch_6b

    goto :goto_9e

    :catch_6b
    move-exception v1

    .line 433
    invoke-virtual {v1}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v2

    .line 434
    instance-of v3, v1, Ljava/net/ConnectException;

    if-nez v3, :cond_9e

    const-string v3, "refused"

    invoke-virtual {v2, v3}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v3

    if-nez v3, :cond_9e

    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Class;->getSimpleName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v3, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, ": "

    invoke-virtual {v3, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    iput-object v1, p0, Lcom/wsr/tycoon/Lm;->herr:Ljava/lang/String;

    :cond_9e
    :goto_9e
    const-wide/16 v1, 0xfa

    .line 436
    :try_start_a0
    invoke-static {v1, v2}, Ljava/lang/Thread;->sleep(J)V
    :try_end_a3
    .catch Ljava/lang/InterruptedException; {:try_start_a0 .. :try_end_a3} :catch_a7

    add-int/lit8 v0, v0, 0x1

    goto/16 :goto_1

    :catch_a7
    return-void

    .line 439
    :cond_a8
    :goto_a8
    :try_start_a8
    invoke-virtual {p1}, Ljava/lang/Process;->waitFor()I

    move-result v0

    .line 440
    iget-object v1, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    if-eq v1, p1, :cond_b4

    iget-object p1, p0, Lcom/wsr/tycoon/Lm;->proc:Ljava/lang/Process;

    if-nez p1, :cond_b6

    :cond_b4
    iput v0, p0, Lcom/wsr/tycoon/Lm;->exit:I
    :try_end_b6
    .catch Ljava/lang/Exception; {:try_start_a8 .. :try_end_b6} :catch_b6

    :catch_b6
    :cond_b6
    return-void
.end method
