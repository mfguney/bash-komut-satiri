# 6 · Koşullar, döngüler, diziler ve fonksiyonlar

<div class="kunye" markdown>
<span>Süre: ~55 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 5</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Kabukta doğruluğun çıkış durumuyla ifade edildiğini ve `if`, `&&`, `||` yapılarının buna dayandığını açıklayabilirsiniz.
    - `test`, `[ ]`, `[[ ]]` ve `(( ))` arasındaki farkları ve her birinin tuzaklarını açıklayabilirsiniz.
    - `case` ile kalıp eşleştirmesi yapabilir; `for`, `while` ve `until` döngülerini doğru kullanabilirsiniz.
    - Dosyaları satır satır güvenle okuyabilir, borudaki döngünün alt kabuk sorununu çözebilirsiniz.
    - Dizi ve ilişkisel dizilerle çalışabilir, komut argümanlarını dizide güvenle oluşturabilirsiniz.
    - Fonksiyon tanımlayabilir; `local`, dinamik kapsam, dönüş değeri ve çıktı arasındaki ayrımı açıklayabilirsiniz.

## 6.1 Doğruluk: çıkış durumu

Çoğu programlama dilinde koşul bir ifadenin değeridir. Kabukta ise koşul **bir komutun çıkış
durumudur**: 0 doğru, sıfırdan farklı her değer yanlış kabul edilir. `if` bir ifade değil, bir komut
listesi alır; listenin son komutunun durumu dalı belirler.

```bash
if grep -q 'HATA' /var/log/sensor.log; then
    echo "günlükte hata var"
elif [ -s /var/log/sensor.log ]; then
    echo "günlük dolu, hata yok"
else
    echo "günlük boş"
fi
```

`&&` ve `||` aynı ilkeyle çalışır: `a && b` yalnızca a başarılıysa b'yi, `a || b` yalnızca a başarısızsa
b'yi çalıştırır. `!` bir komutun durumunu tersine çevirir. Kısa denetimler için yaygın kalıplar
`[ -d "$dizin" ] || mkdir -p "$dizin"` ve `cd "$hedef" || exit 1` biçimindedir.

!!! dikkat "`a && b || c` bir üçlü işleç değildir"
    Bu yazım "a doğruysa b, değilse c" gibi görünür, ancak **b başarısız olursa c de çalışır**:
    `[ "$x" = 1 ] && false || echo "b çalıştı"` satırı, koşul doğru olduğu halde son komutu çalıştırır.
    b'nin başarısız olabileceği her durumda açık bir `if … then … else … fi` kullanılmalıdır.

## 6.2 Sınama komutları: test, [ ], [[ ]], (( ))

Koşullarda kullanılan sınamaların çoğu `test` komutu tarafından yapılır. `[` aynı komutun diğer adıdır
ve son argüman olarak `]` bekler; bu nedenle `[` sonrasında ve `]` öncesinde boşluk zorunludur:
`[ -f "$f" ]`. bash bunlara ek olarak bir anahtar sözcük olan `[[ ]]` ve aritmetik için `(( ))`
sunar.

| Sınama | Doğru olduğu durum | Sınama | Doğru olduğu durum |
|---|---|---|---|
| `-e f` | f vardır | `-z s` | s boş dizgidir |
| `-f f` / `-d f` | Düzenli dosya / dizin | `-n s` | s boş değildir |
| `-L f` | Sembolik bağlantı | `s1 = s2` / `s1 != s2` | Dizgiler eşit / farklı |
| `-r f` `-w f` `-x f` | Okunabilir / yazılabilir / yürütülebilir | `n1 -eq n2` | Tam sayılar eşit (`-ne -lt -le -gt -ge`) |
| `-s f` | Boyutu sıfırdan büyük | `f1 -nt f2` | f1, f2'den daha yeni |

`[ ]` sıradan bir komut olduğu için argümanları her zamanki genişletmelerden geçer. Tırnaksız boş bir
değişken argüman listesinden kaybolur ve `[ = evet ]` gibi geçersiz bir ifade oluşur. `[[ ]]` ise
ayrıştırıcı tarafından tanınır; içinde sözcük bölme ve glob yapılmaz, `&&`, `||` ve gruplama doğrudan
yazılabilir. Ayrıca iki yeni işleç ekler: sağ tarafı tırnaksız bir glob kalıbı olan `==` ve ERE ile
eşleştiren `=~`. Eşleşmede yakalanan gruplar `BASH_REMATCH` dizisine yazılır.

