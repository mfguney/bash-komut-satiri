# 8 · Gömülü sistemlerde ve Yocto'da kabuk betikleri

<div class="kunye" markdown>
<span>Süre: ~60 dk + uygulama</span><span>Düzey: Orta–İleri</span><span>Ön koşul: Bölüm 5–7; Yocto kitabı Bölüm 6</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - BusyBox'ın yapısını ve ash kabuğunun bash ile farklarını açıklayabilir, hedefte çalışacak betikleri derleme makinesinde sınayabilirsiniz.
    - Bir SysV init betiği yazabilir; açılış sırasında hangi dosyaların hangi sırayla çalıştığını açıklayabilirsiniz.
    - Aynı servisin systemd birimiyle nasıl tanımlandığını ve kabuk betiğine ne zaman ihtiyaç kalmadığını açıklayabilirsiniz.
    - BitBake kabuk görevlerinin `run.do_*` betiğine dönüşmesini, çalışma ortamını ve `${D}` ile ilişkisini açıklayabilirsiniz.
    - `pkg_postinst` betiklerini imaj oluşturma ve cihaz üzerinde kurulum durumlarını gözeterek yazabilirsiniz.
    - Yocto derlemesi için hata durumunu doğru raporlayan ve günlükleri toplayan bir CI betiği yazabilirsiniz.

## 8.1 BusyBox: tek ikili, yüzlerce komut

Ekransız bir ağ geçidinin kök dosya sistemi çoğu zaman birkaç on megabayttır. GNU coreutils, bash,
grep, sed, gawk ve findutils'in ayrı ayrı kurulması bu bütçenin önemli bir kısmını tüketir. **BusyBox**,
bu araçların küçültülmüş karşılıklarını (*applet*) tek bir çalıştırılabilir dosyada toplar. Yocto'nun
küçük imajlarında (`core-image-minimal` ve türevleri) `/bin/sh`, `ls`, `cat`, `grep`, `sed`, `awk`,
`find` ve hatta `init` BusyBox tarafından sağlanır.

BusyBox hangi applet'in çalışacağını **argv[0]'dan**, yani çağrıldığı addan anlar. `/bin/ls`
`busybox`'a bir sembolik bağlantıdır; `ls` olarak çağrılan busybox kendini `ls` gibi davranır.
`busybox ls` biçiminde doğrudan çağrı da mümkündür. Hangi applet'lerin derleneceği ve her applet'in
hangi özellikleri içereceği bir Kconfig yapılandırmasıyla belirlenir. Yocto'da bu yapılandırma
`busybox` tarifinin `defconfig` dosyası ve `SRC_URI`'ye eklenen `.cfg` parçalarıyla yönetilir;
`bitbake -c menuconfig busybox` ile değiştirilir, `bitbake -c diffconfig busybox` ile değişiklik bir
parçaya dönüştürülüp katmana eklenir
(bkz. <a href="../../yocto-gomulu-linux/bolumler/07-katmanlar.html">Yocto kitabı, Bölüm 7</a>).

<div class="terminal" data-oturum="busybox-ash"></div>

Oturumdaki tablo, Ubuntu 24.04'ün BusyBox 1.36.1 paketiyle elde edilmiştir. **Bu sonuçlar BusyBox'ın
derleme yapılandırmasına bağlıdır**: ash'in bash uyumluluk özellikleri (`[[ ]]`, `${x/a/b}`, `$'…'`,
süreç ikamesi gibi) Kconfig seçenekleriyle açılıp kapatılır ve Yocto'nun varsayılan yapılandırması
farklı olabilir. Hedefte çalışacak bir betiğin hangi özellikleri kullanabileceği, hedef imajdaki
busybox üzerinde `examples/08-gomulu/busybox-uyum.sh` çalıştırılarak belirlenmelidir. En güvenli
yaklaşım, hedef betiklerini yalnızca POSIX sh ile yazmak ve ShellCheck'in `-s sh` denetimine
güvenmektir (Bölüm 7).

