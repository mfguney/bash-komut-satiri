# 2 · Dosya sistemi, izinler ve kullanıcılar

<div class="kunye" markdown>
<span>Süre: ~45 dk + uygulama</span><span>Düzey: Başlangıç–Orta</span><span>Ön koşul: Bölüm 1</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Linux dizin hiyerarşisinin (FHS) temel dizinlerini ve gömülü bir kök dosya sistemindeki karşılıklarını açıklayabilirsiniz.
    - Dosya adı, dizin kaydı ve inode arasındaki ilişkiyi; sabit ve sembolik bağlantının farkını açıklayabilirsiniz.
    - İzin bitlerini sekizli ve simgesel biçimde okuyup değiştirebilir, `umask` değerinin etkisini hesaplayabilirsiniz.
    - setuid, setgid ve yapışkan bitin anlamını ve güvenlik etkisini açıklayabilirsiniz.
    - Kullanıcı, grup ve `sudo` kavramlarını; Yocto'da dosya sahipliğinin ve kullanıcı hesaplarının nasıl tanımlandığını açıklayabilirsiniz.

## 2.1 Tek bir ağaç: dizin hiyerarşisi

Linux'ta tüm dosyalar `/` (kök) ile başlayan tek bir ağaçta bulunur. Ayrı diskler, bölümler, bellek
tabanlı dosya sistemleri ve çekirdeğin sanal dosya sistemleri bu ağacın dizinlerine **bağlanır**
(*mount*). Hangi dizinin ne amaçla kullanılacağını **Filesystem Hierarchy Standard** (FHS) tanımlar;
dağıtımlar ve Yocto bu standardı büyük ölçüde izler.

| Dizin | İçerik | Gömülü sistemde dikkat edilecek nokta |
|---|---|---|
| `/bin`, `/sbin` | Temel kullanıcı ve sistem komutları | `usrmerge` dağıtım özelliğiyle `/usr/bin` ve `/usr/sbin` dizinlerine bağlantıdır |
| `/etc` | Makineye özgü yapılandırma dosyaları | Salt okunur kök dosya sisteminde değiştirilemez |
| `/usr` | Paylaşılabilir, salt okunur programlar ve kitaplıklar | İmajın en büyük kısmı |
| `/var` | Değişken veriler: günlükler, önbellekler, kuyruklar | Yocto'da `/var/log` ve `/var/tmp`, RAM'deki `/var/volatile` altına bağlantıdır |
| `/run` | Açılıştan beri geçerli çalışma zamanı verileri (PID dosyaları, soketler) | tmpfs; her açılışta boştur |
| `/tmp` | Geçici dosyalar | Çoğu zaman tmpfs; yapışkan bitlidir |
| `/home`, `/root` | Kullanıcıların ve root'un ev dizinleri | Ekransız cihazda çoğu zaman yalnızca `/home/root` bulunur |
| `/dev` | Aygıt dosyaları | devtmpfs ile çekirdek tarafından doldurulur; udev veya mdev izinleri ayarlar |
| `/proc`, `/sys` | Çekirdeğin süreç ve aygıt bilgisini sunduğu sanal dosya sistemleri | Diskte yer kaplamaz |

Gömülü bir üründe flash belleğin ömrü ve güç kesintisine dayanıklılık nedeniyle iki ilke öne çıkar:
kök dosya sistemi mümkün olduğunca **salt okunur** tutulur ve sık değişen veriler RAM'e (tmpfs) veya ayrı
bir **veri bölümüne** (ör. `/data`) yazılır. Yocto'da `/var/volatile` düzeni bu ilkenin sonucudur:
günlükler RAM'de tutulur ve yeniden başlatmada kaybolur. Kalıcı günlük gerekiyorsa bu bilinçli olarak
ayarlanmalıdır (bkz. <a href="../../yocto-gomulu-linux/bolumler/17-guvenlik-guncelleme.html">Yocto kitabı, Bölüm 17</a>).

Ağaçtaki bağlama noktaları `findmnt` veya `mount` ile, dosya sistemi doluluğu `df -h` ile, bir dizinin
kapladığı alan `du -sh` ile görülür. Bağlama seçenekleri de davranışı etkiler: `noexec` seçeneğiyle
bağlanmış bir dizindeki betik `./betik.sh` biçiminde çalıştırılamaz, ancak `sh betik.sh` ile
çalıştırılabilir; çünkü bu durumda çalıştırılan program `/bin/sh`'tır.