| | `[ ]` / `test` | `[[ ]]` | `(( ))` |
|---|---|---|---|
| Tür | Komut (POSIX) | Anahtar sözcük (bash, ksh) | Aritmetik (bash) |
| Değişkenlerin tırnaklanması | Zorunlu | Gerekmez (sağ tarafta kalıp için anlamlı) | `$` bile gerekmez |
| `<` `>` | Yönlendirme! (`\<` gerekir) | Dizgi karşılaştırması | Sayı karşılaştırması |
| Kalıp / düzenli ifade | Yok | `==` glob, `=~` ERE | Yok |
| Mantık işleçleri | Ayrı komutlarla: `[ a ] && [ b ]` | `&&`, <code>&#124;&#124;</code>, `!`, `( )` | `&&`, <code>&#124;&#124;</code>, `!` |

`[ ]` içindeki `-a` ve `-o` işleçleri belirsiz durumlara yol açtığı için POSIX tarafından eskimiş
kabul edilir; yerine iki ayrı sınama `&&` ile bağlanır. Hedef cihazdaki BusyBox ash `[[ ]]`'yi derleme
seçeneğine bağlı olarak destekleyebilir (Bölüm 8); dash desteklemez.

<div class="terminal" data-oturum="kosullar"></div>

## 6.3 case: kalıp eşleştirmesi

`case`, bir değeri sırayla glob kalıplarıyla karşılaştırır ve **ilk eşleşen** dalı çalıştırır. Kalıplar
`|` ile birleştirilebilir; `*)` varsayılan daldır. `case` POSIX'tir ve dizgi karşılaştırmalarını
`[[ == ]]` olmadan taşınabilir biçimde yapmanın yoludur. Gömülü betiklerde mimari, seçenek ve eylem
ayrımı için sık kullanılır:

```sh
case $(uname -m) in
    aarch64|arm64) mimari=arm64 ;;
    armv7*)        mimari=arm ;;
    x86_64)        mimari=x86-64 ;;
    *)             echo "desteklenmeyen mimari: $(uname -m)" >&2; exit 1 ;;
esac
```

Her dal `;;` ile biter. bash ayrıca `;&` (sonraki dalın gövdesine düş) ve `;;&` (sonraki kalıpları da
sına) sonlandırıcılarını sunar. Kalıplar tırnak içine alınırsa düz metin olarak karşılaştırılır:
`"*")` yalnızca yıldız karakterine eşleşir.

## 6.4 Döngüler

Kabukta üç döngü türü vardır. `for ad in liste` bir sözcük listesi üzerinde döner; liste verilmezse
`"$@"` kullanılır. `while komut` komut başarılı oldukça, `until komut` komut başarısız oldukça döner.
bash ayrıca C tarzı `for (( i = 0; i < n; i++ ))` sunar. `break n` ve `continue n` iç içe döngülerde
n düzey dışarıya etki eder.

```bash
for f in /etc/init.d/*; do              # glob: boşluklu adlar korunur
    [ -x "$f" ] || continue
    echo "servis: ${f##*/}"
done

deneme=0
until ping -c1 -W1 192.168.7.10 >/dev/null 2>&1; do   # PLC erişilebilir olana kadar
    (( ++deneme >= 30 )) && { echo "PLC yanıt vermiyor" >&2; exit 1; }
    sleep 1
done
```

### Satır satır okuma

Bir dosyayı veya komut çıktısını satır satır işlemenin doğru kalıbı şudur:

```bash
while IFS= read -r satir; do
    printf '%s\n' "$satir"
done < dosya
```

Kalıbın her parçasının bir görevi vardır. `IFS=` satır başı ve sonundaki boşlukların kırpılmasını
engeller; `-r` ters eğik çizgilerin kaçış karakteri olarak yorumlanmasını engeller; girdinin `done`
sonrasında yönlendirilmesi döngünün **mevcut kabukta** çalışmasını sağlar. Dosyanın son satırında satır
sonu yoksa `read` o satırı okur ama başarısız döner; `|| [ -n "$satir" ]` eki son satırın da
işlenmesini sağlar. `for satir in $(cat dosya)` biçimi ise satırları değil sözcükleri verir ve glob
uygular; kullanılmamalıdır.