BusyBox applet'leri de GNU araçlarından farklıdır. Uzun seçeneklerin çoğu yoktur; `grep -P`,
`find -printf`, `sed`'in bazı GNU ekleri ve `date -d` ile serbest biçimli tarih ayrıştırma bulunmayabilir
veya sınırlıdır. Derleme makinesinde yazılan bir betikteki her dış komutun seçenekleri hedefteki
`komut --help` çıktısıyla karşılaştırılmalıdır. bash veya GNU araçları gerçekten gerekiyorsa `bash`,
`coreutils`, `findutils` paketleri imaja eklenebilir; bu durumda paket, betiği içeren paketin
`RDEPENDS` değişkenine yazılmalıdır.

## 8.2 Açılış ve init betikleri

Çekirdek kök dosya sistemini bağladıktan sonra `/sbin/init` programını PID 1 olarak başlatır. Yocto'da
init sistemi dağıtım politikasıyla seçilir (`INIT_MANAGER`): Poky'nin varsayılanı **SysVinit**'tir,
ÖrnekOS ise **systemd** kullanır; en küçük sistemler için `mdev-busybox` seçeneği BusyBox'ın kendi
`init` applet'ini kullanır
(bkz. <a href="../../yocto-gomulu-linux/bolumler/11-distro.html">Yocto kitabı, Bölüm 11</a>). İlk iki
düzende servisler kabuk betikleriyle başlatılır.

SysVinit, `/etc/inittab` dosyasını okur. Poky'nin `sysvinit-inittab` tarifindeki dosyada açılış
`si::sysinit:/etc/init.d/rcS` satırıyla başlar ve varsayılan çalışma düzeyi için
`l5:5:wait:/etc/init.d/rc 5` satırı çalışır. `rc` betiği, `/etc/rc5.d/` dizinindeki **S** ile başlayan
bağlantıları ad sırasıyla `start` argümanıyla çalıştırır; kapanışta `/etc/rc0.d/` veya `/etc/rc6.d/`
altındaki **K** bağlantıları `stop` ile çalışır. Bağlantıların hepsi `/etc/init.d/` altındaki asıl
betiklere işaret eder; adlardaki iki basamaklı sayı sırayı belirler. BusyBox init'in inittab biçimi
farklıdır (`::sysinit:/etc/init.d/rcS` gibi; çalışma düzeyi alanı kullanılmaz), ancak servis
betiklerinin kendisi aynı yapıdadır.

<div class="akis" data-senaryo="init-baslatma"></div>

Bir init betiği, ilk argümanına göre `start`, `stop`, `restart`, `reload` ve `status` eylemlerini
yerine getiren bir POSIX sh betiğidir. `examples/08-gomulu/meta-ornek/recipes-ornek/sensor-izle/files/`
dizinindeki `sensor-izle.init` dosyası bu yapıyı izler ve dikkat edilecek ayrıntıları içerir:

- **LSB başlığı** (`### BEGIN INIT INFO`): servisin bağımlılıklarını ve varsayılan çalışma düzeylerini
  bildirir. Yocto'da sıra `update-rc.d` sınıfının `INITSCRIPT_PARAMS` değişkeniyle belirlenir; başlık
  yine de belgeleme ve diğer araçlar için yazılır.