## 2.2 Dosya adı, dizin kaydı ve inode

Bir dosya sisteminde dosyanın kendisi **inode** adlı bir kayıtla temsil edilir. inode; dosyanın türünü,
izinlerini, sahibini ve grubunu, boyutunu, zaman damgalarını, **bağlantı sayısını** ve verinin diskte
hangi bloklarda bulunduğunu tutar. **Dosyanın adı inode'da bulunmaz.** Ad, dizin adlı özel dosyanın
içindeki bir kayıttır: "bu dizinde `sensor.conf` adı 933908 numaralı inode'u gösterir".

Bu ayrımın pratik sonuçları vardır:

- **Sabit bağlantı** (`ln hedef ad`), aynı inode'a ikinci bir ad verir. İki ad eşittir; hangisinin
  "asıl" olduğu sorusu anlamsızdır. Sabit bağlantılar yalnızca aynı dosya sistemi içinde ve dizinler
  dışındaki dosyalar için kurulabilir.
- `rm` dosyayı değil, bir dizin kaydını siler (`unlink` sistem çağrısı) ve bağlantı sayısını azaltır.
  Veri ancak sayı sıfıra indiğinde ve dosyayı açık tutan hiçbir süreç kalmadığında serbest bırakılır.
- **Sembolik bağlantı** (`ln -s hedef ad`) kendi inode'u olan ayrı bir dosyadır; içeriği yalnızca
  hedefin yoludur. Hedef silinirse bağlantı **kırık** hale gelir; farklı dosya sistemlerine ve dizinlere
  işaret edebilir.
- Dosyayı yeniden adlandırmak (`mv`, aynı dosya sistemi içinde) yalnızca dizin kaydını değiştirir;
  dosya ne kadar büyük olursa olsun anında tamamlanır ve **atomiktir**. Bölüm 7'de güvenli dosya
  güncellemesi bu özelliğe dayanır.

<div class="akis" data-senaryo="inode-baglanti"></div>

Aşağıdaki oturumda aynı işlemler gerçek bir dosya sisteminde yapılmıştır. `ls -i` inode numarasını,
`stat` ise inode'un tüm alanlarını gösterir:

<div class="terminal" data-oturum="inode-baglanti"></div>

!!! sss "Disk dolu görünüyor, ancak büyük dosya silindi. Neden alan açılmadı?"
    Dosya bir süreç tarafından hâlâ açıktır. `rm` adı kaldırmıştır, ancak bağlantı sayısı sıfır olsa
    da açık tanımlayıcı inode'u yaşatır. Gömülü cihazlarda tipik örnek, günlük dosyasına yazmaya devam
    eden bir servistir. `ls -l /proc/*/fd 2>/dev/null | grep deleted` (veya kuruluysa `lsof +L1`) bu
    dosyaları bulur. Çözüm servisi yeniden başlatmak ya da dosyayı silmek yerine `: > dosya` ile
    boşaltmaktır.

!!! dikkat "rootfs dizininde mutlak sembolik bağlantılar"
    Yocto'nun ürettiği `IMAGE_ROOTFS` dizini veya açılmış bir imaj derleme makinesinde incelenirken
    `/bin/sh -> /bin/busybox` gibi **mutlak** bir bağlantı, derleme makinesinin kendi `/bin/busybox`
    dosyasını gösterir. `find -xtype l` gibi denetimler bu nedenle yanıltıcı sonuç verebilir. Bağlantının
    hedefi `readlink` ile okunmalı ve rootfs dizinine göre yorumlanmalıdır; hedefte ise bağlantı doğru çalışır.

## 2.3 İzin bitleri

Her inode, dosyanın sahibi (**u**ser), grubu (**g**roup) ve diğerleri (**o**ther) için üçer bitlik izin
taşır: okuma (**r**), yazma (**w**), yürütme (**x**). `ls -l` çıktısının ilk sütunu türü ve bu dokuz biti
gösterir; her üçlü sekizli bir rakamla da yazılabilir (r=4, w=2, x=1):

