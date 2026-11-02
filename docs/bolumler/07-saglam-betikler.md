# 7 · Sağlam betikler: hata yönetimi, trap, getopts, ShellCheck

<div class="kunye" markdown>
<span>Süre: ~60 dk + uygulama</span><span>Düzey: Orta–İleri</span><span>Ön koşul: Bölüm 4–6</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - `set -e`, `set -u` ve `set -o pipefail` seçeneklerinin tam anlamını ve `set -e`'nin devre dışı kaldığı durumları açıklayabilirsiniz.
    - `trap` ile EXIT, ERR ve sinyal işleyicileri yazabilir; çıkış durumunu koruyarak temizlik yapabilirsiniz.
    - Geçici dosya ve dizinleri `mktemp` ile güvenle oluşturabilirsiniz.
    - Seçenekleri `getopts` ile ayrıştırıp tutarlı kullanım iletileri ve çıkış durumları üretebilirsiniz.
    - Kilit dosyası ve atomik yeniden adlandırma ile eşzamanlı çalışmaya dayanıklı betikler yazabilirsiniz.
    - ShellCheck uyarılarını yorumlayabilir; POSIX sh ile bash arasındaki farkları gözeterek taşınabilir betik yazabilirsiniz.

## 7.1 Sessiz hata sorunu

Kabuk, varsayılan olarak bir komut başarısız olduğunda **durmaz**; bir sonraki satıra geçer. Etkileşimli
kullanımda bu doğaldır, çünkü hatayı kullanıcı görür. Bir betikte ise bu davranış hatanın sessizce
büyümesine yol açar:

```bash
#!/bin/bash
cd $YEDEK_DIZINI        # değişken tanımsız → cd ev dizinine gider (veya dizin yoksa başarısız olur)
rm -rf *                # ... ve bu satır yanlış dizinde çalışır
```

Bu iki satırlık betik üç ayrı hatayı birlikte barındırır: tanımsız değişken denetlenmemiştir,
`cd`'nin başarısı sınanmamıştır, değişken tırnaklanmamıştır. Sağlam betik yazmanın amacı, her
komutun sonucunu bilinçli olarak ele almak ve beklenmeyen her durumda **erken ve görünür biçimde
durmaktır**. Bu bölümdeki araçlar bu amaca hizmet eder; hiçbiri tek başına yeterli değildir.

Bölümün örnekleri `examples/07-saglam-betikler/` dizinindedir. `saglam-sablon.sh` yeni betikler için
bir başlangıç şablonu, `yedekle.sh` bu şablonun ilkelerini kullanan gerçek bir araçtır.

## 7.2 set -e: hata olunca dur

`set -e` (`errexit`), basit bir komut sıfırdan farklı durumla bittiğinde kabuğun sonlanmasını sağlar.
Ancak kural, hataların bilinçli olarak sınandığı bağlamları bozmamak için çok sayıda istisna içerir.
Bu istisnalar `set -e`'nin en sık yanlış anlaşılan yönüdür:

| Bağlam | set -e uygulanır mı? |
|---|---|
| `if`, `elif`, `while`, `until` koşulundaki komutlar | Hayır |
| `&&` ve <code>&#124;&#124;</code> listelerinde **son öğe dışındaki** komutlar | Hayır |
| `!` ile tersine çevrilen komut | Hayır |
| Koşul bağlamında çağrılan fonksiyonun **tüm gövdesi** | Hayır (gövde içinde de askıya alınır) |
| Boru hattında son komut dışındakiler | Hayır (`pipefail` olmadan) |
| `local x=$(komut)`, `export x=$(komut)` | Hayır: durum `local`/`export` komutunundur |
| `x=$(komut)` (yalnız atama) | Evet: atamanın durumu komut ikamesinin durumudur |
| Komut ikamesinin **içi** | bash'te varsayılan olarak hayır; `shopt -s inherit_errexit` (bash 4.4+) ile evet |
| `(( ifade ))` sonucu 0 olduğunda | Evet: durum 1'dir; `(( n++ ))` n=0 iken betiği durdurur |

