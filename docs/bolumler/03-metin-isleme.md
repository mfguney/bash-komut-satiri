# 3 · Metin işleme: grep, sed, awk, find, xargs

<div class="kunye" markdown>
<span>Süre: ~55 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 1–2</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Temel (BRE) ve genişletilmiş (ERE) düzenli ifadeleri okuyup yazabilir, glob kalıplarından ayırt edebilirsiniz.
    - `grep` ile satır süzebilir, çıkış durumunu betiklerde koşul olarak kullanabilirsiniz.
    - `sed` komut döngüsünü (desen alanı, adresleme, `s`, `d`, `p`) açıklayabilir ve dosyaları yerinde düzenleyebilirsiniz.
    - `awk` ile alan tabanlı raporlar ve ilişkisel dizilerle özetler üretebilirsiniz.
    - `find` ölçütlerini birleştirebilir; `-print0 | xargs -0` ile her dosya adı için güvenli toplu işlem yapabilirsiniz.
    - Bir cihaz günlüğünü ve BitBake çıktısını bu araçlarla çözümleyebilirsiniz.

## 3.1 Metin akışı yaklaşımı

Unix araçlarının büyük kısmı aynı sözleşmeye uyar: girdiyi standart girdiden veya dosyadan **satır
satır** okur, bir dönüşüm uygular ve sonucu standart çıktıya yazar. Bu sözleşme, her biri tek bir işi
iyi yapan küçük araçların borularla (Bölüm 4) birleştirilmesine olanak verir. Bir günlükte en çok hata
veren sensörü bulmak için ayrı bir program yazmak yerine `grep`, `cut`, `sort` ve `uniq` art arda bağlanır.

Bu bölümün beş ana aracının yanında sık kullanılan yardımcılar şunlardır:

| Araç | İşlevi | Örnek |
|---|---|---|
| `head`, `tail` | İlk / son satırlar; `tail -f` dosyayı izler | `tail -n 20 -f /var/log/messages` |
| `cut` | Ayırıcıya veya sütun konumuna göre alan seçer | `cut -d: -f1,7 /etc/passwd` |
| `sort`, `uniq` | Sıralar; ardışık tekrarları birleştirir veya sayar | <code>sort &#124; uniq -c &#124; sort -rn</code> |
| `tr` | Karakter dönüştürür veya siler | `tr -d '\r'` (Windows satır sonları) |
| `wc` | Satır, sözcük, bayt sayar | `wc -l` |
| `tee` | Girdiyi hem dosyaya hem çıktıya yazar | <code>bitbake ... 2&gt;&amp;1 &#124; tee derleme.log</code> |
| `diff`, `comm` | Dosyaları karşılaştırır | `diff -u eski.conf yeni.conf` |

!!! dikkat "Yerel ayar (locale) sonucu değiştirir"
    `sort` düzeni, `[a-z]` aralığının hangi karakterleri kapsadığı ve büyük/küçük harf dönüşümü yerel
    ayara bağlıdır. Türkçe ayarda `i` ile `İ`, `ı` ile `I` eşleşir; İngilizce ayarda eşleşmez. Bir
    betiğin her makinede aynı sonucu vermesi için bayt düzeyinde çalışan `LC_ALL=C` kullanılır:
    `LC_ALL=C sort dosya`. Bu ayar büyük dosyalarda `sort` ve `grep` komutlarını belirgin biçimde
    hızlandırır. BitBake görevleri de yerel ayarı sabitleyerek çalışır.

## 3.2 Düzenli ifadeler

**Düzenli ifade** (*regular expression*), bir metin kalıbını tanımlayan küçük bir dildir. Kabuğun dosya
adlarında kullandığı **glob** kalıplarıyla karıştırılmamalıdır: globda `*` "herhangi bir dizgi"
anlamına gelir; düzenli ifadede ise "önceki öğenin sıfır veya daha çok tekrarı" demektir. `*.log`
glob'unun düzenli ifade karşılığı `^.*\.log$` olur.

POSIX iki sözdizimi tanımlar. **Temel düzenli ifade** (BRE), `grep` ve `sed` için varsayılandır;
**genişletilmiş düzenli ifade** (ERE), `grep -E`, `sed -E` ve `awk` tarafından kullanılır. Fark,
bazı işleçlerin ters eğik çizgiyle mi yoksa doğrudan mı yazıldığıdır:

| Anlamı | BRE | ERE | Örnek eşleşme |
|---|---|---|---|
| Herhangi bir karakter | `.` | `.` | `a.c` → abc, a-c |
| Önceki öğe 0+ kez | `*` | `*` | `ab*` → a, abbb |
| Önceki öğe 1+ kez | `\+` (GNU eki) | `+` | `[0-9]+` → 7, 2026 |
| 0 veya 1 kez | `\?` (GNU eki) | `?` | `renk?` → ren, renk |
| n–m kez | `\{n,m\}` | `{n,m}` | `[0-9]{2,4}` |
| Gruplama | `\( \)` | `( )` | `(ab)+` |
| Seçenek | <code>\&#124;</code> (GNU eki) | <code>&#124;</code> | <code>HATA&#124;UYARI</code> |
| Geri başvuru | `\1` | (POSIX ERE'de yok) | `\(.\)\1` → aa, 77 |
| Satır başı / sonu | `^` `$` | `^` `$` | `^#`, `;$` |
| Karakter kümesi | `[abc]` `[^abc]` `[0-9]` | aynı | `[^ ]+` boşluk dışı dizgi |
| Karakter sınıfı | `[[:digit:]]` `[[:space:]]` `[[:alpha:]]` | aynı | yerel ayardan bağımsız tanım |

İki genel kural sık yapılan hataları önler. Birincisi, nicelik belirteçleri **açgözlüdür**: `s/".*"//`
satırdaki ilk tırnaktan **son** tırnağa kadar her şeyi siler; yalnızca ilk tırnaklı parçayı silmek için
`s/"[^"]*"//` yazılır. İkincisi, düzenli ifade kabuğun tek tırnakları içinde verilmelidir; aksi halde
`*`, `$`, `\` gibi karakterler önce kabuk tarafından yorumlanır. GNU araçları ayrıca sözcük sınırı için
`\b`, `\<`, `\>` ve `grep -P` ile Perl uyumlu ifadeler sunar; bunlar POSIX değildir ve BusyBox'ta
bulunmayabilir.

## 3.3 grep: satır süzme

`grep KALIP dosya...` kalıbın eşleştiği satırları yazar. Davranışı birkaç seçenekle değiştirilir:

| Seçenek | Anlamı | Seçenek | Anlamı |
|---|---|---|---|
| `-E` / `-F` | ERE / sabit dizgi | `-v` | Eşleşmeyen satırlar |
| `-i` | Büyük/küçük harf duyarsız | `-w` / `-x` | Tam sözcük / tam satır |
| `-n` | Satır numarası | `-c` | Eşleşen satır sayısı |
| `-o` | Yalnızca eşleşen parça | `-l` / `-L` | Eşleşen / eşleşmeyen dosya adları |
| `-r` | Dizinde özyinelemeli arama | `-q` | Sessiz; yalnızca çıkış durumu |
| `-A n` `-B n` `-C n` | Sonraki / önceki / iki yandaki n satır | `-m n` | En fazla n eşleşme |

grep'in **çıkış durumu** üç değer alır: 0 eşleşme bulundu, 1 bulunamadı, 2 hata (dosya okunamadı,
kalıp geçersiz). Betiklerde `grep -q` bir koşul olarak kullanılır ve çıktıyı `/dev/null`'a yönlendirmekten
daha açıktır. Bulunamama (1) ile hata (2) ayrımı önemlidir: `if ! grep -q HATA "$f"` koşulu, dosya
yoksa da doğru olur.

<div class="terminal" data-oturum="grep-ifadeler"></div>

!!! iyi "Kaynak ağacında arama"
    `grep -rn --include='*.bb' --include='*.bbappend' 'SRC_URI' meta-ornek/` yalnızca tarif
    dosyalarında arar. Büyük depolarda `git grep` (yalnızca izlenen dosyalar) veya kuruluysa `rg`
    (ripgrep) çok daha hızlıdır. Yocto katmanlarında bir değişkenin nerede atandığını bulmak için ise
    metin araması yerine `bitbake-getvar -r tarif DEĞİŞKEN` kullanılmalıdır; bu komut değişkenin tüm
    atama geçmişini gösterir.

## 3.4 sed: akış düzenleyici

`sed` girdiyi bir kez, satır satır okur. Her satır **desen alanı** (*pattern space*) adlı bir tampona
alınır, komut listesi baştan sona uygulanır ve döngü sonunda desen alanı yazdırılır (`-n` verilmişse
yazdırılmaz). Dosyanın tamamı belleğe alınmadığı için gigabaytlık günlüklerde de çalışır. İkinci bir
tampon olan **tutma alanı** (*hold space*), satırlar arasında veri taşımak için `h`, `H`, `g`, `G`, `x`
komutlarıyla kullanılır.

<div class="akis" data-senaryo="sed-desen-alani"></div>

Her sed komutunun önüne isteğe bağlı bir **adres** yazılır; komut yalnızca adresin seçtiği satırlarda
çalışır:

| Adres | Seçilen satırlar | Örnek |
|---|---|---|
| (yok) | Tüm satırlar | `s/a/b/` |
| `n` | n. satır | `3d` |
| `$` | Son satır | `$a\son satır` |
| `/ifade/` | İfadenin eşleştiği satırlar | `/^#/d` |
| `a,b` | a'dan b'ye kadar (her biri sayı veya ifade olabilir) | `/BEGIN/,/END/p` |
| `ilk~adım` (GNU) | ilk satırdan başlayarak her adım satırda bir | `1~2d` |
| `adres!` | Adresin seçmediği satırlar | `/^aralik=/!d` |

En çok kullanılan komutlar `s/kalıp/yerine/bayraklar` (değiştir), `d` (sil, sonraki döngüye geç), `p`
(yazdır), `a\`, `i\`, `c\` (sonrasına ekle, öncesine ekle, değiştir) ve `q` (çık) komutlarıdır. `s`
komutunun bayrakları: `g` tüm eşleşmeler, `n` (sayı) yalnızca n. eşleşme, `i` harf duyarsız (GNU).
Yerine metninde `&` eşleşmenin tamamını, `\1`–`\9` yakalanan grupları gösterir. Ayırıcı olarak `/`
dışında herhangi bir karakter kullanılabilir; yol içeren ifadelerde bu okunabilirliği artırır:
`s|/usr/local|/usr|g`.

**Yerinde düzenleme** (`-i`) çıktıyı geçici bir dosyaya yazar ve sonunda asıl dosyanın yerine koyar.
Bunun iki sonucu vardır: dosyanın inode'u değişir (sabit bağlantılar kopar) ve yazma izni dosyaya değil
dizine gerekir. `-i` seçeneğinin sözdizimi uygulamalar arasında farklıdır: GNU sed ve BusyBox sed ek
alırsa bitişik yazar (`-i.yedek`), BSD/macOS sed ise ayrı bir argüman bekler (`-i ''`). Taşınabilir
betiklerde `sed ... dosya > dosya.yeni && mv dosya.yeni dosya` biçimi tercih edilebilir.

## 3.5 awk: alanlar ve raporlar

`awk` küçük bir programlama dilidir. Girdiyi **kayıtlara** (varsayılan olarak satırlara), her kaydı da
**alanlara** (varsayılan olarak boşluk ve sekmelerle ayrılmış sözcüklere) böler. Bir awk programı
`desen { eylem }` çiftlerinden oluşur; her kayıt için deseni doğru olan eylemler çalışır. Desen
verilmezse eylem her satırda, eylem verilmezse satırın tamamı yazdırılır.

| Öğe | Anlamı |
|---|---|
| `$0`, `$1`, `$NF` | Kaydın tamamı, birinci alan, son alan |
| `NR`, `NF` | Okunan kayıt sayısı, bu kayıttaki alan sayısı |
| `FS`, `OFS` | Girdi / çıktı alan ayırıcısı (`-F` seçeneği FS'yi ayarlar) |
| `BEGIN { }` / `END { }` | İlk kayıttan önce / son kayıttan sonra çalışan bloklar |
| `-v ad=değer` | Kabuktan awk değişkenine değer aktarma |
| `dizi[anahtar]` | İlişkisel dizi; anahtar herhangi bir dizgi olabilir |

awk'ta değişkenler bildirim gerektirmez ve ilk kullanımda boş dizgi veya 0 değerini alır. Bir değer
sayı gibi görünüyorsa sayısal karşılaştırma yapılır; bu nedenle `$6 > 27` ifadesi `27.6` değerini doğru
biçimde karşılaştırır. Kabuktaki bir değişkeni awk programının metnine gömmek yerine `-v` ile aktarmak
tırnak sorunlarını önler: `awk -v esik="$ESIK" '$2 > esik'`.

<div class="terminal" data-oturum="sed-awk"></div>

Son komutta kullanılan `examples/03-metin-isleme/sensor-ozet.awk` programı yalnızca POSIX awk
özelliklerini kullanır ve gawk, mawk ve BusyBox awk ile aynı sonucu verir. Sensör adını anahtar olarak
kullanan dört ilişkisel dizi (`adet`, `toplam`, `enaz`, `encok`) tek geçişte doldurulur; `END` bloğu
sonuçları `sort` sürecine yönlendirerek sıralı yazar. gawk'a özgü `asort`, `strftime` ve `gensub` gibi
fonksiyonlar hedef cihazda bulunmayabilir.

## 3.6 find: dosya ağacında arama

`find başlangıç... ifade` dizin ağacını özyinelemeli gezer ve her dosya için ifadeyi soldan sağa
değerlendirir. İfade üç tür öğeden oluşur: **ölçütler** (doğru/yanlış döndürür), **eylemler** (bir şey
yapar) ve **işleçler** (`-a` ve, `-o` veya, `!` değil, `\( \)` gruplama). Hiç eylem verilmezse `-print`
varsayılır.

| Ölçüt | Anlamı | Ölçüt | Anlamı |
|---|---|---|---|
| `-name 'k'` / `-iname` | Ad glob kalıbına uyuyor | `-path 'k'` | Yolun tamamı kalıba uyuyor |
| `-type f/d/l` | Dosya / dizin / bağlantı | `-size +10M` / `-size -100c` | Boyut (k, M, G, c=bayt) |
| `-mtime -1` / `-mmin -30` | Son 1 günde / 30 dakikada değişti | `-newer dosya` | Dosyadan daha yeni |
| `-perm -4000` | Belirtilen bitlerin hepsi açık | `-user ad` / `-group ad` | Sahip / grup |
| `-maxdepth n` | En fazla n düzey in | `-xdev` | Başka dosya sistemine geçme |

| Eylem | Anlamı |
|---|---|
| `-print` / `-print0` | Yolu satır sonu / NUL ile yaz |
| `-exec komut {} \;` | Her dosya için komutu ayrı çalıştır |
| `-exec komut {} +` | Dosyaları gruplayıp az sayıda çağrıyla çalıştır |
| `-prune` | Bu dizine inme |
| `-delete` | Dosyayı sil (dikkatli kullanılmalı; `-depth` içerir) |

İfadenin sırası anlamlıdır. `find . -name '*.c' -o -name '*.h' -print` komutu yalnızca `.h` dosyalarını
yazar, çünkü `-print` ikinci dala bağlıdır; doğru biçim `find . \( -name '*.c' -o -name '*.h' \) -print`
olur. Boyut ölçütünde birim yuvarlaması da şaşırtıcı olabilir: `-size -1k` "1 KiB'tan küçük" değil,
"1 KiB'lık birimlere yukarı yuvarlandığında 1'den küçük", yani yalnızca boş dosyalar anlamına gelir.
Bayt duyarlılığı için `c` birimi kullanılır. `-delete` eylemi ise ifadenin en sonunda yer almalıdır;
başa yazılan `-delete` her şeyi siler.

## 3.7 xargs ve güvenli toplu işlem

Birçok komut dosya adlarını girdiden değil argümanlardan alır. `xargs`, standart girdideki öğeleri
okuyup bir komutun argüman listesine dönüştürür ve listeyi sistemin argüman sınırına (`getconf ARG_MAX`)
sığacak gruplara böler. Varsayılan kipte öğeleri **boşluk, sekme ve satır sonundan** böler ve tırnak
karakterlerini özel yorumlar; bu nedenle boşluk içeren bir dosya adı iki ayrı argümana dönüşür.

Her dosya adı için güvenli tek yöntem, adları **NUL** baytıyla ayırmaktır: NUL bir dosya yolunda asla
bulunamaz. `find -print0` adları NUL ile yazar, `xargs -0` yalnızca NUL'dan böler. Aynı ilke
`grep -lZ`, `sort -z` ve bash'in `read -d ''` komutunda da vardır.

<div class="akis" data-senaryo="find-xargs"></div>

xargs'ın sık kullanılan seçenekleri şunlardır: `-n N` her çağrıda en fazla N argüman, `-P N` aynı anda
en fazla N süreç (paralel çalıştırma), `-I{}` her öğe için ayrı çağrı ve `{}` yerine öğenin konması,
`-r` girdi boşsa komutu hiç çalıştırmama (GNU'da varsayılan değildir; BusyBox da destekler).

<div class="terminal" data-oturum="find-xargs"></div>

!!! sss "`find -exec ... {} +` varken xargs neden kullanılır?"
    `-exec ... {} +` gruplamayı ve güvenli ad aktarımını boru olmadan yapar ve çoğu durumda yeterlidir.
    xargs ise paralel çalıştırma (`-P`), grup boyutunun denetimi (`-n`) ve find dışındaki kaynaklardan
    (ör. `git ls-files -z`) gelen listelerin işlenmesi gerektiğinde tercih edilir. Örnek: bir katmandaki
    tüm kabuk betiklerini dört paralel süreçle denetlemek:
    `git ls-files -z '*.sh' | xargs -0 -n 8 -P 4 shellcheck`.

## 3.8 Uygulama: günlük ve BitBake çıktısının çözümlenmesi

Gömülü geliştirmede metin işleme araçlarının en sık kullanıldığı iki yer, cihaz günlükleri ve derleme
çıktılarıdır. BitBake'in konsol çıktısı belirli kalıplara uyar: uyarılar `WARNING:`, hatalar `ERROR:`
ile başlar; tarif ve görev `<PN>-<PV>-<PR> do_<görev>:` biçiminde yazılır; kalite denetimi (QA)
uyarılarının türü satır sonunda köşeli parantez içinde verilir (`[ldflags]`). Bu düzenlilik, binlerce
satırlık bir çıktının birkaç satırlık özete indirilmesini sağlar.

<div class="terminal" data-oturum="bitbake-cikti-analizi"></div>

`bitbake -e tarif` çıktısı da metin araçlarıyla süzülebilir: `bitbake -e sensor-oku | grep '^WORKDIR='`
tarifin çalışma dizinini verir. Ancak bu komut binlerce satırlık bir ortam dökümü üretir ve yavaştır;
Yocto'nun güncel sürümlerinde aynı bilgi `bitbake-getvar -r sensor-oku --value WORKDIR` ile doğrudan
alınır (bkz. <a href="../../yocto-gomulu-linux/bolumler/05-bitbake-dili.html">Yocto kitabı, Bölüm 5</a>).

!!! lab "Uygulama 3.1 · Cihaz günlüğünden rapor"
    `examples/03-metin-isleme/veri/sensor.log` dosyası ağ geçidinin bir günlük kesitidir. Her
    soruyu **tek bir boru hattıyla** yanıtlayın ve sonucu `sensor-ozet.awk` çıktısıyla karşılaştırın:

    1. Hangi sensör kaç kez hata vermiştir? (`grep`, `awk` veya `sed`, `sort`, `uniq -c`)
    2. `sensor1` için ölçülen en yüksek sıcaklık ve zamanı nedir? (`grep`, `sort -t= -k`, `tail`)
    3. Saat 10:02 ile 10:03 arasındaki (10:02:00 dahil, 10:03:00 hariç) ölçüm satırı sayısı kaçtır?
    4. Günlükteki tüm süreç adlarını (köşeli parantezdeki PID olmadan) tekil olarak listeleyin.
    5. `sensor.conf` dosyasında `esik` değerini `27.5` yapın; dosyanın yedeği alınsın ve yorum satırları korunsun.

    ??? success "Olası yanıtlar"
        ```bash
        grep HATA sensor.log | awk '{ sub(/:$/, "", $5); print $5 }' | sort | uniq -c
        grep sensor1 sensor.log | grep -o 'T[0-9:]* .*sicaklik=[0-9.]*' | sort -t= -k2 -n | tail -n 1
        grep -c 'T10:02:[0-9][0-9] .*sicaklik=' sensor.log
        awk '{ sub(/\[.*/, "", $3); print $3 }' sensor.log | sort -u
        sed -i.yedek 's/^esik=.*/esik=27.5/' sensor.conf
        ```

## Özet

- Araçlar satır tabanlı akış sözleşmesine uyar ve borularla birleştirilir; sonuçların taşınabilir olması için `LC_ALL=C` kullanılabilir.
- Glob ve düzenli ifade farklı dillerdir. BRE'de `\{ \}`, `\( \)` kaçırılır; ERE (`-E`) bunları doğrudan kullanır. Kalıplar tek tırnak içinde verilir.
- `grep` çıkış durumu 0 (bulundu), 1 (bulunamadı), 2 (hata) değerlerini alır; betiklerde `grep -q` koşul olarak kullanılır.
- `sed` satırı desen alanına alır, adresli komutları uygular ve döngü sonunda yazar; `-i` dosyayı geçici kopya üzerinden değiştirir.
- `awk` alanlara ayırma, sayısal karşılaştırma ve ilişkisel dizilerle tek geçişte rapor üretir; `-v` ile değer aktarılır.
- `find` ifadeyi soldan sağa değerlendirir; işleç önceliği ve `-size` yuvarlaması dikkat ister. `-exec {} +` gruplayarak çalışır.
- Boşluk içeren adlar için tek güvenli yol NUL ayırıcıdır: `find -print0 | xargs -0`.

## Değerlendirme soruları

<div class="quiz" data-id="b03-1">
<p class="quiz-soru"><code>grep 'sensor[0-9]+' sensor.log</code> komutu <code>sensor12</code> içeren satırları bulmuyor. Neden?</p>
<ul>
<li><code>[0-9]</code> yalnızca tek basamağı kabul eder ve <code>+</code> bunu değiştiremez</li>
<li data-dogru>grep varsayılan olarak BRE kullanır; BRE'de <code>+</code> düz bir karakterdir. <code>grep -E</code> veya <code>\+</code> gerekir</li>
<li>Tek tırnak içinde <code>+</code> kabuk tarafından silinir</li>
<li>grep sayıları eşleştiremez</li>
</ul>
<p class="quiz-aciklama">BRE'de <code>+</code> özel değildir (GNU grep'te <code>\+</code> bir ektir). ERE'de <code>+</code> "bir veya daha fazla" anlamına gelir.</p>
</div>

<div class="quiz" data-id="b03-2">
<p class="quiz-soru"><code>sed -n '/BASLA/,/BITIR/p' dosya</code> komutu ne yazar?</p>
<ul>
<li>Yalnızca BASLA ve BITIR içeren satırları</li>
<li data-dogru>BASLA içeren satırdan sonraki ilk BITIR satırına kadar (ikisi dahil) olan blokları</li>
<li>BASLA ile BITIR arasındaki satırları, ikisi hariç</li>
<li>Dosyanın tamamını iki kez</li>
</ul>
<p class="quiz-aciklama">Aralık adresi başlangıç ifadesinin eşleştiği satırla açılır, bitiş ifadesinin eşleştiği satırla kapanır; her iki uç dahildir. <code>-n</code> otomatik yazdırmayı kapattığı için yalnızca <code>p</code> ile seçilenler görünür.</p>
</div>

<div class="quiz" data-id="b03-3">
<p class="quiz-soru"><code>find . -name '*.c' | xargs rm</code> komutunun "./src/eski dosya.c" adlı dosya varken yarattığı risk nedir?</p>
<ul>
<li>Risk yoktur; xargs dosya adlarını satır satır alır</li>
<li>find boşluklu adları listelemez</li>
<li data-dogru>xargs adı boşluktan böler; <code>./src/eski</code> ve <code>dosya.c</code> adlı, belki başka, dosyalar silinmeye çalışılır</li>
<li>rm boşluklu adı reddeder ve işlem durur</li>
</ul>
<p class="quiz-aciklama">Varsayılan xargs boşluk, sekme ve satır sonundan böler. Güvenli biçim <code>find . -name '*.c' -print0 | xargs -0 rm --</code> veya <code>find . -name '*.c' -delete</code>'dir.</p>
</div>

<div class="quiz" data-id="b03-4">
<p class="quiz-soru">Bir betikte <code>ESIK</code> kabuk değişkeninin değeri awk programında kullanılacaktır. En güvenli yöntem hangisidir?</p>
<ul>
<li><code>awk '$2 &gt; $ESIK' dosya</code></li>
<li><code>awk "\$2 &gt; $ESIK" dosya</code></li>
<li data-dogru><code>awk -v esik="$ESIK" '$2 &gt; esik' dosya</code></li>
<li><code>export ESIK; awk '$2 &gt; ESIK' dosya</code></li>
</ul>
<p class="quiz-aciklama">İlkinde <code>$ESIK</code> awk'a ulaşır ve awk'ta "ESIK numaralı alan" anlamına gelir. İkincisi değeri program metnine gömer; değer beklenmedik karakter içerirse programı bozar. <code>-v</code> değeri bir awk değişkenine güvenle aktarır. Ortam değişkenleri awk'ta yalnızca <code>ENVIRON["ESIK"]</code> ile okunur.</p>
</div>

<div class="quiz" data-id="b03-5">
<p class="quiz-soru"><code>find . -name '*.c' -o -name '*.h' -exec wc -l {} +</code> komutu neden yalnızca başlık dosyalarını sayar?</p>
<ul>
<li><code>-exec</code> en fazla bir <code>-name</code> ile çalışır</li>
<li data-dogru>Örtük <code>-a</code> işleci <code>-o</code>'dan önceliklidir; <code>-exec</code> yalnızca ikinci dala bağlanır. Ölçütler <code>\( \)</code> ile gruplanmalıdır</li>
<li><code>+</code> sonlandırıcısı yalnızca son eşleşmeyi alır</li>
<li><code>*.c</code> kalıbı tırnak içinde olduğu için eşleşmez</li>
</ul>
<p class="quiz-aciklama">İfade <code>-name '*.c' -o ( -name '*.h' -a -exec ... )</code> olarak değerlendirilir. Doğru biçim: <code>find . \( -name '*.c' -o -name '*.h' \) -exec wc -l {} +</code>.</p>
</div>

!!! alistirma "Alıştırma: Derleme uyarılarının sınıflandırılması"
    Bir tarifin `log.do_compile` dosyasında GCC uyarıları şu biçimdedir:

    ```text
    modbus-izle.c:42:9: warning: unused variable 'sayac' [-Wunused-variable]
    ```

    Bir boru hattı yazın: uyarıları türüne (`-W...`) göre sayıp çoktan aza sıralasın; ikinci bir hat ise
    en çok uyarı içeren üç kaynak dosyayı uyarı sayılarıyla listelesin. Deneme için aşağıdaki satırlarla
    bir dosya oluşturun.

    ```bash
    cat > log.do_compile <<'EOF'
    a.c:3:5: warning: unused variable 'x' [-Wunused-variable]
    a.c:9:1: warning: control reaches end of non-void function [-Wreturn-type]
    b.c:4:7: warning: unused variable 'y' [-Wunused-variable]
    a.c:12:3: warning: implicit declaration of function 'f' [-Wimplicit-function-declaration]
    c.c:1:1: note: bilgi satırı
    EOF
    ```

    ??? success "Örnek çözüm"
        ```bash
        grep ': warning: ' log.do_compile | grep -oE '\[-W[a-z0-9-]+\]$' | sort | uniq -c | sort -rn
        #   2 [-Wunused-variable]
        #   1 [-Wreturn-type]
        #   1 [-Wimplicit-function-declaration]

        grep ': warning: ' log.do_compile | cut -d: -f1 | sort | uniq -c | sort -rn | head -n 3
        #   3 a.c
        #   1 b.c
        ```

        `note:` satırları ilk `grep` ile dışarıda bırakılır. Kalıbın sonundaki `$`, satır içinde geçen
        başka köşeli parantezli metinlerin yanlışlıkla sayılmasını önler.

**Sonraki bölüm:** [4 · Yönlendirme, borular, süreçler ve sinyaller →](04-yonlendirme-surecler.md)
