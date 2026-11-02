# 5 · Bash betiklerine giriş: değişkenler, tırnaklar, genişletmeler

<div class="kunye" markdown>
<span>Süre: ~55 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 1–4</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Bir betiğin çalıştırılma yollarını (`bash betik`, `./betik`, `. betik`) ve shebang satırının çekirdekteki işlenişini açıklayabilirsiniz.
    - Kabuk değişkenleri, özel parametreler ve ortam değişkenleri arasındaki farkı açıklayabilirsiniz.
    - Tek tırnak, çift tırnak, `$'…'` ve ters eğik çizgi kullanımını doğru seçebilirsiniz.
    - Bir komut satırının genişletme sırasını adım adım izleyebilir, sözcük bölme ve glob kaynaklı hataları önleyebilirsiniz.
    - Parametre genişletme biçimleriyle varsayılan değer, zorunlu argüman ve yol işlemleri yapabilirsiniz.
    - BitBake değişkeni ile kabuk değişkeni arasındaki farkı tariflerde gözetebilirsiniz.

## 5.1 Betik ve çalıştırılma yolları

**Betik**, kabuğun satır satır okuyup çalıştırdığı komutları içeren bir metin dosyasıdır. Etkileşimli
olarak yazılabilen her komut bir betikte de yer alabilir; fark, betiğin tekrarlanabilir, gözden
geçirilebilir ve sürüm denetimine alınabilir olmasıdır. Bir betik üç yolla çalıştırılabilir:

| Yol | Ne olur | Gereken |
|---|---|---|
| `bash betik.sh` | Yeni bir bash süreci dosyayı okur; ilk satır yalnızca yorumdur | Okuma izni |
| `./betik.sh` | Çekirdek ilk satırdaki yorumlayıcıyı başlatır ve dosya yolunu ona argüman olarak verir | Okuma ve yürütme izni, geçerli shebang |
| `. betik.sh` veya `source betik.sh` | Mevcut kabuk dosyayı kendi içinde çalıştırır; yeni süreç yoktur | Okuma izni |

İkinci yolda dosyanın ilk satırı olan **shebang** (`#!`) kullanılır. Çekirdek `execve` çağrısında
dosyanın ilk iki baytının `#!` olduğunu görünce satırın kalanını yorumlayıcı yolu olarak okur ve
`/bin/bash ./betik.sh argümanlar…` biçiminde o programı çalıştırır. Bu mekanizmanın sınırları
şunlardır:

- Yorumlayıcı **tam yol** ile yazılmalıdır; PATH araması yapılmaz. `#!/usr/bin/env bash` biçimi
  PATH'teki ilk `bash`'i bulmak için `env` programını kullanır; geliştirme makinelerinde taşınabilirdir,
  ancak `env`'in de hedef sistemde `/usr/bin/env` konumunda bulunmasını gerektirir.
- Linux, yorumlayıcıdan sonra tek bir argümanı ayrı tutar; `#!/bin/sh -e -u` satırında `-e -u` tek
  bir argüman olarak iletilir. Seçenekler betiğin içinde `set` ile verilmelidir.
- Satır sonunda Windows tipi `\r` karakteri varsa çekirdek `/bin/bash\r` adlı programı arar. bash 5.2
  bu durumda "cannot execute: required file not found", eski sürümler "bad interpreter: No such file
  or directory" iletisini verir. Çözüm `sed -i 's/\r$//' betik.sh` veya düzenleyicinin satır sonu ayarıdır.

Betik `exit n` ile veya son komutun durumuyla sona erer. `exit` sayısız kullanılırsa son komutun
durumu döndürülür. **Kaynaklanan** bir betikte `exit` çağıran kabuğu da kapatır; kaynaklanmak üzere
yazılan dosyalarda bunun yerine `return` kullanılır.

## 5.2 Değişkenler ve özel parametreler