<div class="terminal" data-oturum="set-e-tuzaklari"></div>

Tablodaki dördüncü satır özellikle tehlikelidir: bir fonksiyonun içinde `set -e`'ye güvenilerek
yazılmış kod, aynı fonksiyon `if dogrula; then` biçiminde çağrıldığında hata denetimsiz çalışır.
Bu nedenle `set -e` bir güvenlik ağı olarak görülmeli, kritik adımlar ise açıkça denetlenmelidir:
`cd -- "$hedef" || exit 1`, `mkdir -p -- "$dizin" || { echo "..." >&2; exit 1; }`. Bir komutun
başarısızlığı beklenen bir durumsa bu da açıkça belirtilir: `grep -q desen dosya || true`.

## 7.3 set -u ve pipefail

`set -u` (`nounset`) tanımsız bir değişkene başvuruyu hata sayar ve etkileşimsiz kabuğu sonlandırır.
Yazım hatalarını (`$DIZIIN`) ve unutulmuş argümanları yakalar. İsteğe bağlı değişkenler için varsayılan
değerli genişletme kullanılır: `"${HATA_AYIKLA:-0}"`, `"${1:-}"`. bash 4.4'ten önceki sürümlerde boş bir
dizinin `"${dizi[@]}"` biçiminde genişletilmesi de `set -u` altında hata veriyordu; güncel sürümlerde
bu sorun yoktur.

`set -o pipefail` boru hattının durumunu, sıfırdan farklı durumla biten en sağdaki komutun durumu
yapar. Olmadan `curl … | tar -xz` hattında indirme başarısız olsa da hattın durumu `tar`'ınkidir.
pipefail'in de bir tuzağı vardır: okuyucusu erken çıkan bir hatta yazan komut SIGPIPE ile 141 durumunda
sonlanır. `komut | head -n 1` hattı, `komut`'un çıktısı borunun tamponuna sığmayacak kadar büyükse
pipefail altında **başarısız** sayılır; küçük çıktılarda ise başarılıdır. Bu belirsizlik testlerde
görülmeyip üretimde ortaya çıkabilir. Böyle hatlarda ya `head` yerine aracın kendi sınırı kullanılır
(`grep -m 1`), ya da hat bilinçli olarak `|| true` ile işaretlenir.

Bu üç seçenek genellikle birlikte, betiğin başında verilir:

```bash
#!/bin/bash
set -Eeuo pipefail          # -E: ERR tuzağı fonksiyonlara ve alt kabuklara geçer
shopt -s inherit_errexit    # bash 4.4+: komut ikameleri de errexit'i devralır
```

POSIX sh'de `set -eu` kullanılabilir. `pipefail` 2024 tarihli POSIX sürümüne eklenmiştir; ancak
Ubuntu 24.04'teki dash 0.5.12 bu seçeneği desteklemez. BusyBox ash ise destekler (Bölüm 8).

## 7.4 trap: çıkışta ve hatada çalışan kod

`trap 'komutlar' OLAY…` bir olay gerçekleştiğinde çalışacak kodu kaydeder. Olaylar sinyal adları
(`INT`, `TERM`, `HUP`) veya kabuğun sözde olaylarıdır:

| Olay | Ne zaman çalışır | Not |
|---|---|---|
| `EXIT` (veya `0`) | Kabuk sonlanırken: normal bitiş, `exit`, `set -e` | Temizlik için temel yer |
| `ERR` | `set -e`'nin devreye gireceği her başarısız komuttan sonra | bash; dash ve POSIX sh'de yoktur |
| `INT`, `TERM`, `HUP` | İlgili sinyal geldiğinde | `KILL` ve `STOP` yakalanamaz |
| `DEBUG`, `RETURN` | Her komuttan önce / fonksiyon dönüşünde | bash; hata ayıklama ve izleme için |