- **start-stop-daemon**: programı arka plana alır, PID dosyasını yazar, aynı programın ikinci kez
  başlatılmasını engeller ve durdururken doğru sürece sinyal gönderir. Hem Debian'ın (dpkg) hem de
  BusyBox'ın uygulaması bulunur; betik yalnızca ikisinde ortak olan kısa seçenekleri (`-S -K -b -m -p
  -x -s -q -o`) kullanır.
- **Çıktı yönlendirmesi**: `-b` ile arka plana alınan programın standart çıktısı kapatılır. Program
  iletilerini standart çıktıya yazar; init betiği bunu bir ara kabukla günlük dosyasına yönlendirir
  ve `exec` ile ara kabuğun programa dönüşmesini, böylece PID'in değişmemesini sağlar.
- **Çıkış durumları**: LSB kuralına göre `status` çalışmayan servis için 3, tanınmayan eylem için
  betik sıfır dışı bir durum döndürür.

Servis programının kendisi (`sensor-izle.sh`) de bir kabuk betiğidir. `SIGHUP` ile ayarlarını yeniden
okur, `SIGTERM` ve `SIGINT` ile temiz biçimde çıkar ve beklemeyi `sleep & wait` kalıbıyla yaparak
sinyallere gecikmeden yanıt verir (Bölüm 4). Aşağıdaki oturumda her iki betik derleme makinesinde,
denemeye özgü yollarla çalıştırılmıştır:

<div class="terminal" data-oturum="init-betigi"></div>

## 8.3 systemd ile ilişki

systemd'de servisler kabuk betiğiyle değil, bildirimsel bir **birim dosyasıyla** tanımlanır. Aynı
servisin birimi `sensor-izle.service` dosyasındadır:

```ini
[Service]
Type=simple
ExecStart=/usr/bin/sensor-izle
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
```

Init betiğinin yaptığı işlerin çoğunu systemd kendisi üstlenir: süreç arka planda tutulur ve izlenir,
PID dosyasına gerek kalmaz, standart çıktı ve standart hata journal'a yönlendirilir, çöken servis
`Restart=` politikasına göre yeniden başlatılır, bağımlılıklar `After=`/`Wants=` ile tanımlanır. Bu
nedenle systemd kullanan bir sistemde servis için ayrıca init betiği yazılmaz.

| Görev | SysV init betiği | systemd birimi |
|---|---|---|
| Arka plana alma, PID izleme | `start-stop-daemon -b -m -p` | `Type=simple` (otomatik) |
| Günlük | Betikte yönlendirme | Journal (`journalctl -u sensor-izle`) |
| Yeniden okuma | `start-stop-daemon -K -s HUP` | `ExecReload=` + `systemctl reload` |
| Çökme sonrası yeniden başlatma | Yok (ayrı bir izleyici gerekir) | `Restart=on-failure` |
| Ortam ve kısıtlar | Betikte `export`, `ulimit`, `su` | `Environment=`, `User=`, `UMask=`, `AmbientCapabilities=` |

`ExecStart=` satırı **bir kabuk tarafından yorumlanmaz**: `$AD` ve `${AD}` biçimindeki ortam
değişkenleri genişletilir, ancak boru, yönlendirme, `&&` ve glob çalışmaz. Bu tür bir işlem
gerekiyorsa ya ayrı bir betik çalıştırılır ya da açıkça `ExecStart=/bin/sh -c '…'` yazılır. Kabuk
betikleri systemd'li sistemlerde de yer alır: servisin kendisi bir betik olabilir (sensor-izle gibi),
`ExecStartPre=` ile ön hazırlık yapılabilir veya `systemd-tmpfiles` ile karşılanamayan bir kurulum
adımı betikle gerçekleştirilebilir.

Yocto'da her iki düzen aynı tarifle desteklenebilir. `inherit update-rc.d systemd` satırı iki sınıfı
birlikte devralır; dağıtımın `DISTRO_FEATURES` değerine göre ilgili sınıf etkin olur. `INITSCRIPT_NAME`
ve `INITSCRIPT_PARAMS` SysV bağlantılarını, `SYSTEMD_SERVICE:${PN}` birim dosyasını tanımlar; birimin
açılışta etkinleştirilmesi `SYSTEMD_AUTO_ENABLE` (varsayılan `enable`) ile denetlenir. Örnek tarif
`examples/08-gomulu/meta-ornek/recipes-ornek/sensor-izle/sensor-izle_1.0.bb` dosyasındadır.

## 8.4 BitBake kabuk görevleri

Bir tarifte kabuk fonksiyonu olarak tanımlanan görevler (`do_configure`, `do_compile`, `do_install`
ve kullanıcı tanımlı görevler) BitBake tarafından doğrudan çalıştırılmaz. BitBake her çalıştırmada
şu adımları izler:

1. Fonksiyon metnindeki `${AD}` başvurularını ve `${@…}` Python ifadelerini **BitBake değişkenleriyle
   genişletir**. `${D}${bindir}` görev betiğine `…/image/usr/bin` olarak yazılır.
2. Tarifin geçici dizininde (`${T}`, `${WORKDIR}/temp`) `run.do_<görev>.<pid>` adlı bir betik üretir
   ve kısa adı (`run.do_<görev>`) bu dosyaya bağlar. Betiğin başında `#!/bin/sh`, bir EXIT tuzağı ve
   `set -e` bulunur; ardından dışa aktarılan değişkenler `export` satırları olarak, görev fonksiyonu
   ve onun çağırdığı diğer kabuk fonksiyonları (`oe_runmake`, `bbfatal` gibi) genişletilmiş halleriyle
   yazılır; en sonda görevin çalışma dizinine `cd` yapılır ve fonksiyon çağrılır.