Kabukta değişken `ad=değer` biçiminde atanır. **Eşittir işaretinin iki yanında boşluk bulunmamalıdır**:
`aralik = 5` satırı, `aralik` adlı bir komutu `=` ve `5` argümanlarıyla çalıştırmaya çalışır. Değişken
adları harf, rakam ve alt çizgiden oluşur ve rakamla başlayamaz. Değere `$ad` veya `${ad}` ile
başvurulur; kıvrık ayraç, adın nerede bittiğini belirtmek için gerekir: `${ad}_yedek`.

Bash'te tüm değişkenler varsayılan olarak **dizgidir**; `declare` ile öznitelik verilebilir:
`declare -i` (tam sayı), `declare -r` veya `readonly` (salt okunur), `declare -a` / `-A` (dizi,
Bölüm 6), `declare -x` (dışa aktarılmış). `unset ad` değişkeni kaldırır. Tanımsız bir değişken boş
dizgiye genişler; bu durum hataları gizleyebildiği için Bölüm 7'de `set -u` ile denetlenecektir.

Kabuk bazı **özel parametreleri** kendisi tanımlar:

| Parametre | Anlamı |
|---|---|
| `$0` | Betiğin (veya kabuğun) adı |
| `$1` … `$9`, `${10}` | Konumsal parametreler (argümanlar) |
| `$#` | Argüman sayısı |
| `"$@"` | Tüm argümanlar, her biri ayrı bir sözcük olarak korunur |
| `"$*"` | Tüm argümanlar, IFS'nin ilk karakteriyle birleştirilmiş **tek** sözcük |
| `$?` | Son komutun çıkış durumu |
| `$$` / `$!` | Kabuğun PID'i / son arka plan sürecinin PID'i |
| `$-` | Etkin kabuk seçenekleri (ör. `himBH`) |

`shift n` konumsal parametreleri n adım sola kaydırır; `set -- a b c` ise onları yeniden tanımlar.
Argümanları başka bir komuta **olduğu gibi** aktarmanın tek doğru yolu `"$@"`'dır; `$*` ve tırnaksız
`$@`, boşluk içeren argümanları böler.

## 5.3 Ortam değişkenleri ve export

Bir kabuk değişkeni yalnızca o kabuk sürecinin belleğinde yaşar. **Ortam** (*environment*) ise
`execve` sırasında yeni programa verilen `AD=değer` dizgilerinin listesidir. Kabuk, `export` ile
işaretlenmiş değişkenleri bu listeye koyar; çocuk süreç listenin bir **kopyasını** alır. Bu nedenle
ortam yalnızca ebeveynden çocuğa akar: çocuğun yaptığı değişiklik ebeveyne geri dönmez.

<div class="akis" data-senaryo="export-ortam"></div>

| Komut | Etkisi |
|---|---|
| `export AD=değer` | Ata ve dışa aktar |
| `AD=değer komut` | Yalnızca bu komutun ortamına ekle; kabuktaki değer değişmez |
| `env`, `printenv AD` | Ortamı veya tek bir değişkeni yazdır |
| `env -i AD=değer komut` | Boş bir ortamla başlat (yalnızca verilen değişkenler) |
| `export -n AD` / `unset AD` | Dışa aktarmayı kaldır / değişkeni sil |

Bu ilke, Yocto'daki **ortam betiklerinin** neden kaynaklanarak kullanıldığını açıklar. `init-build-env`
dizin değiştirir, `BUILDDIR`'i dışa aktarır ve PATH'i günceller; bunların çağıran kabukta kalıcı olması
için betik mevcut kabukta çalışmalıdır. SDK'nın `environment-setup-*` dosyası da aynı biçimde `CC`,
`CFLAGS`, `PKG_CONFIG_SYSROOT_DIR` gibi değişkenleri dışa aktarır
(bkz. <a href="../../c-derleme/bolumler/06-capraz-derleme.html">C ve derleme kitabı, Bölüm 6</a>).

<div class="terminal" data-oturum="export-ortam"></div>