`trap - OLAY` işleyiciyi kaldırır, `trap '' OLAY` olayı (sinyali) yok sayar, `trap -p` kayıtlı
işleyicileri listeler. İşleyici tek tırnak içinde yazılır; böylece içindeki değişkenler kayıt anında
değil, **çalışma anında** genişletilir.

Sağlam bir temizlik işleyicisi üç kurala uyar:

1. **Çıkış durumunu bozmaz.** EXIT işleyicisi `exit` çağırmazsa veya argümansız çağırırsa kabuk
   özgün durumla çıkar (POSIX kuralı; bash, dash ve ash aynı davranır). Ancak işleyicinin sonuna
   `exit $?` veya `exit 0` yazılırsa durum, son temizlik komutunun durumuyla değişir ve betiğin hatası
   gizlenir. Durumun işleyici içinde kullanılması gerekiyorsa (günlüğe yazmak gibi) ilk satırda
   saklanır: `local durum=$?`, sonunda `exit "$durum"`.
2. **Yarım kalmış işi tanır.** Silinecek geçici dosyanın adı boşsa (`mktemp` henüz çalışmamışsa)
   hiçbir şey silinmez: `[[ -n $gecici ]] && rm -rf -- "$gecici"`.
3. **Sinyalleri de kapsar.** bash, SIGTERM ve SIGINT ile sonlanırken EXIT tuzağını çalıştırır; dash ve
   BusyBox ash çalıştırmaz. Taşınabilir betiklerde sinyaller normal bir çıkışa dönüştürülür:
   `trap 'exit 130' INT; trap 'exit 143' TERM`.

<div class="akis" data-senaryo="trap-exit-akisi"></div>

<div class="terminal" data-oturum="trap-temizlik"></div>

## 7.5 Geçici dosyalar: mktemp

`/tmp/betik.$$` gibi tahmin edilebilir adlar iki soruna yol açar: aynı betiğin iki örneği çakışabilir
ve `/tmp` herkesin yazabildiği bir dizin olduğundan başka bir kullanıcı aynı adla önceden bir sembolik
bağlantı oluşturarak betiğin istenmeyen bir dosyanın üzerine yazmasına neden olabilir. `mktemp` bu
sorunları çözer:

| Komut | Sonuç |
|---|---|
| `mktemp` | `$TMPDIR` (yoksa `/tmp`) altında 600 izinli, benzersiz adlı boş bir dosya |
| `mktemp -d` | 700 izinli, benzersiz adlı bir dizin |
| `mktemp "$hedef/.yedek.XXXXXX"` | Belirtilen dizinde; `X`'ler rastgele karakterlerle değiştirilir |

Geçici dosyanın **sonucun yazılacağı dizinde** oluşturulması, işin sonunda `mv` ile atomik olarak yerine
konabilmesini sağlar (aynı dosya sistemi, Bölüm 2). Böylece yarım yazılmış bir dosya hiçbir zaman asıl
adla görünmez; güç kesilse bile eski dosya bozulmaz. Bu yöntem, gömülü cihazlarda yapılandırma
dosyalarının güncellenmesinde özellikle önemlidir:

```sh
gecici=$(mktemp /etc/sensor.conf.XXXXXX) || exit 1
trap 'rm -f -- "$gecici"' EXIT
yeni_ayarlari_yaz > "$gecici"
chmod 0644 "$gecici"
sync "$gecici" 2>/dev/null || sync     # verinin flash belleğe yazılması (coreutils 8.24+ dosya alır)
mv -- "$gecici" /etc/sensor.conf
```

## 7.6 Seçenek ayrıştırma: getopts

`getopts` POSIX'te tanımlı bir yerleşiktir ve kısa seçenekleri (`-v`, `-o dizin`, `-vo dizin`)
ayrıştırır. Seçenek dizgisindeki her harf bir seçeneği, harften sonraki `:` değer beklendiğini
gösterir. Dizginin başındaki `:` **sessiz kipi** açar: getopts kendi hata iletisini yazmaz, bunun
yerine bilinmeyen seçenekte `?` ve değeri eksik seçenekte `:` döndürür ve seçenek harfini `OPTARG`'a
koyar.