`read` birden çok değişkenle alanları ayırabilir: `IFS=: read -r ad x uid gid _ <<< "$satir"`. Son
değişken satırın kalanını alır. NUL ile ayrılmış listeler `read -r -d ''` ile okunur:
`while IFS= read -r -d '' f; do …; done < <(find . -name '*.conf' -print0)`.

### Borudaki döngü ve alt kabuk

`komut | while read …` biçimi çok yaygındır, ancak Bölüm 4'te belirtildiği gibi borunun her öğesi ayrı
bir süreçte çalışır. Döngü bir **alt kabukta** çalıştığı için döngü içinde atanan değişkenler döngü
bitince kaybolur:

<div class="akis" data-senaryo="boru-alt-kabuk"></div>

<div class="terminal" data-oturum="dongu-alt-kabuk"></div>

Üç çözüm vardır: girdinin süreç ikamesiyle verilmesi (`done < <(komut)`, bash), betiklerde
`shopt -s lastpipe` (bash 4.2+, iş denetimi kapalıyken) ve POSIX sh'de komut çıktısının önce bir
dosyaya veya değişkene alınıp here-doc ile verilmesi. Hata dosyası ile döngü arasında bir bağımlılık
yoksa sorunun hiç ortaya çıkmaması için döngüde değişken atamak yerine çıktı üretilmesi de bir
seçenektir.

## 6.5 Diziler

bash iki tür dizi sunar: tam sayı indisli **diziler** ve dizgi anahtarlı **ilişkisel diziler** (bash 4.0+).
POSIX sh'de dizi yoktur; tek liste olarak konumsal parametreler (`set -- …`, `"$@"`) kullanılabilir.

| İşlem | Dizi | İlişkisel dizi |
|---|---|---|
| Tanım | `a=(x 'y z')` | `declare -A m=([anahtar]=değer)` (declare zorunlu) |
| Öğe atama | `a[3]=w`, `a+=(v)` | `m[ad]=değer` |
| Öğe okuma | `"${a[0]}"`, `"${a[-1]}"` | `"${m[ad]}"` |
| Tüm öğeler | `"${a[@]}"` | `"${m[@]}"` (sırasız) |
| İndisler / anahtarlar | `"${!a[@]}"` | `"${!m[@]}"` (sırasız) |
| Öğe sayısı | `${#a[@]}` | `${#m[@]}` |
| Silme | `unset 'a[1]'` | `unset 'm[ad]'` |
| Varlık sınaması | `[[ -v a[3] ]]` | `[[ -v m[ad] ]]` |

`"${a[@]}"` her öğeyi ayrı ve bütün bir sözcük olarak verir; boşluk içeren öğeler korunur.
`"${a[*]}"` öğeleri tek dizgide birleştirir; tırnaksız kullanım ise yeniden sözcük bölmeye yol açar.
Bu ayrım dizilerin en önemli kullanımını mümkün kılar: **komut argümanlarını güvenle oluşturmak**.
Seçenekleri bir dizgide biriktirip tırnaksız genişletmek boşluklu değerleri bozar; dizi ise her
argümanı ayrı tutar:

```bash
secenekler=(-czf "$arsiv")
[[ $ayrintili == 1 ]] && secenekler+=(-v)
secenekler+=(--exclude='*.tmp' -C "$kaynak_dizin" .)
tar "${secenekler[@]}"
```

`mapfile -t dizi < dosya` (eşdeğeri `readarray`) dosyanın her satırını bir öğeye okur.

<div class="terminal" data-oturum="diziler"></div>

## 6.6 Fonksiyonlar

Fonksiyon, bir ada bağlanmış komut grubudur ve bir komut gibi çağrılır. POSIX biçimi `ad() { …; }`
şeklindedir; bash'in `function ad { …; }` biçimi taşınabilir değildir. Fonksiyonun argümanları
çağrı sırasında `$1`, `$2`, …, `"$@"` ve `$#` ile okunur; `$0` değişmez.

Bir fonksiyonun çağırana bilgi döndürmesinin iki ayrı yolu vardır ve karıştırılmamalıdır:

- **Dönüş değeri** (`return n`, 0–255): yalnızca başarı veya başarısızlığı bildirir. `return`
  kullanılmazsa son komutun durumu döner. Bu sayede fonksiyon doğrudan `if` koşulunda kullanılabilir.
- **Çıktı**: veri standart çıktıya yazılır ve çağıran tarafından komut ikamesiyle alınır:
  `sonuc=$(hesapla 84 4)`. Komut ikamesi alt kabukta çalıştığından fonksiyonun bu çağrıdaki
  değişken atamaları çağırana yansımaz.

Fonksiyon içinde atanan değişkenler varsayılan olarak **geneldir** ve çağıranın değişkenlerinin
üzerine yazar. `local` (bash, dash ve BusyBox ash'te bulunur; POSIX'te tanımlı değildir) değişkeni
fonksiyona özel yapar. bash **dinamik kapsam** kullanır: bir fonksiyonun yerel değişkeni, onun
çağırdığı fonksiyonlar tarafından da görülür. Bu özellik bilinçli kullanıldığında bir fonksiyonun
çağıranın değişkenlerine sonuç yazmasını sağlar (`sensor-rapor.sh` içindeki `satir_coz`), bilinçsiz
kullanıldığında ise beklenmedik yan etkiler üretir.

<div class="terminal" data-oturum="fonksiyonlar"></div>

!!! dikkat "`local x=$(komut)` hatayı gizler"
    `local` kendisi bir komuttur ve durumu, atanan komut ikamesinin durumunu maskeler:
    `local x=$(false)` başarılı döner. Komutun durumu önemliyse bildirim ve atama ayrılmalıdır:
    `local x; x=$(komut) || return`. Aynı durum `export x=$(komut)` ve `readonly` için de geçerlidir
    (ShellCheck uyarısı SC2155, Bölüm 7).

Kitabın örneklerindeki `examples/06-kosul-dongu/sensor-rapor.sh` betiği bu bölümün tüm yapılarını bir
arada kullanır: `while IFS= read -r` ile satır okuma, `[[ =~ ]]` ve `BASH_REMATCH` ile ayrıştırma,
ilişkisel dizilerle sensör başına sayaçlar, ondalıklı değerlerin tam sayı aritmetiğiyle işlenmesi
(`ondaya_cevir` fonksiyonu) ve `case` ile dönüş değerine göre dallanma.

## 6.7 BitBake görevlerinde denetim yapıları

Tariflerin kabuk görevleri `/bin/sh` ile çalıştığından (Bölüm 8) bu bölümün POSIX kısmı
kullanılabilir: `if`, `case`, `for`, `while`, `[ ]` ve fonksiyonlar. Diziler, `[[ ]]`, `(( ))` ve
süreç ikamesi kullanılamaz. Örnek:

```bitbake
do_install() {
    install -d ${D}${sysconfdir}/ornek
    for f in ${S}/conf/*.conf; do
        [ -e "$f" ] || continue                       # eşleşme yoksa kalıp olduğu gibi kalır
        install -m 0644 "$f" ${D}${sysconfdir}/ornek/
    done
    case "${TARGET_ARCH}" in
        aarch64) install -m 0644 ${S}/arm64.conf ${D}${sysconfdir}/ornek/mimari.conf ;;
        *)       install -m 0644 ${S}/genel.conf ${D}${sysconfdir}/ornek/mimari.conf ;;
    esac
}
```

Kabuk koşulu yerine çoğu zaman BitBake düzeyinde seçim yapmak daha temizdir: geçersiz kılmalar
(`SRC_URI:append:aarch64`) veya `${@bb.utils.contains(...)}` ifadeleri değeri derleme anında belirler
ve görev imzasına (sstate) doğru biçimde yansır
(bkz. <a href="../../yocto-gomulu-linux/bolumler/05-bitbake-dili.html">Yocto kitabı, Bölüm 5</a>).