!!! dikkat "BitBake kabuğun ortamını görmez"
    BitBake başlarken kabuğun ortamını temizler; yalnızca `BB_ENV_PASSTHROUGH` ve
    `BB_ENV_PASSTHROUGH_ADDITIONS` listelerindeki değişkenler içeri alınır. `export MACHINE=...`
    çalışabilir, çünkü OE-Core'un ortam betiği `MACHINE`, `DISTRO` ve vekil sunucu ayarları gibi
    bazı yaygın değişkenleri bu listeye ekler; ancak rastgele bir `export SENSOR_SURUM=2` tarifte
    görünmez. Kalıcı ayarlar yapılandırma dosyalarına (`local.conf`,
    yapılandırma parçaları) yazılmalıdır. Tersi yönde, tarifte `export AD = "..."` yazılması, değişkeni
    görev betiklerinde (`run.do_*`) dışa aktarır; derleme sistemi (make, cmake) bu değeri ortamdan okur.

## 5.4 Tırnaklar

Kabuk, sözcükleri ayırırken ve genişletme yaparken bazı karakterlere özel anlam yükler: boşluk,
`$`, `` ` ``, `\`, `*`, `?`, `[`, `'`, `"`, `|`, `&`, `;`, `<`, `>`, `(`, `)`, `#`, `~`. Tırnaklama
bu özel anlamları denetimli biçimde kapatır.

| Biçim | İçinde özel kalan | Kullanım |
|---|---|---|
| `'…'` | **Hiçbir şey**; tek tırnak içine tek tırnak yazılamaz | Düzenli ifadeler, awk/sed programları, sabit metin |
| `"…"` | `$`, `` ` ``, `\` (yalnızca `$ ` `` ` `` `" \` ve satır sonundan önce), etkileşimli kabukta `!` | Değişken içeren metin; **her değişken genişletmesi** |
| `$'…'` | C tarzı kaçışlar: `\n`, `\t`, `\x41`, `\'` | Sekme, satır sonu gibi görünmeyen karakterler (bash; POSIX 2024'te de var) |
| `\x` | Tek bir karakterin özel anlamını kaldırır | `rm Ad\ Soyad.txt` |

Tek tırnak içinde tek tırnak gerektiğinde tırnak kapatılır, kaçırılmış tırnak eklenir ve yeniden
açılır: `'O'\''nun'` → `O'nun`. Komut ikamesi `$( … )` içinde ise yeni bir tırnaklama bağlamı başlar;
`"$(dirname "$yol")"` ifadesindeki iç tırnaklar dıştakileri kapatmaz.

**Uygulamadaki kural basittir:** aksini gerektiren özel bir neden yoksa her değişken ve komut ikamesi
çift tırnak içine alınır: `"$dosya"`, `"$(komut)"`, `"${dizi[@]}"`. Tırnaksız genişletmenin bilinçli
kullanıldığı nadir durumlar (ör. bir seçenek listesinin bilerek bölünmesi) yorumla belirtilmelidir.

<div class="terminal" data-oturum="tirnaklar"></div>

## 5.5 Genişletme sırası

Kabuk bir komut satırını okuduktan sonra, komutu çalıştırmadan önce sözcükleri belirli bir sırayla
dönüştürür. Hataların çoğu bu sıranın bilinmemesinden kaynaklanır.

```mermaid
flowchart LR
    A["Ayrıştırma<br/>sözcükler, tırnaklar"] --> B["1 Küme ayracı<br/>{a,b} {1..3}"]
    B --> C["2 Tilde<br/>~ ~ad"]
    C --> D["3 Parametre, komut,<br/>aritmetik (soldan sağa)"]
    D --> E["4 Sözcük bölme<br/>IFS"]
    E --> F["5 Yol adı (glob)<br/>* ? [...]"]
    F --> G["6 Tırnak kaldırma<br/>→ argv"]
```

Bu sıranın üç önemli sonucu vardır:

1. **Küme ayracı en önce gelir** ve yalnızca metin üretir. `{1..$n}` çalışmaz, çünkü küme ayracı
   adımında `$n` henüz genişletilmemiştir. Değişkenli aralıklar için `seq 1 "$n"` veya
   `for ((i = 1; i <= n; i++))` kullanılır.