```bash
while getopts ':vo:h' secenek; do
    case $secenek in
        v) ayrintili=1 ;;
        o) cikti=$OPTARG ;;
        h) kullanim; exit 0 ;;
        :) olumcul "-$OPTARG seçeneği bir değer gerektirir" ;;
        ?) olumcul "bilinmeyen seçenek: -$OPTARG" ;;
    esac
done
shift $((OPTIND - 1))       # kalan konumsal argümanlar: "$@"
```

getopts uzun seçenekleri (`--cikti=dizin`) desteklemez. Uzun seçenek gerekiyorsa util-linux'un `getopt`
programı veya elle yazılmış bir `while [ $# -gt 0 ]; do case $1 in …` döngüsü kullanılır; `getopt`'un
BusyBox sürümü bulunsa da davranış farklılıkları nedeniyle hedefte dikkatle sınanmalıdır.

Kullanıcıya dönük betiklerde çıkış durumları için yaygın bir gelenek izlenir: **0** başarı, **1** genel
hata, **2** yanlış kullanım (eksik veya geçersiz argüman). Kullanım iletisi ve hata iletileri standart
hataya, `-h` ile istenen yardım ise standart çıktıya yazılır.

## 7.7 Eşzamanlılık: kilit dosyaları

Zamanlanmış görevler (cron, systemd zamanlayıcıları) ve udev kuralları aynı betiği üst üste
çalıştırabilir. İki yedekleme işleminin aynı anda çalışması bozuk arşivler, iki güncelleme betiğinin
aynı anda çalışması bozuk bir sistem üretebilir. Çözüm, işin yalnızca bir örneğinin çalışmasını
sağlayan bir **kilittir**.

En sağlam yöntem, çekirdeğin dosya kilitlerini kullanan `flock` aracıdır (util-linux; BusyBox'ta
yapılandırmaya bağlı bir applet olarak da bulunabilir). Kilit bir açık dosya tanımlayıcısına bağlıdır:
süreç hangi nedenle sonlanırsa sonlansın, kill -9 dahil, çekirdek tanımlayıcıyı kapatır ve kilit
kendiliğinden kalkar. PID dosyası veya "kilit dosyası var mı?" denetimine dayalı yöntemler ise çöken
bir süreçten geriye "bayat" kilit bırakır ve iki sürecin dosyayı aynı anda sınadığı bir yarış durumuna
açıktır.

<div class="akis" data-senaryo="flock-kilit"></div>

`flock` bulunmayan ortamlarda `mkdir` atomik olduğu için bir kilit olarak kullanılabilir:
`mkdir /run/sensor-yedek.kilit 2>/dev/null || { echo "çalışıyor" >&2; exit 1; }` ve EXIT tuzağında
`rmdir`. Bu yöntem kill -9 sonrasında bayat kilit bırakır; açılışta temizlenen `/run` altında
tutulması bu riski azaltır.

<div class="terminal" data-oturum="getopts-kilit"></div>

## 7.8 ShellCheck

**ShellCheck**, kabuk betiklerini çalıştırmadan inceleyen bir statik çözümleme aracıdır. Tırnaksız
değişkenler, yanlış sınama sözdizimi, `cd` başarısızlığının denetlenmemesi, kullanılmayan değişkenler,
seçilen kabukta bulunmayan özellikler gibi yüzlerce hatayı tanır ve her uyarı için açıklamalı bir
viki sayfasına (`https://www.shellcheck.net/wiki/SC2086` gibi) yönlendirir. Debian/Ubuntu'da
`apt install shellcheck`, Python ortamında `pip install shellcheck-py` ile kurulabilir; çoğu
düzenleyicinin eklentisi vardır.