3. Betiği çalıştırır. Hedef paketlerin `do_install` ve paketleme görevleri **pseudo** altında çalışır
   (Bölüm 2). Çıktı `log.do_<görev>.<pid>` dosyasına yazılır.
4. Betik sıfırdan farklı durumla biterse görevi başarısız sayar ve günlüğün yolunu bildirir.

<div class="akis" data-senaryo="bitbake-kabuk-gorevi"></div>

Görevin çalıştığı ortamın birkaç özelliği betik yazımını doğrudan etkiler:

| Özellik | Sonuç |
|---|---|
| Yorumlayıcı derleme makinesinin `/bin/sh` kabuğudur | Ubuntu ve Debian'da dash: diziler, `[[ ]]`, `${x//}` kullanılamaz |
| `set -e` etkindir | Başarısızlığı beklenen komutlar <code>&#124;&#124; true</code> ile işaretlenmeli |
| Çalışma dizini görevin `dirs` bayrağının son öğesidir | `do_install` için `${B}`; görevde `cd` gerekmez |
| `${D}` görev öncesinde temizlenir (`cleandirs`) | `do_install` her çalıştırmada boş bir kökten başlar |
| PATH sysroot ve `tmp/hosttools` ile sınırlıdır | Derleme makinesinde kurulu her araç görülmez; `-native` bağımlılığı eklenir |
| Kabuğun ortamı temizlenmiştir | Yalnızca tarifte `export` edilen değişkenler görülür |

Günlüğe ileti yazmak için `logging` sınıfındaki kabuk fonksiyonları kullanılır: `bbnote`, `bbwarn`,
`bberror` ve görevi durduran `bbfatal`. Örneğin
`[ -f ${S}/sensor-izle.default ] || bbfatal "ayar dosyası eksik"`. Bir görevin sonuna kod eklemek için
`do_install:append() { … }` kullanılır; BitBake iki fonksiyonu tek bir kabuk fonksiyonunda birleştirir.

Aşağıdaki oturum, `sensor-izle` tarifinin `do_install` görevi için üretilen betiğin **yapısını izleyen**
bir benzetimdir: `examples/08-gomulu/run-benzetim/run.do_install.ornek` dosyasındaki tuzak kodu
BitBake'in kaynak kodundaki (`lib/bb/build.py`) ile aynıdır, dışa aktarılan değişkenler kısaltılmıştır.
Betik, gerçek BitBake'in oluşturacağı dizin düzeninde ve aynı kabukla (dash) çalıştırılmıştır.

<div class="terminal" data-oturum="run-do-install"></div>

!!! iyi "Başarısız bir görevi elle yeniden çalıştırmak"
    Görev betiği bağımsız çalışabilen bir dosya olduğundan hata ayıklamada doğrudan kullanılabilir:
    `cd ${WORKDIR}/temp` dizininde `sh -x ./run.do_install` komutu görevi her komutu yazarak yeniden
    çalıştırır. Betikte geçici bir değişiklik yapılarak bir düzeltme denenebilir; kalıcı düzeltme ise
    tarife yazılmalı ve görev `bitbake -c install -f sensor-izle` ile yeniden çalıştırılmalıdır. pseudo
    gerektiren görevlerde elle çalıştırma sahiplik işlemlerinde farklı sonuç verebilir; bu durumda
    `bitbake -c devshell` ile açılan ortam tercih edilir
    (bkz. <a href="../../yocto-gomulu-linux/bolumler/14-hata-ayiklama.html">Yocto kitabı, Bölüm 14</a>).

## 8.5 Kurulum sonrası betikler

Paket yöneticisi bir paketi kurarken veya kaldırırken paketle birlikte gelen betikleri çalıştırır:
`pkg_preinst`, `pkg_postinst`, `pkg_prerm`, `pkg_postrm`. Yocto'da bu betikler iki farklı ortamda
çalışabilir ve bu ayrım betiğin yazımını belirler:

| Durum | Nerede çalışır | `$D` |
|---|---|---|
| İmaj oluşturulurken (`do_rootfs`) | **Derleme makinesinde**, kök dosya sistemi dizini üzerinde | Kök dosya sisteminin yolu |
| Paket çalışan bir cihaza kurulurken (`opkg install`, `dnf install`) | Hedef cihazda | Boş |