!!! lab "Uygulama 6.1 · Sensör raporunun genişletilmesi"
    `examples/06-kosul-dongu/sensor-rapor.sh` betiğini `examples/03-metin-isleme/veri/sensor.log`
    ile çalıştırın ve aşağıdaki değişiklikleri yapın:

    1. Raporun sonuna **en uzun kesinti**yi ekleyin: aynı sensörün art arda iki ölçümü arasındaki en
       uzun süre (saniye). Zaman damgasındaki `HH:MM:SS` kısmını `IFS=: read -r` ile parçalayın;
       başında sıfır olan değerler için `10#` önekini kullanmayı unutmayın.
    2. `-s sensorN` seçeneği ekleyin: verilirse yalnızca o sensörün satırları işlensin. Seçeneği
       `case "$1" in` ile ayrıştırın.
    3. Eşik aşımlarını bir dizide biriktiren mevcut kodun, boşluk içeren açıklama metinleriyle de doğru
       çalıştığını `printf '%s\n' "${esik_asimi[@]}"` ile doğrulayın.
    4. Betiği `bash -x` ile çalıştırarak `satir_coz` fonksiyonunun dönüş değerlerini izleyin.

## Özet

- Kabukta koşul bir komutun çıkış durumudur; `if`, `while`, `&&`, `||` buna dayanır. `a && b || c` bir üçlü işleç değildir.
- `[ ]` bir komuttur ve değişkenler tırnaklanmalıdır; `[[ ]]` bash anahtar sözcüğüdür, `==` glob ve `=~` ERE eşleştirmesi sunar; sayılar için `(( ))` veya `-lt` kullanılır.
- `case` taşınabilir kalıp eşleştirmesidir ve ilk eşleşen dalı çalıştırır.
- Satırlar `while IFS= read -r satir; do …; done < dosya` ile okunur; `for x in $(cat …)` kullanılmaz.
- Borudaki döngü alt kabukta çalışır; değişkenleri korumak için `< <(komut)` veya `lastpipe` kullanılır.
- `"${dizi[@]}"` öğeleri bütün olarak verir; komut argümanları dizide oluşturulur. İlişkisel diziler `declare -A` ister ve sırasızdır.
- Fonksiyonlar başarıyı `return` ile, veriyi çıktı ile döndürür; `local` kullanılmalı, `local x=$(…)` hatayı gizler.

## Değerlendirme soruları

