# 1 · Kabuk, terminal ve komutların yapısı

<div class="kunye" markdown>
<span>Süre: ~40 dk + uygulama</span><span>Düzey: Başlangıç</span><span>Ön koşul: Yok</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Terminal öykünücüsü, sözde terminal, satır disiplini, kabuk ve çekirdek arasındaki görev paylaşımını açıklayabilirsiniz.
    - Bir komut satırını ad, seçenek, argüman ve işleç bileşenlerine ayırabilirsiniz.
    - Bir adın takma ad, ayrılmış sözcük, fonksiyon, yerleşik veya dış komut olup olmadığını `type` ve `command -v` ile belirleyebilirsiniz.
    - PATH aramasını ve hash tablosunu, bunlardan kaynaklanan sık hatalarla birlikte açıklayabilirsiniz.
    - `man`, `help` ve `--help` kaynaklarını doğru yerde kullanabilir, geçmiş genişletmesi ve tamamlama ile verimli çalışabilirsiniz.
    - Yocto derleme ortamında ve hedef cihazda karşılaşılan kabuk türlerini ayırt edebilirsiniz.

## 1.1 Terminal, kabuk ve çekirdek

Komut satırında çalışırken ekranda tek bir pencere görünür; ancak bir tuşa basılmasıyla ekranda çıktı
oluşması arasında birbirinden bağımsız dört bileşen görev alır. Bu ayrımın bilinmesi, ileride
karşılaşılacak birçok davranışı açıklar: Ctrl-C'nin bir süreci nasıl durdurduğu, seri konsolda tam ekran
programların neden bozuk göründüğü, bir betiğin neden etkileşimli kabuktan farklı davrandığı.

| Bileşen | Görevi | Örnek |
|---|---|---|
| **Terminal öykünücüsü** | Tuşları bayta, gelen baytları ekrandaki karakterlere dönüştüren grafik program | GNOME Terminal, Windows Terminal, ssh istemcisi, `picocom` |
| **Terminal aygıtı (TTY)** | Çekirdekteki karakter aygıtı; iki uç arasında baytları taşır ve **satır disiplini** uygular | `/dev/pts/0` (sözde terminal), `/dev/ttyS0` (seri port), `/dev/tty1` (sanal konsol) |
| **Kabuk** | Komut satırını okuyan, yorumlayan ve programları başlatan sıradan bir kullanıcı programı | `bash`, `dash`, BusyBox `ash` |
| **Çekirdek** | Süreçleri oluşturan, dosyaları açan, sinyalleri ileten işletim sistemi çekirdeği | Linux |

Adlandırma tarihseldir: TTY, ilk Unix sistemlerinde bilgisayara seri hatla bağlanan **teletype**
(uzak yazıcı) makinelerinden gelir. Bugün fiziksel terminal yerine bir program kullanılır; bu programla
kabuk arasındaki bağlantıyı **sözde terminal** (*pseudo-terminal*, PTY) adlı aygıt çifti sağlar.
Öykünücü çiftin ana ucunu (*master*) tutar; kabuk ise yardımcı ucu (*slave*, `/dev/pts/N`) standart
girdi, standart çıktı ve standart hata olarak kullanır. `tty` komutu, o anda kullanılan terminal
aygıtının adını yazar.

İki uç arasındaki **satır disiplini** çekirdeğin bir parçasıdır ve üç önemli iş yapar:

1. **Satır düzenleme:** Kanonik kipte karakterleri Enter'a kadar biriktirir, silme tuşunu işler.
2. **Yankı:** Basılan karakteri ekranda görünsün diye geri yansıtır. Parola sorulurken bu özellik kapatılır.
3. **Sinyal üretimi:** Ctrl-C karakterini `SIGINT`, Ctrl-Z karakterini `SIGTSTP` sinyaline dönüştürüp
   ön plandaki süreç grubuna gönderir. Ctrl-C'yi kabuk değil, çekirdek işler.

Aşağıdaki animasyon, `ls` yazılıp Enter'a
basıldığında baytların katmanlar arasındaki yolunu ve Ctrl-C'nin bir sinyale dönüşmesini gösterir:

<div class="akis" data-senaryo="terminal-katmanlari"></div>