Betik her iki durumda doğru davranacak biçimde yazılır: dosya yolları `$D` önekiyle verilir
(`$D${sysconfdir}/…`) ve yalnızca hedefte anlamlı işlemler (`systemctl`, servis yeniden başlatma,
aygıt erişimi) `[ -z "$D" ]` koşuluna bağlanır. `$D` kıvrık ayraçsız yazılır; `${D}` yazılırsa
BitBake bunu derleme anındaki `image` yoluna genişletir (Bölüm 5). Betik `/bin/sh` ile çalıştığından
POSIX sh kuralları geçerlidir.

```bitbake
pkg_postinst:${PN}() {
    if [ -n "$D" ]; then
        echo "sensor-izle: kök dosya sistemine kuruldu: $D"
    elif [ -x ${sysconfdir}/init.d/sensor-izle ]; then
        if ${sysconfdir}/init.d/sensor-izle status >/dev/null 2>&1; then
            ${sysconfdir}/init.d/sensor-izle restart
        fi
    fi
}
```

Bu fonksiyonda `exit` kullanılmamıştır. `update-rc.d` ve `systemd` sınıfları kendi kurulum kodlarını
(bağlantıların oluşturulması, birimin etkinleştirilmesi) **aynı `pkg_postinst` betiğinin sonuna
ekler**; tarifin kendi kodundaki bir `exit 0`, sınıfların kodunun hiç çalışmamasına yol açar.

Bazı işlemler ancak hedefte yapılabilir (ör. cihaza özgü bir anahtar üretmek). Bunun için
`pkg_postinst_ontarget:${PN}` kullanılır; betik ilk açılışta çalıştırılmak üzere ertelenir. Ertelenen
betikler salt okunur kök dosya sistemiyle (`read-only-rootfs`) birlikte kullanılamaz ve ilk açılışı
uzatır; mümkün olan her işin derleme anında, `do_install` içinde veya imaj oluşturulurken yapılması
tercih edilmelidir (bkz. <a href="../../yocto-gomulu-linux/bolumler/17-guvenlik-guncelleme.html">Yocto kitabı, Bölüm 17</a>).

## 8.6 Yocto için CI betikleri

Sürekli entegrasyon sistemleri (GitHub Actions, GitLab CI, Jenkins) bir işin başarısını yalnızca
**çalıştırılan komutun çıkış durumundan** anlar. Yocto derlemesini çalıştıran bir betiğin en önemli
görevi bu nedenle hatayı doğru durumla raporlamak, ikinci görevi ise hata ayıklama için gereken
günlükleri yapıt (*artifact*) olarak toplamaktır. `examples/08-gomulu/ci/ci-derle.sh` betiği önceki
bölümlerin tekniklerini bu amaçla birleştirir:

- `set -euo pipefail` ile başlar; seçenekleri `getopts` ile ayrıştırır, `-k` seçeneğini bir diziye
  koyarak `bitbake "${devam[@]}" "$imaj"` biçiminde güvenle aktarır.
- Ortam betiğini kaynaklamadan önce `set +u` yapar ve hemen sonra geri açar; ortam betikleri
  tanımsız değişkenlere başvurabilir.
- `bitbake … 2>&1 | tee "$gunluk"` ile çıktıyı hem ekrana hem dosyaya yazar ve `PIPESTATUS[0]` ile
  bitbake'in kendi durumunu alır; `tee`'nin başarısı hatayı gizlemez.
- EXIT tuzağında, günlükteki `log:` satırlarından başarısız görevlerin günlük dosyalarını bulup çıktı
  dizinine kopyalar ve Bölüm 3'teki `bitbake-ozet.sh` ile bir özet üretir. Tuzak, bitbake'in çıkış
  durumunu korur.

Betik gerçek bir Yocto kurulumu olmadan da denenebilsin diye aynı dizinde `sahte-kurulum-olustur.sh`
bulunur; bu betik örnek bir BitBake çıktısını yazan ve 1 ile çıkan sahte bir `bitbake` komutu oluşturur.

<div class="terminal" data-oturum="ci-betigi"></div>