2. **Sözcük bölme ve glob yalnızca tırnaksız genişletme sonuçlarına uygulanır.** Satırda doğrudan
   yazılmış `a b` metni zaten iki sözcüktür; `"$x"` ise içeriği ne olursa olsun tek sözcük kalır.
   Değişkenin değerindeki `*` karakteri de tırnaksızsa glob olarak genişletilir.
3. **Glob sonucu yeniden bölünmez.** `for f in *.log` döngüsü boşluk içeren adları doğru işler;
   `for f in $(ls *.log)` ise `ls` çıktısını sözcük bölmeye uğrattığı için bozulur.

<div class="akis" data-senaryo="genisletme-sirasi"></div>

<div class="terminal" data-oturum="genisletme-sirasi"></div>

Glob davranışı `shopt` seçenekleriyle değiştirilir: `nullglob` eşleşmeyen kalıbı siler, `failglob`
hata verir, `dotglob` noktayla başlayan adları dahil eder, `globstar` `**` kalıbının alt dizinlere
inmesini sağlar. `set -f` glob'u tamamen kapatır. Sözcük bölmede kullanılan ayırıcılar `IFS`
değişkenindedir (varsayılan: boşluk, sekme, satır sonu); IFS'nin değiştirilmesi gerektiğinde bu
yalnızca ilgili komutla sınırlanmalıdır: `IFS=: read -r a b c <<< "$satir"`.

## 5.6 Parametre genişletme

`${…}` sözdizimi, değişkenin değerini dış komut çağırmadan dönüştürmeye yarar. İlk gruptaki biçimler
POSIX'tir ve dash ile BusyBox ash'te de çalışır:

| Biçim | Sonuç |
|---|---|
| `${x:-v}` | x tanımsız veya boşsa `v`, değilse x (x değişmez) |
| `${x:=v}` | x tanımsız veya boşsa x'e `v` ata ve kullan |
| `${x:?ileti}` | x tanımsız veya boşsa iletiyi yaz ve (etkileşimsiz kabukta) çık |
| `${x:+v}` | x boş değilse `v`, değilse boş dizgi |
| `${#x}` | Değerin karakter sayısı |
| `${x#kalıp}` / `${x##kalıp}` | Baştan en kısa / en uzun eşleşmeyi sil |
| `${x%kalıp}` / `${x%%kalıp}` | Sondan en kısa / en uzun eşleşmeyi sil |

İki nokta üst üste olmadan yazılan biçimler (`${x-v}`, `${x=v}`) yalnızca **tanımsız** durumu sınar;
tanımlı ama boş değişken için değer kullanılmaz. Kalıplar glob sözdizimindedir, düzenli ifade değildir.
Aşağıdaki biçimler bash'e özgüdür:

| Biçim | Sonuç |
|---|---|
| `${x/a/b}` / `${x//a/b}` | İlk / tüm `a` eşleşmelerini `b` ile değiştir |
| `${x:i:n}` | i. karakterden başlayan n karakterlik alt dizgi |
| `${x^^}` / `${x,,}` | Büyük / küçük harfe çevir |
| `${!x}` | Dolaylı başvuru: adı x'in değeri olan değişken |

<div class="terminal" data-oturum="parametre-genisletme"></div>

`#` ve `%` işleçleri dosya yolları için `basename` ve `dirname` komutlarının hızlı karşılığıdır:
`${yol##*/}` dosya adını, `${yol%/*}` dizini, `${ad%.*}` uzantısız adı verir. Bu işlemler kabuğun
içinde yapıldığından binlerce dosya üzerinde dönen döngülerde süreç başlatmaktan çok daha hızlıdır.
`examples/05-betik-temelleri/yol-islemleri.sh` bir imaj dosyası adını bu biçimlerle parçalarına ayırır.

## 5.7 Komut ikamesi ve aritmetik