```text
-rwxr-x---   →  tür: düzenli dosya
 │││││││││
 └┬┘└┬┘└┬┘
  7  5  0     →  chmod 750: sahip rwx, grup r-x, diğerleri ---
```

Bitlerin anlamı dosya ve dizin için farklıdır; sık yapılan hataların çoğu bu farkın gözden kaçmasından
kaynaklanır:

| Bit | Düzenli dosyada | Dizinde |
|---|---|---|
| `r` | İçeriği okuma | İçindeki **adları** listeleme (`ls`) |
| `w` | İçeriği değiştirme | Ad ekleme, silme, yeniden adlandırma (dosyanın kendi izinlerinden bağımsız) |
| `x` | Program veya betik olarak çalıştırma | Dizine girme (`cd`) ve içindeki adlarla dosyalara erişme |

Tablodaki ikinci satır önemli bir sonuç doğurur: bir dosyanın silinebilmesi için dosyanın değil,
**bulunduğu dizinin** yazma izni gerekir. Salt okunur (`-r--r--r--`) bir dosya, yazılabilir bir dizinde
herkes tarafından silinebilir. Yürütme biti ise yoldaki her dizin için gerekir: `/data/sensor/olcum.csv`
okunabilmek için `/`, `/data` ve `/data/sensor` dizinlerinin hepsinde `x` izni bulunmalıdır.

Çekirdek bir erişim isteğine karar verirken sırayla şunu sorar: süreç dosyanın sahibi mi? Değilse
dosyanın grubunda mı? Değilse "diğerleri" bitleri kullanılır. **Eşleşen ilk sınıfın** bitleri
uygulanır; sahip için izin daha kısıtlıysa, grup izni daha geniş olsa bile sahip kısıtlı izne tabidir.
root kullanıcısı (uid 0) okuma ve yazma denetimlerini atlar; yürütmede ise en az bir `x` biti gerekir.

<div class="akis" data-senaryo="izin-denetimi"></div>

İzinler `chmod` ile değiştirilir. Sekizli biçim tüm bitleri birden ayarlar; simgesel biçim yalnızca
belirtilen bitleri değiştirir ve betiklerde niyeti daha açık gösterir:

```bash
chmod 640 /etc/sensor.conf          # rw-r-----
chmod u+x,go-w betik.sh             # sahibe yürütme ekle, grup ve diğerlerinden yazmayı kaldır
chmod -R u=rwX,go=rX paylasim/      # X: yalnızca dizinlere ve zaten yürütülebilir dosyalara x ekler
```

## 2.4 umask: yeni dosyaların varsayılan izni

Bir program dosya oluştururken bir izin değeri ister: dosyalar için genellikle 666, dizinler için 777.
Çekirdek bu değerden sürecin **umask** değerindeki bitleri çıkarır. umask kalıtımla geçer: kabukta
ayarlanan değer, kabuktan başlatılan tüm programlar için geçerlidir.

| umask | Yeni dosya (666'dan) | Yeni dizin (777'den) | Kullanım |
|---|---|---|---|
| `022` | 644 `rw-r--r--` | 755 `rwxr-xr-x` | Yaygın varsayılan |
| `002` | 664 `rw-rw-r--` | 775 `rwxrwxr-x` | Kullanıcıya özel grup kullanan dağıtımlar (Ubuntu kullanıcıları) |
| `077` | 600 `rw-------` | 700 `rwx------` | Gizli veriler, anahtarlar |

İşlem bir çıkarma değil, bit düzeyinde maskelemedir: istenen izin `& ~umask`. Bu nedenle umask hiçbir
zaman izin **eklemez**; 666 ile oluşturulan bir dosya umask ne olursa olsun yürütme biti almaz.

<div class="terminal" data-oturum="izinler-umask"></div>

!!! iyi "Gizli dosyaları oluşturulurken korumak"
    Bir dosya önce oluşturulup sonra `chmod 600` uygulanırsa, aradaki kısa sürede dosya herkesçe
    okunabilir durumdadır. Anahtar veya parola içeren dosyalar ya `umask 077` etkinken oluşturulmalı
    ya da `install -m 0600 kaynak hedef` gibi izni oluşturma anında ayarlayan bir araçla yazılmalıdır.
    `mktemp` de dosyaları zaten 600 izniyle oluşturur (Bölüm 7).