| Kod | Uyarı | Düzeltme |
|---|---|---|
| SC2086 | Tırnaksız değişken; sözcük bölme ve glob | `"$degisken"` |
| SC2046 | Tırnaksız komut ikamesi | `"$(komut)"` veya diziye okuma |
| SC2164 | `cd` başarısız olursa devam edilir | <code>cd -- "$d" &#124;&#124; exit</code> |
| SC2155 | `local x=$(…)` durumu maskeler | `local x; x=$(…)` |
| SC2045 / SC2012 | `ls` çıktısı üzerinde döngü veya ayrıştırma | Glob veya `find -print0` |
| SC2181 | `if [ $? -eq 0 ]` | `if komut; then` |
| SC2034 | Atanan ama kullanılmayan değişken | Yazım hatası mı? Kullanılmıyorsa sil |
| SC2016 | Tek tırnak içinde `$` genişlemez | Bilinçliyse yönerge ile sustur |
| SC3xxx | POSIX sh'de tanımsız özellik (bashism) | POSIX karşılığı veya `#!/bin/bash` |

ShellCheck betiğin dilini shebang satırından anlar; `-s sh|bash|dash|ksh` ile açıkça da verilebilir.
Bilinçli bir kullanım, ilgili satırın üstüne yazılan bir yönergeyle susturulur ve nedeni yorumda
belirtilir: `# shellcheck disable=SC2086  # seçenek listesi bilerek bölünüyor`. `-f gcc` biçimi her
uyarıyı tek satırda verir; `-S warning` yalnızca uyarı ve hata düzeyindeki iletileri gösterir. Kaynak
deposundaki tüm betiklerin CI'da ShellCheck'ten geçirilmesi, bu bölümdeki hataların çoğunu kod
incelemesinden önce yakalar:

```bash
git ls-files -z '*.sh' | xargs -0 -r shellcheck -f gcc
```

## 7.9 POSIX sh ve taşınabilirlik

Hedef cihazda çalışacak betikler, BitBake kabuk görevleri ve Debian/Ubuntu'da `/bin/sh` ile çalışan
her şey POSIX sh ile sınırlıdır. bash'e özgü bir yapının `#!/bin/sh` betiğinde kullanılması
(**bashism**) geliştiricinin bash kuran makinesinde fark edilmez, dash veya ash ile çalışan ortamda
ise ya sözdizimi hatası verir ya da sessizce farklı davranır.

| bash | POSIX sh karşılığı |
|---|---|
| `[[ $a == b* ]]` | `case $a in b*) … ;; esac` |
| `[[ $a =~ ^[0-9]+$ ]]` | <code>case $a in ''&#124;*[!0-9]*) değil ;; *) sayı ;; esac</code> |
| Diziler `a=(x y)`, `"${a[@]}"` | `set -- x y`, `"$@"` (tek liste) |
| `{1..5}`, `for ((i=0; …))` | `i=1; while [ "$i" -le 5 ]; do …; i=$((i + 1)); done` |
| `echo -e "a\tb"` | `printf 'a\tb\n'` |
| `$'\t'` | `"$(printf '\t')"` |
| `${x//a/b}`, `${x:1:2}`, `${x^^}` | `sed`, `cut`, `tr` veya `case` |
| `<(komut)`, `<<< metin` | Geçici dosya, boru veya here-doc |
| `function ad { … }` | `ad() { … }` |
| `source dosya` | `. dosya` |
| `&> dosya` | `> dosya 2>&1` |

`echo`'nun davranışı kabuklar arasında en çok farklılık gösteren yerleşiktir: dash'in `echo`'su `-e`
seçeneğini tanımaz ve ters eğik çizgi kaçışlarını her zaman yorumlar; bash'inki varsayılan olarak
yorumlamaz. Değişken içeriği veya kaçış karakteri yazdırılacaksa her zaman `printf` kullanılmalıdır:
`printf '%s\n' "$x"`. Bir betiğin POSIX uyumluluğu, `#!/bin/sh` satırıyla ShellCheck'ten geçirilip
dash ile çalıştırılarak sınanır; Debian'ın `devscripts` paketindeki `checkbashisms` aracı da aynı
amaçla kullanılabilir.

<div class="terminal" data-oturum="shellcheck-posix"></div>