CI tarafında iş akışı dosyası bu betiği çağırır, `ci-cikti/` dizinini yapıt olarak yükler ve
gerekiyorsa `timeout` ile bir üst süre sınırı koyar. İş akışı örnekleri ve sstate/indirme
önbelleklerinin CI'da paylaşılması için bkz.
<a href="../../yocto-gomulu-linux/bolumler/18-ci.html">Yocto kitabı, Bölüm 18</a>; depo ve dal yönetimi
için <a href="../../git-surum-kontrolu/bolumler/08-ekip-akislari.html">Git kitabı, Bölüm 8</a>.

!!! lab "Uygulama 8.1 · sensor-izle servisinin hedefte denenmesi"
    **Derleme makinesinde (Yocto gerekmez):**

    1. `busybox-uyum.sh` betiğini `bash`, `dash` ve `busybox sh` ile çalıştırın; `sensor-izle.sh` ve
       `sensor-izle.init` betiklerinin yalnızca üç kabukta da "var" olan yapıları kullandığını kod
       üzerinden doğrulayın. İki betiği `shellcheck -s sh` ile denetleyin.
    2. Yukarıdaki `init-betigi` oturumunu kendi dizininizde yineleyin. `temp1_input` dosyasına geçersiz
       bir değer (`abc`) yazıp günlükte `HATA geçersiz okuma` satırını görün.
    3. `run-benzetim/benzetim-hazirla.sh` ile benzetim dizinini oluşturun; `run.do_install` betiğinde
       `sensor-izle.default` dosyasının iznini 0600 yapacak bir değişiklikle betiği yeniden çalıştırıp
       `image/etc/default/` altındaki sonucu `stat` ile doğrulayın.

    **Yocto kurulumu varsa:**

    4. `examples/08-gomulu/meta-ornek/recipes-ornek/sensor-izle` dizinini Yocto kitabındaki
       `meta-ornek` katmanına kopyalayın ve `IMAGE_INSTALL:append = " sensor-izle"` ile imaja ekleyin.
    5. `bitbake -c install sensor-izle` sonrasında `${WORKDIR}/temp/run.do_install` dosyasını açın;
       `do_install` gövdesindeki `${@bb.utils.contains(...)}` ifadelerinin `true`/`false` olarak
       genişlediğini ve ÖrnekOS'ta (systemd) init betiğinin kurulmadığını doğrulayın.
    6. İmajı QEMU'da başlatıp `systemctl status sensor-izle` ve `journalctl -u sensor-izle` ile servisi
       inceleyin. QEMU'da hwmon sensörü bulunmadığından günlükte `HATA sensör okunamadı` satırları
       görülmesi beklenir; `/etc/default/sensor-izle` dosyasında `GIRDI` değerini elle oluşturulan bir
       dosyaya yönlendirip `systemctl reload sensor-izle` ile ayarın yeniden okunduğunu doğrulayın.

## Özet

- BusyBox, applet'leri tek ikilide toplar ve çalışacak applet'i argv[0]'dan seçer; özellikleri Kconfig ile belirlenir, Yocto'da `.cfg` parçalarıyla değiştirilir.
- ash'in bash uyumluluğu yapılandırmaya bağlıdır; hedef betikleri POSIX sh ile yazılmalı ve hedefteki busybox üzerinde sınanmalıdır.
- SysVinit `inittab` → `rcS` → `rcN.d/S##` sırasıyla init betiklerini çalıştırır; `update-rc.d` sınıfı bağlantıları `INITSCRIPT_PARAMS` ile oluşturur.
- systemd birimleri PID izleme, günlük ve yeniden başlatmayı kendisi yapar; `ExecStart=` bir kabuk tarafından yorumlanmaz.
- BitBake kabuk görevlerini genişletip `${T}/run.do_*` betiğine yazar ve `/bin/sh` ile `set -e` altında çalıştırır; çıktı `log.do_*` dosyasındadır.
- `pkg_postinst` hem derleme makinesinde (`$D` dolu) hem hedefte (`$D` boş) çalışabilir; `$D` ayraçsız yazılır ve `exit` kullanılmaz.
- CI betiği bitbake'in durumunu `PIPESTATUS` ile korumalı, günlükleri EXIT tuzağında toplamalıdır.

## Değerlendirme soruları