**Komut ikamesi** `$(komut)`, komutun standart çıktısını metin olarak yerine koyar; çıktının
**sonundaki tüm satır sonları silinir**. Eski ters tırnak biçimi `` `komut` `` iç içe kullanımda ve
ters eğik çizgilerde karışık kurallar taşıdığından yeni betiklerde kullanılmamalıdır. Komut ikamesi
alt kabukta çalışır; içindeki değişken atamaları dışarıya yansımaz.

**Aritmetik genişletme** `$(( ifade ))` yalnızca **tam sayılarla** çalışır: `$((7 / 2))` sonucu
3'tür. İçeride değişkenler `$` olmadan yazılabilir: `$((sayac + 1))`. C'deki işleçlerin çoğu
(`+ - * / % << >> & | ^ ~ ! && || ?:`) desteklenir; bash ayrıca `**` (üs) ve `16#ff`, `2#1010` gibi
taban gösterimlerini tanır. Ondalıklı hesap için `awk` veya `bc` kullanılır.

!!! dikkat "Başında sıfır olan sayılar sekizli sayılır"
    `saat=08; echo $((saat + 1))` komutu bash'te "value too great for base" hatası verir: başında sıfır
    olan sayı sekizli (taban 8) olarak yorumlanır ve 8 sekizli bir rakam değildir. `date +%H`, `%M`
    veya dosya adlarından alınan sayılar bu tuzağa düşer. bash'te `$((10#$saat + 1))` biçimi tabanı
    açıkça 10 yapar; POSIX sh'de ise baştaki sıfırlar önce `${saat#0}` gibi bir genişletmeyle silinir.

## 5.8 BitBake tariflerinde kabuk değişkenleri

Tariflerdeki kabuk fonksiyonları (`do_install`, `pkg_postinst` vb.) iki aşamada işlenir: önce
**BitBake** fonksiyon metnindeki `${AD}` başvurularını kendi değişkenleriyle genişletir, ardından
kalan metin **kabuk** tarafından çalıştırılır (Bölüm 8). Bu iki aşamanın sözdizimi aynı olduğundan
dikkat gerektirir:

- `${D}`, `${bindir}`, `${S}` BitBake değişkenleridir ve görev betiğine genişletilmiş olarak yazılır.
- BitBake, tanımadığı bir `${ad}` başvurusunu olduğu gibi bırakır; bu nedenle `${i}` gibi kabuk
  değişkenleri genellikle çalışır. Ancak aynı adla bir BitBake değişkeni varsa (ör. `${PN}`, `${B}`,
  `${T}`) BitBake değeri kullanılır. Kabuk değişkenleri için `$i` biçimi veya BitBake'te tanımlı
  olmayacak açık adlar seçilmelidir.
- `pkg_postinst` içinde hedef kök dizini gösteren `$D`, **kıvrık ayraçsız** yazılır; `${D}` yazılırsa
  BitBake bunu derleme anında `…/image` yolu olarak genişletir.
- `${@ … }` biçimi BitBake'in satır içi Python ifadesidir ve kabuğa ulaşmadan değerlendirilir.

Ayrıntılar için bkz. <a href="../../yocto-gomulu-linux/bolumler/05-bitbake-dili.html">Yocto kitabı, Bölüm 5</a>.

!!! lab "Uygulama 5.1 · Genişletmelerin gözlenmesi"
    `examples/05-betik-temelleri/argv-goster.sh` betiği aldığı her argümanı `<…>` içinde yazar.
    Her satırın çıktısını çalıştırmadan önce tahmin edin, ardından doğrulayın:

    ```bash
    cd "$(mktemp -d)"; touch 'a b.txt' c.txt
    A='*.txt'; B='x  y'; C=''
    ./argv-goster.sh $A          # 1
    ./argv-goster.sh "$A"        # 2
    ./argv-goster.sh $B "$B"     # 3
    ./argv-goster.sh $C "$C" ""  # 4
    ./argv-goster.sh {a,c}*.txt  # 5
    ./argv-goster.sh ~/"$B"      # 6
    set -x; ./argv-goster.sh $(printf '%s\n' 1 '2 3'); set +x   # 7
    ```

    Ardından `yol-islemleri.sh` betiğini kendi imaj dosyanızın yoluyla çalıştırın ve `${ad%.*}` ile
    `${ad%%.*}` sonuçlarının farkını açıklayın.