!!! sss "Seri konsolda satırlar neden kayıyor veya `vi` neden bozuk görünüyor?"
    Seri konsolda (ör. `picocom -b 115200 /dev/ttyUSB0`) öykünücü ile çekirdek arasında PTY yerine
    UART sürücüsü bulunur ve pencere boyutu bilgisi otomatik olarak iletilmez. Kabuk ve tam ekran
    programlar pencerenin 80×24 olduğunu varsayar. Hedef cihazda `stty rows 50 cols 160` ile boyut
    elle bildirilebilir; BusyBox derlemesine bağlı olarak `resize` komutu da bulunabilir. `TERM`
    değişkeninin öykünücüyü doğru tanımlaması (ör. `vt100`, `xterm`) renk ve imleç denetimi için gereklidir.

## 1.2 Kabuk türleri ve başlatma dosyaları

Kabuk çekirdeğin parçası değildir; `/bin` altındaki herhangi bir program gibi değiştirilebilir. Gömülü
Linux geliştiricisi gün içinde en az üç farklı kabukla karşılaşır:

| Kabuk | Nerede karşılaşılır | Özellik |
|---|---|---|
| **bash** | Geliştirme makinesi, CI, Yocto'nun `devshell` görevi | POSIX'i genişleten zengin dil: diziler, `[[ ]]`, süreç ikamesi |
| **dash** | Debian ve Ubuntu'da `/bin/sh` | Küçük ve hızlı, yalnızca POSIX özellikleri; BitBake kabuk görevleri bu makinelerde dash ile çalışır |
| **ash** (BusyBox) | Yocto ile üretilmiş çoğu küçük imajda `/bin/sh` | POSIX temelli; bazı bash eklentileri derleme seçeneğine bağlıdır (Bölüm 8) |

`/bin/sh` bir arayüzün adıdır: POSIX standardı, `sh` adıyla çağrılan kabuğun hangi dili anlaması
gerektiğini tanımlar. Bu adı hangi programın taşıdığı dağıtıma göre değişir; `readlink -f /bin/sh`
komutu bunu gösterir. Bu kitaptaki örnekler `#!/bin/bash` satırıyla başlıyorsa bash'e özgü özellikler
kullanır; `#!/bin/sh` satırıyla başlıyorsa POSIX sh ile sınırlıdır.

Bir kabuk **etkileşimli** (kullanıcıdan komut bekleyen) veya **etkileşimsiz** (betik çalıştıran),
ayrıca **oturum açma kabuğu** (*login shell*) olabilir veya olmayabilir. Okunan başlatma dosyaları bu iki
özelliğe göre değişir:

| Durum | bash'in okuduğu dosyalar |
|---|---|
| Oturum açma kabuğu (konsol, `ssh`, `bash -l`) | `/etc/profile`, ardından `~/.bash_profile`, `~/.bash_login`, `~/.profile` dosyalarından **bulunan ilki** |
| Etkileşimli, oturum açma kabuğu değil (yeni terminal sekmesi) | `~/.bashrc` (Debian/Ubuntu'da önce `/etc/bash.bashrc`) |
| Etkileşimsiz (betik) | Hiçbiri; yalnızca `BASH_ENV` değişkeni bir dosya gösteriyorsa o dosya |

BusyBox ash, oturum açma kabuğu olarak `/etc/profile` ve `~/.profile` dosyalarını okur. Bu nedenle hedef
cihaz için ortam değişkenleri ve istem ayarları genellikle `/etc/profile` veya `/etc/profile.d/*.sh`
üzerinden verilir; Yocto'da bu dosyalar `base-files` tarifinden gelir ve bir `.bbappend` ile
değiştirilebilir (bkz. <a href="../../yocto-gomulu-linux/bolumler/07-katmanlar.html">Yocto kitabı, Bölüm 7</a>).

!!! dikkat "Takma ad ve fonksiyonlar betiklere taşınmaz"
    `~/.bashrc` içine yazılan takma adlar yalnızca etkileşimli kabukta etkilidir. Bir betik çalışırken
    bu dosya okunmaz; okunsa bile etkileşimsiz bash takma adları varsayılan olarak genişletmez. Bir
    betiğin doğru çalışması, onu çalıştıran kişinin kişisel ayarlarına bağlı olmamalıdır.

## 1.3 Komut satırının yapısı

Kabuğun okuduğu her satır, boşluk ve işleçlerle ayrılmış **sözcüklerden** oluşur. Basit bir komutta
ilk sözcük komutun adı, diğerleri argümanlarıdır:

```text
ls  -l  -h  --sort=time  /var/log  /tmp
│   └──┬──┘ └────┬─────┘ └─────┬──────┘
ad   kısa      uzun        konumsal
     seçenekler seçenek    argümanlar
```

Seçenek kavramı kabuğa değil, **programın kendisine** aittir. Kabuk yalnızca sözcükleri ayırıp
programa bir dizi olarak verir (`argv`); `-l`'nin ne anlama geldiğine `ls` karar verir. Bununla birlikte
araçların büyük çoğunluğu ortak kurallara uyar:

- Kısa seçenekler tek tire ve tek harftir; birleştirilebilir: `ls -l -h` ile `ls -lh` aynıdır.
- Değer alan kısa seçenekte değer bitişik veya ayrı yazılabilir: `head -n 5`, `head -n5`.
- Uzun seçenekler (GNU geleneği) iki tireyle yazılır ve değeri `=` ile alabilir: `--sort=time`.
- `--` seçeneklerin bittiğini belirtir. Adı tireyle başlayan bir dosya ancak böyle güvenle verilir:
  `rm -- -yanlis-ad.txt`.
- Dosya adı yerine tek başına `-`, birçok araçta standart girdi veya çıktı anlamına gelir: `tar -cf - dizin | ...`.

BusyBox araçları uzun seçeneklerin çoğunu desteklemez veya yalnızca bir kısmını destekler. Hedef
cihazda çalışacak betiklerde kısa seçeneklerin tercih edilmesi taşınabilirliği artırır.

Bir satırda birden çok komut **işleçlerle** birleştirilebilir. Ayrıntıları sonraki bölümlerde ele
alınacak olan temel işleçler şunlardır:

| İşleç | Anlamı | Örnek |
|---|---|---|
| `;` veya satır sonu | Sırayla çalıştır | `cd /tmp; ls` |
| `&&` | Önceki başarılıysa (durum 0) çalıştır | `make && make install` |
| <code>&#124;&#124;</code> | Önceki başarısızsa çalıştır | <code>cd derleme &#124;&#124; exit 1</code> |
| <code>&#124;</code> | Soldakinin çıktısını sağdakinin girdisine bağla (Bölüm 4) | <code>dmesg &#124; grep i2c</code> |
| `&` | Arka planda çalıştır (Bölüm 4) | `sensor-oku 100 > olcum.txt &` |

Her komut bitince 0–255 arasında bir **çıkış durumu** bırakır ve bu değer `$?` ile okunur. Geleneksel
olarak 0 başarı, diğer değerler hata anlamına gelir. Kabuğun kendisinin ürettiği iki değer özellikle
önemlidir: **127** komutun bulunamadığını, **126** dosyanın bulunduğu ancak çalıştırılamadığını
(yürütme izni yok, yorumlayıcı yok) gösterir. Sinyalle sonlanan süreçlerin durumu ise 128'e sinyal
numarasının eklenmesiyle oluşur (Bölüm 4).

## 1.4 Komut türleri ve arama sırası

Komut satırının ilk sözcüğü her zaman diskteki bir programa karşılık gelmez. bash bir adı şu sırayla
çözer:

1. **Takma ad (alias):** Ayrıştırma sırasında metin olarak değiştirilir. `alias ll='ls -l'` tanımından
   sonra `ll /tmp` satırı `ls -l /tmp` olarak okunur.
2. **Ayrılmış sözcük (keyword):** `if`, `for`, `while`, `[[`, `{` gibi dilin kendi yapı taşları.
3. **Fonksiyon:** Kabuk belleğinde tanımlı komut grupları (Bölüm 6).
4. **Yerleşik (builtin):** Kabuğun kendi içinde gerçekleştirdiği komutlar: `cd`, `echo`, `read`, `export`, `type`.
5. **Dış komut:** Önce hash tablosuna, sonra PATH dizinlerine bakılarak bulunan çalıştırılabilir dosya.

Bazı komutların yerleşik olması bir tercih değil, zorunluluktur. `cd` ayrı bir program olsaydı yalnızca
kendi sürecinin çalışma dizinini değiştirebilir, süreç bitince bu değişiklik kaybolurdu. `export`,
`read` ve `exit` de kabuğun kendi durumunu değiştirdiği için yerleşiktir. `echo`, `printf`, `test` ve
`[` gibi komutlar ise hız için yerleşik yapılmıştır; aynı adla dış programları da bulunur. Yerleşikler
süreç oluşturmadığından döngülerde belirgin biçimde hızlıdır.

<div class="akis" data-senaryo="komut-arama"></div>

Bir adın hangi türe karşılık geldiği `type` yerleşiğiyle görülür. `type -a` tüm karşılıkları arama
sırasıyla, `type -t` yalnızca türü yazar. Betiklerde ise POSIX standardındaki `command -v` tercih edilir:

<div class="terminal" data-oturum="komut-turleri"></div>

`command ad` takma adları ve fonksiyonları atlayarak yerleşik veya dış komutu çalıştırır.

!!! iyi "`which` yerine `command -v`"
    `which` dış bir programdır; kabuğun takma adlarını, fonksiyonlarını ve yerleşiklerini bilmez ve
    davranışı dağıtımlar arasında farklıdır. Bir betikte bir aracın varlığını sınamak için doğru yöntem
    şudur:

    ```bash
    if ! command -v bitbake >/dev/null 2>&1; then
        echo "bitbake bulunamadı; önce derleme ortamı kaynaklanmalı" >&2
        exit 1
    fi
    ```

## 1.5 PATH araması ve hash tablosu

Adında eğik çizgi (`/`) bulunmayan bir dış komut için kabuk `PATH` değişkenindeki dizinleri soldan
sağa tarar ve **ilk** eşleşmede durur. Adında eğik çizgi varsa (`./betik.sh`, `/usr/bin/ls`,
`~/bin/sensor-oku`) arama yapılmaz, dosya doğrudan o yoldan çalıştırılır. Geçerli dizindeki bir
betiğin `./` önekiyle çalıştırılması gerekmesinin nedeni budur: geçerli dizin PATH'te değildir.

Her komutta tüm dizinlerin taranması pahalı olacağından bash, bulduğu yolu bir **hash tablosunda**
saklar. Tablo `hash` komutuyla görülür, `hash -r` ile boşaltılır; `PATH` değişkenine yeni bir değer
atanması da tabloyu boşaltır. Tablonun varlığı, dosya taşındığında şaşırtıcı bir hataya yol açabilir:
kabuk eski yolu denemeye devam eder.

<div class="terminal" data-oturum="path-arama"></div>

PATH sırası güvenlik açısından da önemlidir:

- `PATH` başına eklenen bir dizin, sistem komutlarını **gölgeler**. `~/bin/ls` adlı bir dosya, `ls`
  yazıldığında `/usr/bin/ls` yerine çalışır. Kişisel dizinler bilinçli bir tercih yapılmadıkça sona eklenmelidir.
- PATH içinde `.` (geçerli dizin) veya boş bir öğe (`::`, baştaki ya da sondaki `:`) bulunmamalıdır.
  Aksi halde başkasının yazabildiği bir dizinde bulunulduğunda oradaki `ls` adlı bir dosya çalışabilir.
- `sudo` genellikle güvenli bir PATH ile çalışır (`/etc/sudoers` içindeki `secure_path`); kullanıcının
  PATH ayarı root olarak çalıştırılan komutlara taşınmaz. "Kendi hesabımda çalışıyor, `sudo` ile
  bulunamıyor" sorununun en yaygın nedeni budur.

!!! info "Yocto'da PATH"
    Derleme ortamının kaynaklanması (`source .../init-build-env`) PATH başına `bitbake` ve `scripts`
    dizinlerini ekler. BitBake görevleri ise derleme makinesinin PATH'ini **kullanmaz**: görevler
    yalnızca tarifin sysroot dizinlerini ve `tmp/hosttools` altına bağlanmış izinli araçları görür
    (bkz. Bölüm 8). Derleme makinesinde kurulu bir aracın görev içinde "bulunamaması" bu kısıtlamanın
    sonucudur ve çözümü aracın `HOSTTOOLS` listesine değil, tarifin `DEPENDS` değişkenine ilgili
    `-native` tarifinin eklenmesidir.

## 1.6 Yardım kaynakları

Komut satırında bilgi almanın üç ana kaynağı vardır ve her birinin kapsamı farklıdır:

| Kaynak | Kapsam | Örnek |
|---|---|---|
| `help` | Yalnızca bash yerleşikleri ve anahtar sözcükleri | `help read`, `help -d cd` |
| `komut --help` | Programın kendi kısa kullanım özeti (GNU araçlarında standart) | <code>tar --help &#124; grep -- --exclude</code> |
| `man` | Kılavuz sayfaları; bölümlere ayrılmış ayrıntılı başvuru | `man 5 crontab`, `man -k compress` |
| `info` | GNU projelerinin ayrıntılı belgeleri (sed, gawk, coreutils) | `info sed` |

Kılavuz sayfaları numaralı bölümlere ayrılmıştır; aynı ad farklı bölümlerde farklı şeyleri anlatabilir.
`man passwd` komutu `passwd` programını (bölüm 1), `man 5 passwd` ise `/etc/passwd` dosyasının biçimini
açıklar.

| Bölüm | İçerik | Bölüm | İçerik |
|---|---|---|---|
| 1 | Kullanıcı komutları | 5 | Dosya biçimleri (`/etc/fstab`, `crontab`) |
| 2 | Sistem çağrıları (`open`, `fork`) | 7 | Kavramlar ve kurallar (`signal`, `regex`) |
| 3 | C kitaplığı fonksiyonları (`printf`) | 8 | Sistem yönetimi komutları (`mount`, `ip`) |
| 4 | Aygıt dosyaları (`tty`, `null`) | | |

`man -k sözcük` (eşdeğeri `apropos`) sayfa başlıklarında arama yapar. Kılavuz sayfası `less` ile
açılır: `/ifade` ile aranır, `n` ile sonraki eşleşmeye gidilir, `q` ile çıkılır.

!!! dikkat "Hedef cihazda kılavuz sayfası yoktur"
    Yer kazanmak için gömülü imajlara kılavuz sayfaları genellikle eklenmez. BusyBox komutlarında
    `komut --help` kısa bir kullanım özeti yazar ve bu özet derleme makinesindeki GNU sürümünden
    farklıdır. Hedefe yazılacak bir betik için seçenekler, derleme makinesinin `man` sayfasına göre değil,
    hedefteki aracın `--help` çıktısına göre doğrulanmalıdır. Yocto'da `doc-pkgs` imaj özelliği
    kurulu paketlerin belge paketlerini ekler; bu yalnızca geliştirme imajları için uygundur.

## 1.7 Geçmiş ve satır düzenleme

Etkileşimli bash, yazılan komutları bellekteki bir **geçmiş listesinde** tutar ve kabuk kapanırken
`~/.bash_history` dosyasına yazar. Geçmişten yararlanmanın iki yolu vardır: satır düzenleyicisinde
gezinme ve geçmiş genişletmesi.

**Satır düzenleme** GNU readline kitaplığı tarafından yapılır. Varsayılan tuşlar Emacs düzenleyicisinden
gelir; `set -o vi` ile vi kipine geçilebilir. Kalıcı ayarlar `~/.inputrc` dosyasında tutulur.

| Tuş | İşlev | Tuş | İşlev |
|---|---|---|---|
| ++ctrl+r++ | Geçmişte geriye doğru artımlı arama | ++ctrl+a++ / ++ctrl+e++ | Satır başı / sonu |
| ++arrow-up++ / ++arrow-down++ | Önceki / sonraki komut | ++alt+b++ / ++alt+f++ | Bir sözcük geri / ileri |
| ++ctrl+w++ | İmleçten önceki sözcüğü sil | ++ctrl+u++ | İmleçten satır başına kadar sil |
| ++alt+period++ | Önceki komutun son argümanını ekle | ++ctrl+l++ | Ekranı temizle |

**Geçmiş genişletmesi**, satır çalıştırılmadan önce `!` ile başlayan ifadeleri geçmişteki metinle
değiştirir. Kabuk, genişletilmiş satırı çalıştırmadan önce ekrana yazar; böylece hangi komutun
çalıştığı görülür.

| İfade | Anlamı |
|---|---|
| `!!` | Önceki komutun tamamı (ör. `sudo !!`) |
| `!$` | Önceki komutun son sözcüğü |
| `!n` / `!-n` | n numaralı komut / n komut önceki |
| `!dizgi` | `dizgi` ile başlayan son komut |
| `^eski^yeni` | Önceki komutta ilk `eski` geçişini `yeni` ile değiştirip çalıştır |

<div class="terminal" data-oturum="gecmis-yardim"></div>

Geçmişin davranışı birkaç değişkenle ayarlanır. `HISTCONTROL=ignoreboth`, boşlukla başlayan ve bir
öncekinin aynısı olan komutları kaydetmez; parola veya erişim belirteci içeren bir komutun başına boşluk
konarak geçmişe girmesi engellenebilir. `HISTSIZE` bellekteki, `HISTFILESIZE` dosyadaki satır sayısını,
`HISTTIMEFORMAT` her girdinin zaman damgası biçimini belirler. Birden çok terminal açıkken geçmişlerin
birbirinin üzerine yazılmaması için `shopt -s histappend` etkinleştirilir. Bu ayarların toplu bir örneği
`examples/01-kabuk/bashrc-ekleri.sh` dosyasındadır.

!!! dikkat "Geçmiş genişletmesi ve `!` karakteri"
    Etkileşimli kabukta çift tırnak içindeki `!` de genişletilir: `echo "Merhaba!x"` beklenmedik
    bir "event not found" hatası verebilir. Tek tırnak kullanılması (`echo 'Merhaba!x'`) veya
    `set +H` ile özelliğin kapatılması sorunu giderir. Betiklerde geçmiş genişletmesi zaten kapalıdır.

## 1.8 Tamamlama

++tab++ tuşu, yazılmakta olan sözcüğü tamamlar; birden çok aday varsa ikinci basışta adayları listeler.
İlk sözcükte komut adları (takma adlar, fonksiyonlar, yerleşikler ve PATH'teki programlar), diğer
sözcüklerde dosya adları tamamlanır.

bash'in **programlanabilir tamamlama** özelliği, her komut için ayrı tamamlama kuralı tanımlanmasına izin
verir. `bash-completion` paketi `git`, `systemctl`, `ssh` gibi yaygın araçlar için hazır kurallar sunar:
`git checkout <Tab>` dal adlarını, `systemctl restart <Tab>` servis adlarını listeler. Kurallar
`complete` yerleşiğiyle tanımlanır; tamamlamanın aday üretmek için kullandığı `compgen` yerleşiği doğrudan
da çağrılabilir:

```bash
compgen -c sensor      # "sensor" ile başlayan komut adları
compgen -A function    # tanımlı fonksiyonlar
compgen -k             # ayrılmış sözcükler
complete -W "start stop restart reload status" sensor-izle-ctl   # basit sözcük listesi kuralı
```

BusyBox ash'in satır düzenleyicisi temel düzenleme, geçmiş ve dosya adı tamamlamayı destekler (derleme
seçeneklerine bağlıdır); programlanabilir tamamlama yoktur.

## 1.9 Yocto bağlamında kabuk

Yocto ile çalışırken kabuk üç farklı rolde karşınıza çıkar:

- **Derleme makinesinde etkileşimli kabuk.** `bitbake`, `devtool` ve `bitbake-layers` komutları,
  ortam betiği **kaynaklandıktan** sonra kullanılabilir. Kaynaklama (`source` veya `.`), betiği yeni bir
  süreçte değil mevcut kabukta çalıştırır; böylece betiğin yaptığı `cd` ve PATH değişikliği kalıcı olur.
  Ortam betiğinin çalıştırılması (`./init-build-env`) hiçbir kalıcı etki bırakmaz (Bölüm 5).
- **BitBake görevlerinin kabuğu.** Tariflerdeki `do_install` gibi kabuk fonksiyonları derleme
  makinesinin `/bin/sh` kabuğuyla çalışır. `bitbake -c devshell <tarif>` komutu ise tarifin derleme
  ortamı yüklenmiş etkileşimli bir kabuk açar; görev komutlarını elle denemek için kullanılır
  (bkz. <a href="../../yocto-gomulu-linux/bolumler/14-hata-ayiklama.html">Yocto kitabı, Bölüm 14</a>).
- **Hedef cihazın kabuğu.** Seri konsol veya SSH ile bağlanılan cihazda genellikle BusyBox ash
  çalışır; istem `kullanici@agecidi:~$` biçimindedir. Derleme makinesinde rahatça kullanılan bash
  özellikleri ve GNU seçenekleri burada bulunmayabilir.

!!! lab "Uygulama 1.1 · Komut çözümlemesinin incelenmesi"
    1. Aşağıdaki komutların her biri için türü belirleyin ve sonucu açıklayın:

        ```bash
        type -a printf test [ time kill
        command -v printf ls cd
        ```

        `time` için bash'te ayrılmış bir sözcük bulunduğunu gözlemleyin. Sistemde `/usr/bin/time`
        kuruluysa `time ls` ile `command time ls` çıktılarını karşılaştırın.

    2. Kitap deposundaki `examples/01-kabuk/sensor-oku` betiğini kişisel bir dizine kurun ve PATH'e ekleyin:

        ```bash
        mkdir -p ~/bin
        install -m 0755 examples/01-kabuk/sensor-oku ~/bin/
        PATH="$PATH:$HOME/bin"
        sensor-oku 3; echo "durum: $?"
        sensor-oku 0; echo "durum: $?"
        ```

        İkinci çağrının neden 1 döndürdüğünü betiğin kaynak kodundan bulun.

    3. Aynı adla bir fonksiyon tanımlayıp `type -a sensor-oku` çıktısını inceleyin. Fonksiyonu atlayıp
       dosyayı çalıştırmak için `command sensor-oku 2` kullanın, ardından `unset -f sensor-oku` ile
       fonksiyonu kaldırın.

    4. `examples/01-kabuk/bashrc-ekleri.sh` dosyasını okuyun; uygun bulduğunuz satırları `~/.bashrc`
       sonuna ekleyip yeni bir terminalde `shopt histappend` ve `echo "$HISTCONTROL"` ile doğrulayın.

## Özet

- Terminal öykünücüsü, sözde terminal ve satır disiplini (çekirdek) ile kabuk ayrı bileşenlerdir; Ctrl-C'yi sinyale çekirdek dönüştürür.
- `/bin/sh` bir arayüz adıdır: Ubuntu'da dash, çoğu Yocto imajında BusyBox ash'tir. Betiğin ilk satırı hangi dilin kullanılabileceğini belirler.
- Seçenekler programa aittir; `--` seçeneklerin sonunu bildirir. Çıkış durumu 0 başarı, 126 çalıştırılamadı, 127 bulunamadı demektir.
- bash bir adı takma ad → ayrılmış sözcük → fonksiyon → yerleşik → dış komut sırasıyla çözer; `type -a` ve `command -v` bunu gösterir.
- PATH soldan sağa taranır ve sonuç hash tablosunda saklanır; dosya taşındığında `hash -r` gerekir. PATH'te `.` bulunmamalıdır.
- `help` yerleşikler, `--help` kısa kullanım, `man` ayrıntılı başvuru içindir; hedef cihazda BusyBox'ın `--help` çıktısı esas alınır.
- Geçmiş genişletmesi (`!!`, `!$`), Ctrl-R ve tamamlama etkileşimli çalışmayı hızlandırır; betiklerde etkili değildir.

## Değerlendirme soruları

<div class="quiz" data-id="b01-1">
<p class="quiz-soru">Bir terminalde uzun süren bir komut çalışırken Ctrl-C'ye basıldığında süreci sonlandıran <code>SIGINT</code> sinyalini kim üretir?</p>
<ul>
<li>Terminal öykünücüsü programı</li>
<li>bash, tuşu okuyup <code>kill</code> çağrısı yapar</li>
<li data-dogru>Çekirdekteki satır disiplini, ön plan süreç grubuna gönderir</li>
<li>Çalışan programın kendisi, girdisinde 0x03 baytını görünce</li>
</ul>
<p class="quiz-aciklama">Ctrl-C, terminal aygıtına bir bayt olarak ulaşır. Satır disiplini bu karakteri tanır ve terminalin ön plan süreç grubuna SIGINT gönderir. Kabuk bu sırada çoğu zaman <code>wait</code> içinde beklemektedir.</p>
</div>

<div class="quiz" data-id="b01-2">
<p class="quiz-soru"><code>cd</code> komutunun ayrı bir program olarak değil, kabuk yerleşiği olarak gerçekleştirilmesinin nedeni nedir?</p>
<ul>
<li>Daha hızlı çalışması için; işlev açısından fark yoktur</li>
<li data-dogru>Ayrı bir süreç yalnızca kendi çalışma dizinini değiştirebilir; değişiklik kabuğa yansımaz</li>
<li>POSIX dış komutların dizin değiştirmesini yasaklar</li>
<li><code>cd</code> çekirdek içinde çalıştığı için</li>
</ul>
<p class="quiz-aciklama">Çalışma dizini süreç başına tutulan bir özelliktir. Kabuğun dizinini değiştirebilecek tek kod kabuğun kendi sürecinde çalışan koddur; bu nedenle <code>cd</code>, <code>export</code>, <code>read</code> gibi kabuk durumunu değiştiren komutlar yerleşiktir.</p>
</div>

<div class="quiz" data-id="b01-3">
<p class="quiz-soru"><code>~/bin/araç</code> dosyası <code>~/.local/bin/araç</code> konumuna taşındı ve PATH değişkenine dokunulmadan (<code>~/.local/bin</code> zaten PATH'te) <code>araç</code> yazıldı. "No such file or directory" hatasının en olası nedeni nedir?</p>
<ul>
<li>Dosyanın yürütme izni taşıma sırasında kayboldu</li>
<li data-dogru>bash, hash tablosundaki eski yolu kullanmaya devam ediyor; <code>hash -r</code> gerekir</li>
<li>PATH yalnızca oturum açılırken okunur</li>
<li><code>mv</code> sembolik bağlantı oluşturdu</li>
</ul>
<p class="quiz-aciklama">bash bulunan yolları hash tablosunda saklar ve varsayılan olarak bu yolun hâlâ var olup olmadığını denetlemez. <code>hash -r</code> tabloyu boşaltır; PATH'e değer atanması da aynı etkiyi yapar.</p>
</div>

<div class="quiz" data-id="b01-4">
<p class="quiz-soru">Bir betikte <code>bitbake</code> komutunun kullanılabilir olup olmadığını sınamak için en uygun yöntem hangisidir?</p>
<ul>
<li><code>which bitbake</code> çıktısının boş olup olmadığına bakmak</li>
<li><code>ls /usr/bin/bitbake</code></li>
<li data-dogru><code>command -v bitbake &gt;/dev/null 2&gt;&amp;1</code> komutunun çıkış durumunu sınamak</li>
<li><code>type bitbake</code> çıktısını grep ile aramak</li>
</ul>
<p class="quiz-aciklama"><code>command -v</code> POSIX'tir, kabuğun kendi arama kurallarını kullanır ve bulunamayan ad için sıfır dışı durum döndürür. <code>which</code> dış bir programdır ve davranışı dağıtıma göre değişir; <code>bitbake</code> ise <code>/usr/bin</code> altında değil, BitBake deposunun <code>bin</code> dizinindedir.</p>
</div>

<div class="quiz" data-id="b01-5">
<p class="quiz-soru"><code>man passwd</code> ile <code>man 5 passwd</code> komutlarının farkı nedir?</p>
<ul>
<li>İkincisi sayfanın beşinci sürümünü gösterir</li>
<li data-dogru>İlki <code>passwd</code> programını (bölüm 1), ikincisi <code>/etc/passwd</code> dosyasının biçimini (bölüm 5) anlatır</li>
<li>İkincisi yalnızca root kullanıcısına açıktır</li>
<li>Fark yoktur; numara yok sayılır</li>
</ul>
<p class="quiz-aciklama">Kılavuz sayfaları numaralı bölümlere ayrılır: 1 kullanıcı komutları, 5 dosya biçimleri, 8 yönetim komutları. Numara verilmezse ilk bulunan bölüm gösterilir.</p>
</div>

!!! alistirma "Alıştırma: Kişisel araç dizini ve güvenli PATH"
    Geliştirme makinenizde aşağıdaki koşulları sağlayan bir düzen kurun ve doğrulayın:

    1. `~/bin` dizini PATH'te yer almalı, ancak sistem komutlarını gölgelememelidir.
    2. `~/.bashrc` birden çok kez kaynaklansa bile PATH'e aynı dizin ikinci kez eklenmemelidir.
    3. `~/bin` içine `ls` adlı bir betik konduğunda `ls` yazılınca sistemdeki `ls` çalışmaya devam etmelidir.
    4. Bir komutun geçmişe kaydedilmeden çalıştırılabilmesi sağlanmalıdır.

    ??? success "Örnek çözüm"
        ```bash
        # ~/.bashrc sonuna:
        case ":$PATH:" in
            *":$HOME/bin:"*) ;;                 # zaten var: ekleme
            *) PATH="$PATH:$HOME/bin" ;;        # sona ekle: sistem komutları önce bulunur
        esac
        HISTCONTROL=ignoreboth                  # boşlukla başlayan komutlar kaydedilmez
        ```

        Doğrulama:

        ```bash
        . ~/.bashrc; . ~/.bashrc
        echo "$PATH" | tr ':' '\n' | grep -c "^$HOME/bin$"    # 1 olmalı
        printf '#!/bin/sh\necho sahte ls\n' > ~/bin/ls; chmod +x ~/bin/ls
        type -a ls                                             # önce /usr/bin/ls görünmeli
        rm ~/bin/ls
         echo "bu satır geçmişe girmez"                        # baştaki boşluğa dikkat
        history 2
        ```

        `":$PATH:"` kalıbı, iki nokta üst üsteyle sınırlandırılmış tam dizin adını arar; böylece
        `/home/kullanici/bin2` gibi benzer adlar yanlışlıkla eşleşmez.

**Sonraki bölüm:** [2 · Dosya sistemi, izinler ve kullanıcılar →](02-dosya-sistemi-izinler.md)