<div class="quiz" data-id="b08-1">
<p class="quiz-soru">Hedef cihazda <code>/bin/ls</code> ve <code>/bin/cat</code> aynı dosyaya sembolik bağlantıdır. BusyBox hangi komutun çalışacağını nasıl belirler?</p>
<ul>
<li>Bağlantının hedef dosyasının adından</li>
<li data-dogru>Kendisine çağrıldığı addan, yani argv[0] değerinden</li>
<li>İlk argümandan; <code>ls</code> yazıldığında busybox'a "ls" argümanı verilir</li>
<li><code>/etc/busybox.conf</code> dosyasından</li>
</ul>
<p class="quiz-aciklama">Çekirdek sembolik bağlantı üzerinden busybox'ı çalıştırır, ancak argv[0] olarak çağrılan adı (<code>ls</code>) iletir. BusyBox bu adı applet tablosunda arar.</p>
</div>

<div class="quiz" data-id="b08-2">
<p class="quiz-soru">Bir tarifin <code>do_install</code> görevinde <code>for f in "${dosyalar[@]}"</code> satırı Ubuntu derleme makinesinde "Syntax error" veriyor, Fedora'da çalışıyor. Neden?</p>
<ul>
<li>Ubuntu'da BitBake'in eski bir sürümü kuruludur</li>
<li data-dogru>Görev betikleri <code>/bin/sh</code> ile çalışır; Ubuntu'da bu dash'tir ve dizileri desteklemez, Fedora'da ise bash'tir</li>
<li><code>${dosyalar[@]}</code> BitBake tarafından silinir</li>
<li>Fedora'da görevler pseudo olmadan çalışır</li>
</ul>
<p class="quiz-aciklama"><code>run.do_*</code> betiği <code>#!/bin/sh</code> ile başlar. Kabuk görevleri POSIX sh ile yazılmalıdır; aksi halde sonuç derleme makinesinin dağıtımına bağlı olur.</p>
</div>

<div class="quiz" data-id="b08-3">
<p class="quiz-soru">Bir <code>pkg_postinst:${PN}</code> fonksiyonu <code>if [ -n "$D" ]; then exit 0; fi</code> satırıyla başlıyor. Tarif <code>inherit systemd</code> içerdiğinde ne olur?</p>
<ul>
<li>Sorun yoktur; systemd sınıfı ayrı bir betik kullanır</li>
<li data-dogru>systemd sınıfının birimi etkinleştiren kodu aynı betiğin sonuna eklendiğinden imaj oluşturulurken hiç çalışmaz; servis etkinleştirilmez</li>
<li>BitBake derlemeyi durdurur</li>
<li>Betik hedefte iki kez çalışır</li>
</ul>
<p class="quiz-aciklama">Sınıflar kurulum kodlarını tarifin pkg_postinst fonksiyonuna ekler. Erken <code>exit</code> sonraki tüm kodu atlar. Koşullar <code>if … elif … fi</code> ile yazılmalı, <code>exit</code> kullanılmamalıdır.</p>
</div>

<div class="quiz" data-id="b08-4">
<p class="quiz-soru">systemd biriminde <code>ExecStart=/usr/bin/sensor-izle &gt;&gt; /var/log/sensor.log 2&gt;&amp;1</code> yazılmıştır. Ne olur?</p>
<ul>
<li>Çıktı dosyaya eklenir</li>
<li data-dogru>Yönlendirme yorumlanmaz; <code>&gt;&gt;</code>, dosya yolu ve <code>2&gt;&amp;1</code> programa argüman olarak verilir</li>
<li>systemd satırı otomatik olarak <code>/bin/sh -c</code> ile çalıştırır</li>
<li>Çıktı hem journal'a hem dosyaya gider</li>
</ul>
<p class="quiz-aciklama">ExecStart bir kabuk tarafından yorumlanmaz; yalnızca ortam değişkeni genişletmesi yapılır. Çıktı varsayılan olarak journal'a gider; dosya gerekiyorsa <code>StandardOutput=append:/var/log/sensor.log</code> veya açık bir <code>/bin/sh -c</code> kullanılır.</p>
</div>