## Özet

- `./betik` çekirdeğin shebang mekanizmasını kullanır; `bash betik` ilk satırı yok sayar; `. betik` mevcut kabukta çalışır.
- Atamada `=` çevresinde boşluk olmaz. Argümanlar `"$@"` ile aktarılır; `$#`, `$?`, `$$`, `$!` özel parametrelerdir.
- Ortam ebeveynden çocuğa kopyalanır; `export` gerekir, geri dönüş yoktur. Ortam betikleri bu yüzden kaynaklanır.
- Tek tırnak her şeyi, çift tırnak genişletme dışındaki her şeyi korur. Değişkenler her zaman çift tırnak içinde kullanılır.
- Genişletme sırası: küme ayracı → tilde → parametre/komut/aritmetik → sözcük bölme → glob → tırnak kaldırma.
- `${x:-v}`, `${x:?}`, `${x#}`, `${x%}` POSIX'tir; `${x//}`, `${x:i:n}`, `${x^^}` bash'e özgüdür.
- Aritmetik yalnızca tam sayıdır; başında sıfır olan sayılar sekizli sayılır. Tariflerde `${…}` önce BitBake tarafından genişletilir.

## Değerlendirme soruları

<div class="quiz" data-id="b05-1">
<p class="quiz-soru">Bir betik <code>./ayarla.sh</code> biçiminde çalıştırıldığında içindeki <code>cd /opt/sdk</code> ve <code>export CC=...</code> komutları çağıran kabukta etkisiz kalıyor. Neden?</p>
<ul>
<li>Betiğin yürütme izni eksiktir</li>
<li data-dogru>Betik ayrı bir süreçte çalışır; süreç bitince dizin ve ortam değişiklikleri kaybolur. <code>. ./ayarla.sh</code> ile kaynaklanmalıdır</li>
<li><code>export</code> yalnızca oturum açılırken çalışır</li>
<li>Shebang satırı yanlıştır</li>
</ul>
<p class="quiz-aciklama">Çalışma dizini ve ortam süreç başınadır; çocuk süreç ebeveyninkini değiştiremez. Kaynaklama betiği mevcut kabukta çalıştırır.</p>
</div>

<div class="quiz" data-id="b05-2">
<p class="quiz-soru"><code>dosya="olcum 1.csv"; rm $dosya</code> komutu ne yapar?</p>
<ul>
<li data-dogru><code>olcum</code> ve <code>1.csv</code> adlı iki dosyayı silmeye çalışır</li>
<li><code>olcum 1.csv</code> dosyasını siler</li>
<li>Sözdizimi hatası verir</li>
<li>Hiçbir şey yapmaz; değişken boştur</li>
</ul>
<p class="quiz-aciklama">Tırnaksız genişletme sözcük bölmeye uğrar. Doğru kullanım <code>rm -- "$dosya"</code>'dır.</p>
</div>

<div class="quiz" data-id="b05-3">
<p class="quiz-soru"><code>n=5; for i in {1..$n}; do echo $i; done</code> döngüsü neden 1'den 5'e saymaz?</p>
<ul>
<li><code>for</code> döngüsü küme ayracını desteklemez</li>
<li data-dogru>Küme ayracı genişletmesi parametre genişletmesinden önce yapılır; <code>{1..$n}</code> geçerli bir aralık olarak görülmez ve olduğu gibi kalır</li>
<li><code>$n</code> tırnak içinde olmadığı için</li>
<li>Aralıklar yalnızca harflerle çalışır</li>
</ul>
<p class="quiz-aciklama">Genişletme sırası küme ayracı → tilde → parametre... şeklindedir. Döngü tek bir öğe (<code>{1..5}</code> metni) ile çalışır. <code>for ((i = 1; i &lt;= n; i++))</code> veya <code>$(seq 1 "$n")</code> kullanılmalıdır.</p>
</div>