!!! iyi "bash mi, POSIX sh mi?"
    Seçim betiğin çalışacağı yere göre yapılır. Geliştirme makinesinde ve CI'da çalışan, dizilere ve
    `[[ ]]`'ye gerçekten ihtiyaç duyan araçlar `#!/bin/bash` ile yazılabilir; bash her yerde
    bulunur. Hedef cihazda çalışan betikler, init betikleri, kurulum sonrası betikleri ve BitBake
    görevleri POSIX sh ile yazılmalıdır. İki durumda da shebang, betiğin gerçekten kullandığı dili
    göstermelidir.

!!! lab "Uygulama 7.1 · Hatalı bir betiğin sağlamlaştırılması"
    `examples/07-saglam-betikler/hatali-betik.sh` kasıtlı olarak hatalı yazılmıştır.

    1. `shellcheck hatali-betik.sh` çıktısındaki her uyarıyı viki sayfasındaki açıklamayla eşleştirin.
    2. Betiği kendi düzeltmenizle yeniden yazın; `set -euo pipefail` ekleyin, ancak `set -e`'nin
       tek başına yetmediği yerleri (`cd`, `grep`) açıkça denetleyin. Sonucu `duzeltilmis-betik.sh`
       ile karşılaştırın.
    3. Düzeltilmiş betiği `#!/bin/sh` ile çalışacak hale getirin: `shopt -s nullglob` ve `(( ))`
       yerine POSIX karşılıklarını kullanın ve `shellcheck -s sh` ile doğrulayın. Eşleşme olmadığında
       döngünün kalıbın kendisiyle çalışmaması için `[ -e "$f" ] || continue` ekleyin.
    4. `saglam-sablon.sh`'yi bir dizinle ve `-o yok` seçeneğiyle çalıştırıp ERR ve EXIT tuzaklarının
       çıktılarını inceleyin. Ardından betiği `sleep 30` içeren bir adım ekleyerek değiştirin, arka planda
       başlatıp `kill -TERM` gönderin ve geçici dizinin silindiğini doğrulayın.

## Özet

- Sağlam betik, her komutun sonucunu bilinçli ele alır ve beklenmeyen durumda erken ve görünür biçimde durur.
- `set -e` koşul bağlamlarında, `&&`/`||` listelerinde, `local x=$(…)` ve koşulda çağrılan fonksiyonlarda uygulanmaz; kritik adımlar açıkça denetlenir.
- `set -u` tanımsız değişkeni yakalar; `pipefail` boru hatasını görünür kılar ama `| head` ile SIGPIPE tuzağı yaratabilir.
- `trap … EXIT` temizlik için kullanılır; işleyici `$?`'yi korumalı, sinyaller taşınabilirlik için `exit` ile normal çıkışa dönüştürülmelidir.
- Geçici dosyalar `mktemp` ile hedef dizinde oluşturulur ve `mv` ile atomik olarak yerine konur.
- `getopts` POSIX kısa seçenek ayrıştırıcısıdır; çıkış durumları 0/1/2 geleneğine uyar.
- `flock` çöken süreçten bayat kilit bırakmaz. ShellCheck CI'da çalıştırılmalı; hedef betikleri POSIX sh ile yazılıp dash ile sınanmalıdır.

## Değerlendirme soruları

<div class="quiz" data-id="b07-1">
<p class="quiz-soru"><code>set -e</code> etkin bir betikte <code>dogrula() { false; echo "devam"; }</code> fonksiyonu <code>if dogrula; then …; fi</code> biçiminde çağrılıyor. Ne olur?</p>
<ul>
<li>Betik <code>false</code> satırında sonlanır</li>
<li data-dogru>Fonksiyon gövdesinde de set -e askıya alınır; "devam" yazılır ve fonksiyon 0 döndürür</li>
<li>Yalnızca fonksiyon sonlanır, if dalı çalışmaz</li>
<li>bash sözdizimi hatası verir</li>
</ul>
<p class="quiz-aciklama">Koşul bağlamında çalışan her komut, çağrılan fonksiyonların içi dahil, errexit'ten muaftır. Fonksiyonun son komutu (<code>echo</code>) başarılı olduğundan koşul doğru sayılır.</p>
</div>