<div class="quiz" data-id="b08-5">
<p class="quiz-soru">CI betiğinde <code>bitbake ornek-image | tee derleme.log</code> satırı kullanılıyor ve <code>pipefail</code> etkin değil. Derleme başarısız olduğunda CI işi neden başarılı görünür?</p>
<ul>
<li>bitbake hata durumunda 0 döndürür</li>
<li data-dogru>Boru hattının durumu son komut olan tee'nin durumudur; <code>pipefail</code> veya <code>PIPESTATUS[0]</code> kullanılmalıdır</li>
<li>tee standart hatayı yutar</li>
<li>CI sistemleri çıkış durumuna bakmaz</li>
</ul>
<p class="quiz-aciklama">tee günlüğü başarıyla yazdığı için 0 döndürür. bitbake'in durumunun CI'a ulaşması için <code>set -o pipefail</code> veya <code>durum=${PIPESTATUS[0]}</code> gerekir; standart hatanın da günlüğe girmesi için <code>2&gt;&amp;1</code> eklenir.</p>
</div>

!!! alistirma "Alıştırma: İlk açılış betiği"
    Ağ geçidinin her cihaza özgü bir kimlik dosyası (`/data/kimlik`) ilk açılışta oluşturulacaktır.
    Kimlik, ilk ağ arabiriminin MAC adresinden türetilir. Aşağıdakileri yazın:

    1. `ilk-acilis.sh` (POSIX sh): `/data/kimlik` varsa hiçbir şey yapmasın; yoksa
       `/sys/class/net/*/address` dosyalarından `lo` dışındaki ilkini okuyup iki noktaları kaldırarak
       `agecidi-<mac>` biçiminde kimliği **atomik olarak** yazsın. Arabirim bulunamazsa 1 ile çıksın.
    2. Bu betiği ilk açılışta çalıştıracak bir systemd birimi: dosya zaten varsa birim hiç
       başlatılmasın.
    3. Betiği ve birimi kuran bir tarif parçası. Kimliğin neden `pkg_postinst` içinde (imaj
       oluşturulurken) üretilemeyeceğini açıklayın.

    ??? success "Örnek çözüm"
        ```sh
        #!/bin/sh
        # ilk-acilis.sh: cihaza özgü kimlik dosyasını bir kez oluşturur
        set -eu
        hedef=${KIMLIK_DOSYASI:-/data/kimlik}
        [ -e "$hedef" ] && exit 0
        mac=
        for f in /sys/class/net/*/address; do
            [ -e "$f" ] || continue
            ad=${f%/address}; ad=${ad##*/}
            [ "$ad" = lo ] && continue
            mac=$(tr -d ':\n' < "$f")
            break
        done
        [ -n "$mac" ] || { echo "ilk-acilis: ağ arabirimi bulunamadı" >&2; exit 1; }
        gecici=$(mktemp "$hedef.XXXXXX")
        trap 'rm -f -- "$gecici"' EXIT
        printf 'agecidi-%s\n' "$mac" > "$gecici"
        chmod 0644 "$gecici"
        mv -- "$gecici" "$hedef"
        ```

        ```ini
        [Unit]
        Description=Cihaz kimliğinin ilk açılışta oluşturulması
        ConditionPathExists=!/data/kimlik
        After=local-fs.target

        [Service]
        Type=oneshot
        ExecStart=/usr/sbin/ilk-acilis

        [Install]
        WantedBy=multi-user.target
        ```

        ```bitbake
        inherit systemd
        SYSTEMD_SERVICE:${PN} = "ilk-acilis.service"
        do_install() {
            install -d ${D}${sbindir} ${D}${systemd_system_unitdir}
            install -m 0755 ${S}/ilk-acilis.sh ${D}${sbindir}/ilk-acilis
            install -m 0644 ${S}/ilk-acilis.service ${D}${systemd_system_unitdir}/
        }
        ```

        `pkg_postinst` imaj oluşturulurken derleme makinesinde çalışır: o anda cihazın MAC adresi
        bilinmez ve aynı imaj tüm cihazlara yazılacağından her cihaz aynı kimliği alırdı. Kimlik
        cihaza özgü olduğu için ilk açılışta, kalıcı veri bölümüne yazılmalıdır. `mv` atomik olduğundan
        ilk açılışta güç kesilse bile yarım bir kimlik dosyası oluşmaz; betik bir sonraki açılışta
        yeniden çalışır.

**Kitabın sonu.** Sözlük, komut özeti ve kaynakça için [Ekler](../ekler/sozluk.md) bölümüne bakılabilir.