## 2.5 Özel bitler: setuid, setgid, yapışkan bit

Dokuz izin bitinin önünde üç özel bit daha bulunur ve sekizli gösterimde dördüncü (en soldaki) rakamı
oluşturur:

| Bit | Sekizli | `ls -l` | Dosyada | Dizinde |
|---|---|---|---|---|
| setuid | 4000 | `rws------` | Program, çalıştıranın değil **dosya sahibinin** kimliğiyle çalışır | Linux'ta etkisi yok |
| setgid | 2000 | `---rws---` | Program dosyanın grubunun kimliğiyle çalışır | İçinde oluşturulan dosyalar dizinin grubunu alır |
| yapışkan (*sticky*) | 1000 | `------rwt` | Linux'ta etkisi yok | Herkesin yazabildiği dizinde yalnızca dosyanın sahibi dosyayı silebilir |

`passwd` programı setuid root'tur: sıradan bir kullanıcının yalnızca root'un yazabildiği
`/etc/shadow` dosyasını kendi parolası için değiştirmesini sağlar. Bu güç, setuid programdaki bir
hatanın doğrudan root yetkisi kazandırması anlamına da gelir. Linux çekirdeği güvenlik nedeniyle
**betiklerde setuid bitini yok sayar**; yalnızca derlenmiş programlarda etkilidir.