<div class="quiz" data-id="b05-4">
<p class="quiz-soru"><code>yol=tmp/deploy/images/qemux86-64/ornek.rootfs.ext4</code> için <code>${yol##*/}</code> ve <code>${yol%%.*}</code> sonuçları nelerdir?</p>
<ul>
<li><code>tmp</code> ve <code>ext4</code></li>
<li data-dogru><code>ornek.rootfs.ext4</code> ve <code>tmp/deploy/images/qemux86-64/ornek</code></li>
<li><code>ornek</code> ve <code>ornek.rootfs</code></li>
<li><code>qemux86-64/ornek.rootfs.ext4</code> ve <code>tmp/deploy/images/qemux86-64/ornek.rootfs</code></li>
</ul>
<p class="quiz-aciklama"><code>##*/</code> baştan son eğik çizgiye kadar olan en uzun kısmı, <code>%%.*</code> sondan ilk noktaya kadar olan en uzun kısmı siler.</p>
</div>

<div class="quiz" data-id="b05-5">
<p class="quiz-soru">Bir tarifin <code>pkg_postinst:${PN}</code> fonksiyonunda imajın kök dizinini sınamak için hangi yazım doğrudur?</p>
<ul>
<li><code>if [ -n "${D}" ]; then</code></li>
<li data-dogru><code>if [ -n "$D" ]; then</code></li>
<li><code>if [ -n "${@D}" ]; then</code></li>
<li><code>if [[ -v D ]]; then</code></li>
</ul>
<p class="quiz-aciklama"><code>${D}</code> BitBake tarafından derleme anında <code>.../image</code> yoluna genişletilir ve sınama her zaman doğru olur. <code>$D</code> ise kabuğa ulaşır; kurulum sonrası betik imaj oluşturulurken çalışıyorsa kök dizin yolunu, cihazda çalışıyorsa boş dizgiyi verir. <code>[[ ]]</code> hedefteki POSIX sh'de bulunmayabilir.</p>
</div>

!!! alistirma "Alıştırma: İmaj dosyalarının yeniden adlandırılması"
    `tmp/deploy/images/qemux86-64/` dizininde `ornek-image-qemux86-64.rootfs-20261102104512.wic.bz2`
    biçiminde adlar vardır. Bir betik yazın: verilen dizindeki tüm `*.wic.bz2` dosyaları için
    `ornek-<makine>-<tarih>.wic.bz2` biçiminde yeni adı **yalnızca yazdırsın** (taşımasın). Dış komut
    olarak yalnızca `printf` kullanın; ad boşluk içerse de doğru çalışsın, eşleşme yoksa hiçbir şey yazmasın.

    ??? success "Örnek çözüm"
        ```bash
        #!/bin/bash
        dizin=${1:?Kullanım: $0 <deploy-dizini>}
        shopt -s nullglob                         # eşleşme yoksa döngü hiç çalışmaz
        for yol in "$dizin"/*.wic.bz2; do
            ad=${yol##*/}                         # ornek-image-qemux86-64.rootfs-20261102104512.wic.bz2
            govde=${ad%.wic.bz2}                  # ...rootfs-20261102104512
            tarih=${govde##*-}                    # 20261102104512
            makine=${govde#ornek-image-}          # qemux86-64.rootfs-20261102104512
            makine=${makine%%.*}                  # qemux86-64
            printf '%s -> %s\n' "$ad" "ornek-$makine-$tarih.wic.bz2"
        done
        ```

        Döngü glob üzerinde döndüğü için boşluklu adlar bölünmez; her genişletme tırnak içinde
        kullanılmıştır. `nullglob` olmadan eşleşme yoksa döngü `*.wic.bz2` metniyle bir kez çalışırdı.

**Sonraki bölüm:** [6 · Koşullar, döngüler, diziler ve fonksiyonlar →](06-kosul-dongu-fonksiyon.md)