<div class="quiz" data-id="b07-2">
<p class="quiz-soru">Bir temizlik işleyicisi <code>trap 'rm -rf "$gecici"' EXIT</code> olarak yazılmıştır ve betik <code>exit 3</code> ile çıkmaktadır. Çağıranın gördüğü durum nedir?</p>
<ul>
<li>Her zaman 0; rm başarılıdır</li>
<li data-dogru>3; kabuk, tuzaktan önceki çıkış durumunu korur</li>
<li>rm'nin durumu</li>
<li>130</li>
</ul>
<p class="quiz-aciklama">EXIT tuzağı çalıştıktan sonra kabuk özgün durumla çıkar; tuzak içindeki argümansız <code>exit</code> de bu durumu korur. Durum yalnızca tuzak açıkça başka bir değerle çıkarsa değişir: <code>trap 'rm -rf "$gecici"; exit $?' EXIT</code> yazımı rm'nin başarısını (0) döndürür ve hatayı gizler.</p>
</div>

<div class="quiz" data-id="b07-3">
<p class="quiz-soru"><code>set -o pipefail</code> etkin bir betikte <code>ilk=$(journalctl -b | head -n 1)</code> satırı bazen betiği durduruyor. Neden?</p>
<ul>
<li>journalctl, head ile birlikte kullanılamaz</li>
<li data-dogru>head bir satır okuyup çıkınca journalctl'nin sonraki yazmaları SIGPIPE ile sonlanır (141); çıktı büyükse pipefail bunu hata sayar</li>
<li>head, set -e altında her zaman 1 döndürür</li>
<li>Komut ikamesi pipefail'i devralmaz</li>
</ul>
<p class="quiz-aciklama">Durum, üreticinin çıktısının borunun tamponuna sığıp sığmamasına bağlıdır ve bu yüzden belirsizdir. Çözüm, satır sınırını üreticinin kendisine bırakmak (ör. <code>grep -m 1</code>) veya hattı bilinçli olarak <code>|| true</code> ile işaretlemektir.</p>
</div>

<div class="quiz" data-id="b07-4">
<p class="quiz-soru">Bir yapılandırma dosyasını güç kesintisine dayanıklı biçimde güncellemenin doğru yolu hangisidir?</p>
<ul>
<li><code>yeni_icerik &gt; /etc/sensor.conf</code></li>
<li><code>yeni_icerik &gt;&gt; /etc/sensor.conf</code></li>
<li data-dogru>Aynı dizinde <code>mktemp</code> ile geçici dosyaya yazıp eşitledikten sonra <code>mv</code> ile asıl adın yerine koymak</li>
<li><code>/tmp</code> altında oluşturup <code>cp</code> ile kopyalamak</li>
</ul>
<p class="quiz-aciklama">Aynı dosya sistemindeki <code>mv</code> (rename) atomiktir: okuyucular ya eski ya yeni dosyayı görür. <code>&gt;</code> dosyayı önce boşaltır; kesinti olursa boş veya yarım dosya kalır. <code>/tmp</code> çoğu zaman ayrı bir dosya sistemidir ve <code>cp</code> atomik değildir.</p>
</div>