Gömülü bir imajda setuid dosyalarının listesi bir güvenlik denetim kalemidir. Bir programın yalnızca
belirli bir ayrıcalığa ihtiyacı varsa (ör. 1024'ten küçük bir portu dinlemek), setuid root yerine Linux
**yetenekleri** (*capabilities*) tercih edilmelidir: `setcap cap_net_bind_service=+ep /usr/bin/program`.
systemd servislerinde aynı amaçla `AmbientCapabilities=` kullanılır.

!!! lab "Uygulama 2.1 · Örnek bir kök dosya sisteminin denetlenmesi"
    `examples/02-dosya-sistemi` dizinindeki iki betik birlikte kullanılır: `ornek-rootfs-olustur.sh`
    Yocto imajlarındaki düzene benzeyen küçük bir kök dizin ve içinde kasıtlı hatalar oluşturur;
    `rootfs-denetle.sh` ise setuid/setgid dosyaları, herkesin yazabildiği dosyaları, yapışkan biti
    eksik dizinleri ve kırık bağlantıları raporlar.

    1. Betikleri çalıştırın ve aşağıdaki çıktıyla karşılaştırın.
    2. `rootfs-denetle.sh` içindeki `find` ifadelerini okuyun: `-perm -4000` (bit **açık** olanlar) ile
       `-perm 4000` (izinleri **tam olarak** 4000 olanlar) arasındaki farkı açıklayın.
    3. Kasıtlı hataları (`bin/su` setuid, `data/kalibrasyon.csv` 666, kırık bağlantı) giderip denetimi
       yeniden çalıştırın; tüm başlıkların altı boş kalmalıdır.
    4. Bir Yocto derlemeniz varsa aynı betiği imajın kök dizinine uygulayın:
       `rootfs-denetle.sh tmp/work/<makine>/<imaj>/1.0/rootfs`. Gerçek bir imajda `su` ve `passwd` gibi
       setuid programlar görülmesi olağandır; listenin ürün gereksinimleriyle uyumlu olup olmadığını
       değerlendirin.

    <div class="terminal" data-oturum="rootfs-denetim"></div>

## 2.6 Kullanıcılar, gruplar ve sahiplik

Çekirdek kullanıcıları ad ile değil, sayısal **uid** ve **gid** değerleriyle tanır. Ad ile numara
arasındaki eşleme kullanıcı alanındaki dosyalarda tutulur:

| Dosya | Biçim (iki nokta üst üsteyle ayrılmış alanlar) |
|---|---|
| `/etc/passwd` | `ad:x:uid:gid:açıklama:ev_dizini:kabuk` (herkes okuyabilir) |
| `/etc/shadow` | `ad:parola_özeti:son_değişiklik:…` (yalnızca root okuyabilir) |
| `/etc/group` | `grup:x:gid:üye1,üye2` |

Her süreç bir uid, bir birincil gid ve bir ek grup listesi taşır; `id` komutu bunları gösterir. Bir
kullanıcı bir gruba eklendiğinde (`usermod -aG sensor kullanici`) bu değişiklik **yeni oturumlarda**
geçerli olur; açık kabuklar eski grup listesiyle çalışmaya devam eder. Seri port (`dialout`), I2C
(`i2c`) gibi aygıtlara root olmadan erişim, aygıt dosyasının grubuna üye olmakla sağlanır.

Sahiplik `chown kullanıcı:grup dosya` ile değiştirilir. Bir dosyanın sahibini yalnızca root
değiştirebilir; aksi halde kullanıcılar kota ve sorumluluktan kaçmak için dosyalarını başkasına
devredebilirdi. Sıradan bir kullanıcı ise `chgrp` ile dosyasının grubunu yalnızca üyesi olduğu bir
gruba çevirebilir.

**sudo**, `/etc/sudoers` dosyasındaki kurallara göre bir komutu başka bir kullanıcının (çoğunlukla root)
kimliğiyle çalıştırır ve bu işlemi günlüğe kaydeder. Kurallar yalnızca `visudo` ile düzenlenmelidir;
`visudo` sözdizimini denetler ve hatalı bir dosyanın tüm yönetici erişimini kilitlemesini önler.
`sudo -l` kullanıcının hangi komutları çalıştırabileceğini listeler.

!!! dikkat "`sudo` yönlendirmeyi kapsamaz"
    `sudo echo 'aralik=10' > /etc/sensor.conf` komutu "Permission denied" verir. Yönlendirme (`>`),
    `sudo` çalışmadan önce **kullanıcının kendi kabuğu** tarafından yapılır; `sudo` yalnızca `echo`'yu
    root olarak çalıştırır. Doğru biçimler:

    ```bash
    echo 'aralik=10' | sudo tee /etc/sensor.conf > /dev/null      # tee dosyayı root olarak açar
    echo 'aralik=10' | sudo tee -a /etc/sensor.conf > /dev/null   # sona ekleme
    sudo sh -c 'echo "aralik=10" > /etc/sensor.conf'              # tüm komut root kabuğunda
    ```

## 2.7 Yocto'da sahiplik, izin ve kullanıcılar

Yocto derlemesi sıradan bir kullanıcı hesabıyla çalışır, ancak imajdaki dosyaların çoğu root'a ait
olmalıdır. Bu çelişki **pseudo** adlı araçla çözülür: `do_install` ve paketleme görevleri pseudo
altında çalışır; `chown`, `chmod` ve aygıt dosyası oluşturma işlemleri gerçekte uygulanmaz, bir
veritabanına kaydedilir ve paket oluşturulurken bu kayıttaki sahiplik kullanılır. Bu nedenle tarifte
`chown root:sensor ${D}${sysconfdir}/sensor.conf` yazmak geçerlidir.

İzinlerin `do_install` içinde açıkça verilmesi iyi uygulamadır. `cp` kaynak dosyanın iznini ve
derleme makinesindeki umask'ı yansıtır; `install` ise izni tek adımda ve açıkça belirler:

```bitbake
do_install() {
    install -d -m 0755 ${D}${bindir} ${D}${sysconfdir}
    install -m 0755 ${S}/sensor-izle.sh ${D}${bindir}/sensor-izle
    install -m 0640 ${S}/sensor.conf ${D}${sysconfdir}/sensor.conf
    chown root:sensor ${D}${sysconfdir}/sensor.conf
}
```

Bu tarifteki `sensor` grubu hedef sistemde bulunmalıdır. Sistem kullanıcıları ve grupları paketle
birlikte `useradd` sınıfıyla tanımlanır; paket kurulurken oluşturulurlar:

```bitbake
inherit useradd
USERADD_PACKAGES = "${PN}"
GROUPADD_PARAM:${PN} = "--system sensor"
USERADD_PARAM:${PN} = "--system --no-create-home --shell /sbin/nologin --gid sensor sensor"
```

İmaj düzeyindeki hesaplar (ör. geliştirme imajında bir parola) ise imaj tarifinde `extrausers` sınıfı
ve `EXTRA_USERS_PARAMS` ile verilir. Kurulan dosyaların derleme makinesindeki kullanıcıya ait kalması
`host-user-contaminated` kalite denetimiyle yakalanır; bu uyarı genellikle `cp -a` veya `tar` ile
sahipliği korunarak kopyalanan dosyalardan kaynaklanır. Ayrıntılar için bkz.
<a href="../../yocto-gomulu-linux/bolumler/09-imajlar.html">Yocto kitabı, Bölüm 9</a> ve
<a href="../../yocto-gomulu-linux/bolumler/17-guvenlik-guncelleme.html">Bölüm 17</a>.

## Özet

- Linux'ta tek bir dizin ağacı vardır; FHS dizinlerin amacını tanımlar. Yocto'da `/var/log` RAM'deki `/var/volatile` altındadır.
- Dosya inode ile temsil edilir; ad dizin kaydındadır. Sabit bağlantı aynı inode'a yeni ad, sembolik bağlantı yol içeren ayrı bir dosyadır.
- `rm` bağlantı sayısını azaltır; açık dosyanın alanı süreç kapanana kadar serbest kalmaz. Aynı dosya sisteminde `mv` atomiktir.
- Dizinde `r` listeleme, `w` ad ekleme/silme, `x` içeri girme iznidir. Silme izni dosyanın değil dizinin iznine bağlıdır.
- umask yeni dosyanın izninden bit çıkarır; hiçbir zaman izin eklemez. Gizli dosyalar `umask 077` veya `install -m 0600` ile oluşturulmalıdır.
- setuid programlar sahibinin yetkisiyle çalışır ve denetlenmelidir; yapışkan bit `/tmp` gibi ortak dizinleri korur.
- `sudo` yönlendirmeyi kapsamaz; `sudo tee` kullanılır. Yocto'da sahiplik pseudo ile, hesaplar `useradd` ve `extrausers` sınıflarıyla yönetilir.

## Değerlendirme soruları

<div class="quiz" data-id="b02-1">
<p class="quiz-soru">Bir dosyanın iki sabit bağlantısı (<code>a</code> ve <code>b</code>) vardır. <code>rm a</code> komutundan sonra ne olur?</p>
<ul>
<li>Veri silinir; <code>b</code> kırık bağlantı olur</li>
<li data-dogru>Yalnızca <code>a</code> adı kaldırılır; bağlantı sayısı 1'e iner ve veri <code>b</code> üzerinden erişilebilir kalır</li>
<li><code>rm</code> hata verir; önce <code>b</code> silinmelidir</li>
<li><code>b</code> otomatik olarak <code>a</code> adını alır</li>
</ul>
<p class="quiz-aciklama">Sabit bağlantılar aynı inode'u gösteren eşit adlardır. <code>rm</code> bir dizin kaydını siler; inode ve veri bağlantı sayısı sıfıra inene kadar korunur.</p>
</div>

<div class="quiz" data-id="b02-2">
<p class="quiz-soru"><code>-r--r--r--</code> izinli ve root'a ait bir dosya, <code>drwxrwxrwx</code> izinli bir dizinde bulunuyor. Sıradan bir kullanıcı bu dosyayı silebilir mi?</p>
<ul>
<li>Hayır; dosyanın yazma izni yoktur</li>
<li>Hayır; yalnızca root kendi dosyasını silebilir</li>
<li data-dogru>Evet; silme dizine yazma işlemidir. Dizinde yapışkan bit olsaydı silemezdi</li>
<li>Yalnızca <code>rm -f</code> ile</li>
</ul>
<p class="quiz-aciklama">Silme, dizin kaydının kaldırılmasıdır ve dizinin <code>w</code> iznine bağlıdır. Yapışkan bit (<code>drwxrwxrwt</code>) bu durumda silmeyi dosya sahibi, dizin sahibi ve root ile sınırlar.</p>
</div>

<div class="quiz" data-id="b02-3">
<p class="quiz-soru">umask değeri <code>027</code> iken bir programın 666 izniyle oluşturduğu dosyanın izni ne olur?</p>
<ul>
<li><code>639</code></li>
<li data-dogru><code>640</code> (<code>rw-r-----</code>)</li>
<li><code>750</code></li>
<li><code>666</code>; umask yalnızca dizinlere uygulanır</li>
</ul>
<p class="quiz-aciklama">İzin <code>666 &amp; ~027</code> ile hesaplanır: sahipten hiçbir bit, gruptan w (2), diğerlerinden rwx (7) çıkarılır. Sonuç rw- r-- --- yani 640'tır. Aritmetik çıkarma değil, bit maskelemesi yapılır.</p>
</div>

<div class="quiz" data-id="b02-4">
<p class="quiz-soru"><code>sudo echo 1 &gt; /proc/sys/net/ipv4/ip_forward</code> komutu "Permission denied" veriyor. Neden?</p>
<ul>
<li><code>/proc</code> dosyaları yazılamaz</li>
<li data-dogru>Yönlendirme <code>sudo</code> çalışmadan önce kullanıcının kendi kabuğu tarafından, kullanıcının yetkisiyle yapılır</li>
<li><code>echo</code> bir yerleşik olduğu için <code>sudo</code> ile çalışmaz</li>
<li><code>sudo</code> bu dosya için yapılandırılmamıştır</li>
</ul>
<p class="quiz-aciklama">Kabuk önce yönlendirmeyi uygular (dosyayı açar), sonra <code>sudo</code> programını çalıştırır. Doğru biçim: <code>echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward</code>.</p>
</div>

<div class="quiz" data-id="b02-5">
<p class="quiz-soru">Yocto tarifinde <code>do_install</code> içinde <code>chown root:sensor ${D}${sysconfdir}/sensor.conf</code> yazılması neden derleme makinesinde yetki hatası vermez?</p>
<ul>
<li>BitBake root olarak çalışır</li>
<li><code>chown</code> komutu BitBake tarafından yok sayılır</li>
<li data-dogru>Görev pseudo altında çalışır; sahiplik değişikliği bir veritabanına kaydedilir ve paket oluşturulurken uygulanır</li>
<li><code>${D}</code> dizini otomatik olarak root'a aittir</li>
</ul>
<p class="quiz-aciklama">pseudo, sahiplik ve izin işlemlerini yakalayıp kendi veritabanında tutan bir fakeroot uygulamasıdır. Bu sayede derleme sıradan kullanıcıyla yapılırken imajdaki dosyalar doğru sahipliği alır.</p>
</div>

!!! alistirma "Alıştırma: Ortak veri dizini"
    Ağ geçidinde `sensor` grubundaki birden çok servisin ortak kullanacağı `/data/olcum` dizini
    oluşturulacaktır. Gereksinimler:

    1. Gruptaki herkes dizine dosya yazabilmelidir; grupta olmayanlar dizini göremez.
    2. Dizinde oluşturulan dosyalar, oluşturan kullanıcının birincil grubu ne olursa olsun `sensor` grubuna ait olmalıdır.
    3. Bir servis, başka bir servisin dosyasını silememelidir.
    4. Servislerin yeni dosyaları grup tarafından okunabilir ve yazılabilir oluşmalıdır.

    Dizinin sahipliğini, izinlerini (sekizli) ve servislerin kullanacağı umask değerini belirleyin.

    ??? success "Örnek çözüm"
        ```bash
        install -d -o root -g sensor -m 3770 /data/olcum
        ls -ld /data/olcum     # drwxrws--T root sensor
        ```

        - `770`: sahip ve grup tam yetkili, diğerlerine erişim yok (gereksinim 1).
        - `2000` (setgid): yeni dosyalar dizinin grubunu (`sensor`) alır (gereksinim 2).
        - `1000` (yapışkan bit): dosyayı yalnızca sahibi silebilir (gereksinim 3). Diğerlerinde `x`
          olmadığı için `ls` çıktısında büyük `T` görünür.
        - Servisler `umask 007` ile çalıştırılmalıdır: yeni dosyalar `660`, dizinler `770` olur
          (gereksinim 4). systemd biriminde bu `UMask=0007` satırıyla verilir.

        Yocto'da aynı dizin bir tarifin `do_install` görevinde
        `install -d -m 3770 ${D}/data/olcum` ve `chown root:sensor ${D}/data/olcum` ile oluşturulur;
        `sensor` grubu `useradd` sınıfıyla tanımlanır.

**Sonraki bölüm:** [3 · Metin işleme: grep, sed, awk, find, xargs →](03-metin-isleme.md)