<div class="quiz" data-id="b06-1">
<p class="quiz-soru"><code>surum=""; [ $surum = 2 ] &amp;&amp; echo ikinci</code> satırı "unary operator expected" hatası veriyor. En iyi düzeltme hangisidir?</p>
<ul>
<li><code>[ $surum == 2 ]</code></li>
<li data-dogru><code>[ "$surum" = 2 ]</code> (veya bash'te <code>[[ $surum = 2 ]]</code>)</li>
<li><code>[ $surum -eq "2" ]</code></li>
<li><code>test $surum = 2</code></li>
</ul>
<p class="quiz-aciklama">Tırnaksız boş değişken argüman listesinden kaybolur ve <code>[ = 2 ]</code> oluşur. Tırnak boş bir argümanı korur. <code>[[ ]]</code> içinde sözcük bölme yapılmadığı için tırnak gerekmez.</p>
</div>

<div class="quiz" data-id="b06-2">
<p class="quiz-soru"><code>[[ 10 &lt; 9 ]]</code> ifadesinin sonucu nedir?</p>
<ul>
<li>Yanlış; 10, 9'dan büyüktür</li>
<li data-dogru>Doğru; <code>[[ ]]</code> içinde <code>&lt;</code> sözlük sırasıyla dizgi karşılaştırır ve "1" karakteri "9"dan önce gelir</li>
<li>Sözdizimi hatası</li>
<li><code>&lt;</code> bir yönlendirmedir ve 9 adlı dosyayı okur</li>
</ul>
<p class="quiz-aciklama">Sayısal karşılaştırma için <code>(( 10 &lt; 9 ))</code> veya <code>[ 10 -lt 9 ]</code> kullanılmalıdır. <code>[ ]</code> içinde ise <code>&lt;</code> gerçekten bir yönlendirme olurdu.</p>
</div>

<div class="quiz" data-id="b06-3">
<p class="quiz-soru">Aşağıdaki kodun çıktısı nedir? <code>n=0; printf 'a\nb\n' | while read -r s; do n=$((n+1)); done; echo $n</code></p>
<ul>
<li>2</li>
<li data-dogru>0</li>
<li>1</li>
<li>Hata verir</li>
</ul>
<p class="quiz-aciklama">while döngüsü borunun sağ tarafında olduğu için alt kabukta çalışır; artırımlar alt kabukla birlikte kaybolur. <code>done &lt; &lt;(printf ...)</code> ile döngü ana kabukta çalışır ve 2 yazılır.</p>
</div>

<div class="quiz" data-id="b06-4">
<p class="quiz-soru"><code>dosyalar=("a b.log" c.log)</code> dizisindeki dosyaları <code>rm</code>'ye doğru biçimde vermek için hangi yazım kullanılmalıdır?</p>
<ul>
<li><code>rm ${dosyalar[@]}</code></li>
<li><code>rm "${dosyalar[*]}"</code></li>
<li data-dogru><code>rm -- "${dosyalar[@]}"</code></li>
<li><code>rm $dosyalar</code></li>
</ul>
<p class="quiz-aciklama">Tırnaklı <code>[@]</code> her öğeyi ayrı bir argüman olarak verir. <code>[*]</code> tek argümanda birleştirir ("a b.log c.log" adlı tek dosya), tırnaksız biçim yeniden böler, <code>$dosyalar</code> yalnızca ilk öğeyi verir.</p>
</div>

<div class="quiz" data-id="b06-5">
<p class="quiz-soru">Bir fonksiyonun hesapladığı 1500 değerini çağırana döndürmenin doğru yolu hangisidir?</p>
<ul>
<li><code>return 1500</code> ve ardından <code>$?</code></li>
<li data-dogru>Değeri <code>echo</code> ile yazmak ve <code>sonuc=$(fonksiyon)</code> ile almak</li>
<li><code>exit 1500</code></li>
<li><code>local sonuc=1500</code> tanımlayıp çağıranda <code>$sonuc</code> okumak</li>
</ul>
<p class="quiz-aciklama">Dönüş değeri 0–255 aralığındadır (1500 mod 256 = 220 olur) ve başarı bildirimi içindir. <code>local</code> değişken fonksiyon bitince kaybolur; <code>exit</code> tüm betiği sonlandırır.</p>
</div>

!!! alistirma "Alıştırma: Sürüm karşılaştırma fonksiyonu"
    `surum_buyuk_esit A B` adlı bir bash fonksiyonu yazın: noktalı sürüm numaralarını (ör. BusyBox
    `1.36.1` ile `1.4`) parça parça sayısal olarak karşılaştırsın, A ≥ B ise 0, değilse 1 döndürsün.
    Eksik parçalar 0 sayılsın (`2.0` = `2.0.0`) ve başında sıfır olan parçalar (`1.08`) hata vermesin.
    Fonksiyonu `1.36.1 1.4`, `1.4 1.36.1`, `2.0 2.0.0`, `5.10 5.9` çiftleriyle sınayın.

    ??? success "Örnek çözüm"
        ```bash
        surum_buyuk_esit() {
            local -a a b
            local i n
            IFS=. read -r -a a <<< "$1"
            IFS=. read -r -a b <<< "$2"
            n=$(( ${#a[@]} > ${#b[@]} ? ${#a[@]} : ${#b[@]} ))
            for (( i = 0; i < n; i++ )); do
                (( 10#${a[i]:-0} > 10#${b[i]:-0} )) && return 0
                (( 10#${a[i]:-0} < 10#${b[i]:-0} )) && return 1
            done
            return 0
        }

        for cift in "1.36.1 1.4" "1.4 1.36.1" "2.0 2.0.0" "5.10 5.9"; do
            read -r x y <<< "$cift"
            if surum_buyuk_esit "$x" "$y"; then echo "$x >= $y"; else echo "$x <  $y"; fi
        done
        # 1.36.1 >= 1.4
        # 1.4 <  1.36.1
        # 2.0 >= 2.0.0
        # 5.10 >= 5.9
        ```

        Sözlük sırasıyla karşılaştırma (`[[ 1.36.1 > 1.4 ]]`) yanlış sonuç verir; parçalar sayı olarak
        karşılaştırılmalıdır. `${a[i]:-0}` eksik parçayı 0 yapar, `10#` öneki sekizli yorumu engeller.
        GNU coreutils bulunan sistemlerde `sort -V` da sürüm sıralaması yapar.

**Sonraki bölüm:** [7 · Sağlam betikler: hata yönetimi, trap, getopts, ShellCheck →](07-saglam-betikler.md)