<div class="quiz" data-id="b07-5">
<p class="quiz-soru"><code>#!/bin/sh</code> ile başlayan ve <code>[[ $1 == -v ]]</code> içeren bir betik geliştirici makinesinde (Fedora, /bin/sh = bash) çalışıyor, Ubuntu CI'da "[[: not found" hatası veriyor. En doğru çözüm hangisidir?</p>
<ul>
<li>CI makinesinde /bin/sh bağlantısını bash'e çevirmek</li>
<li data-dogru>Betik bash özelliği kullanıyorsa shebang'i <code>#!/bin/bash</code> yapmak; hedefte çalışacaksa <code>case</code> veya <code>[ "$1" = -v ]</code> ile POSIX'e çevirmek</li>
<li><code>[[</code> yerine <code>[[[</code> yazmak</li>
<li>Hatayı <code>2&gt;/dev/null</code> ile gizlemek</li>
</ul>
<p class="quiz-aciklama">Shebang, betiğin kullandığı dili doğru göstermelidir. Ubuntu'da /bin/sh dash'tir ve [[ ]] tanımaz. ShellCheck bu durumu SC3010 ile önceden bildirir.</p>
</div>

!!! alistirma "Alıştırma: Güvenli günlük döndürme betiği"
    Ağ geçidinde çalışacak (`#!/bin/sh`) bir `gunluk-dondur.sh` betiği yazın:

    1. `-n adet` (varsayılan 3) ve `-b boyut_kb` (varsayılan 512) seçeneklerini `getopts` ile alsın,
       tek konumsal argüman olarak günlük dosyasının yolunu beklesin; yanlış kullanımda 2 ile çıksın.
    2. Dosya belirtilen boyuttan küçükse hiçbir şey yapmasın.
    3. `dosya.1` … `dosya.N` zincirini kaydırsın, en eskisini silsin ve güncel dosyayı `dosya.1`
       yapsın; yeni boş günlük aynı izinlerle oluşturulsun.
    4. Aynı anda iki örneği çalışmasın; kilit `mkdir` ile `/run` (deneme için `$TMPDIR`) altında
       tutulsun ve her çıkışta kaldırılsın.
    5. `shellcheck -s sh` uyarı vermesin ve betik hem dash hem `busybox sh` ile çalışsın.

    ??? success "Örnek çözüm"
        ```sh
        #!/bin/sh
        # gunluk-dondur.sh: boyutu aşan günlüğü döndürür (POSIX sh)
        set -eu
        adet=3 boyut=512
        kullanim() { echo "Kullanım: ${0##*/} [-n adet] [-b boyut_kb] <günlük>" >&2; exit 2; }
        while getopts 'n:b:' s; do
            case $s in
                n) adet=$OPTARG ;;
                b) boyut=$OPTARG ;;
                *) kullanim ;;
            esac
        done
        shift $((OPTIND - 1))
        [ $# -eq 1 ] || kullanim
        case $adet$boyut in ''|*[!0-9]*) kullanim ;; esac
        dosya=$1
        [ -f "$dosya" ] || { echo "dosya yok: $dosya" >&2; exit 1; }

        kilit=${TMPDIR:-/run}/gunluk-dondur.kilit
        mkdir "$kilit" 2>/dev/null || { echo "başka bir örnek çalışıyor" >&2; exit 1; }
        trap 'rmdir "$kilit"' EXIT
        trap 'exit 130' INT
        trap 'exit 143' TERM

        kb=$(( $(wc -c < "$dosya") / 1024 ))
        [ "$kb" -ge "$boyut" ] || exit 0

        rm -f -- "$dosya.$adet"
        i=$adet
        while [ "$i" -gt 1 ]; do
            onceki=$((i - 1))
            [ ! -e "$dosya.$onceki" ] || mv -- "$dosya.$onceki" "$dosya.$i"
            i=$onceki
        done
        mv -- "$dosya" "$dosya.1"
        : > "$dosya"
        chmod "$(stat -c %a "$dosya.1")" "$dosya"   # GNU ve BusyBox stat -c destekler
        ```

        `[ ! -e … ] || mv …` biçimi, `set -e` altında dosya yokken `[ -e … ] && mv …` yazımının
        döngünün son komutu olarak yanlış durum bırakmasını önler. Günlüğü açık tutan bir servis eski
        dosyaya (`dosya.1`) yazmaya devam eder; servisin günlüğü yeniden açması için SIGHUP göndermek
        veya `copytruncate` yaklaşımını (kopyala, sonra `: > dosya` ile boşalt) kullanmak gerekir.

**Sonraki bölüm:** [8 · Gömülü sistemlerde ve Yocto'da kabuk betikleri →](08-gomulu-betikler.md)
