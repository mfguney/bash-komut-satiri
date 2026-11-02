# 4 · Yönlendirme, borular, süreçler ve sinyaller

<div class="kunye" markdown>
<span>Süre: ~55 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 1–3</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Dosya tanımlayıcı tablosunu ve standart akışları (0, 1, 2) açıklayabilirsiniz.
    - Yönlendirme işleçlerinin soldan sağa uygulanmasını ve `>f 2>&1` ile `2>&1 >f` arasındaki farkı açıklayabilirsiniz.
    - Here-doc, here-string ve süreç ikamesini doğru yerde kullanabilirsiniz.
    - Bir boru hattının süreçlerini, tamponlamayı, SIGPIPE'ı ve çıkış durumunu (`PIPESTATUS`, `pipefail`) açıklayabilirsiniz.
    - fork, exec ve wait adımlarını; alt kabuk ile komut grubunun farkını açıklayabilirsiniz.
    - İş denetimi komutlarını ve sinyalleri kullanabilir, bir süreci terminalden bağımsız çalıştırabilirsiniz.

## 4.1 Dosya tanımlayıcıları

Bir süreç bir dosyayı, boruyu, soketi veya terminali açtığında çekirdek ona küçük bir tamsayı verir:
**dosya tanımlayıcısı** (*file descriptor*, fd). Süreç daha sonra `read(3, …)` veya `write(1, …)` gibi
çağrılarda bu sayıyı kullanır. Çekirdek her süreç için bir **fd tablosu** tutar; tablodaki her girdi,
dosya konumu (*offset*) ve açılış kipini içeren bir **açık dosya kaydını** gösterir, kayıt da
dosyanın inode'unu gösterir.

Geleneksel olarak ilk üç tanımlayıcının sabit bir anlamı vardır:

| fd | Ad | Varsayılan | Kullanım |
|---|---|---|---|
| 0 | Standart girdi (stdin) | Terminal | Programın okuduğu veri |
| 1 | Standart çıktı (stdout) | Terminal | Programın ürettiği **sonuç** |
| 2 | Standart hata (stderr) | Terminal | Tanılama, uyarı ve hata iletileri |

Standart hatanın ayrı bir akış olması tasarımın en önemli parçasıdır: bir boru hattında sonuçlar bir
sonraki programa akarken hata iletileri ekranda kalır ve veriye karışmaz. Bu kurala uyan betikler
yazmak, yani tanılama iletilerini `>&2` ile standart hataya yazmak, betiğin başka araçlarla
birleştirilebilmesi için gereklidir.

Tanımlayıcılar **kalıtımla** geçer: bir süreç yeni bir süreç başlattığında çocuk, ebeveynin fd
tablosunun bir kopyasını alır. Kabuktan başlatılan her programın terminale yazabilmesinin nedeni budur.
Linux'ta bir sürecin tablosu `/proc/<pid>/fd` dizininde sembolik bağlantılar olarak görülür;
`examples/04-yonlendirme/fd-goster.sh` betiği kendi tablosunu bu dizinden okuyarak yazar.

## 4.2 Yönlendirme

Yönlendirme, kabuğun bir komutu çalıştırmadan **önce** onun fd tablosunu değiştirmesidir. Program
yönlendirmeden haberdar değildir; yalnızca fd 1'e yazar ve verinin dosyaya mı terminale mi gittiğini
bilmez.

| İşleç | Anlamı | Not |
|---|---|---|
| `< dosya` | fd 0'ı dosyadan okumak üzere aç | |
| `> dosya` | fd 1'i dosyaya bağla; dosya varsa **boşalt** | `set -o noclobber` ile korunabilir; `>|` zorlar |
| `>> dosya` | fd 1'i dosyaya, sonuna eklemek üzere bağla | |
| `2> dosya`, `2>> dosya` | Aynısı, fd 2 için | `n>` her tanımlayıcı için geçerlidir |
| `2>&1` | fd 2, fd 1'in **o anki** hedefinin kopyası olsun | `dup2(1, 2)` çağrısı |
| `&> dosya` | fd 1 ve 2'yi aynı dosyaya bağla | bash'e özgü; POSIX karşılığı `> dosya 2>&1` |
| `n<&-`, `n>&-` | n numaralı tanımlayıcıyı kapat | |
| `<> dosya` | Okuma ve yazma için aç | Seri port gibi aygıtlarda kullanışlıdır |

Yönlendirmeler **soldan sağa** uygulanır ve `2>&1` bir bağlantı değil, kopyalamadır: fd 2, fd 1'in
o anda gösterdiği yeri gösterir; fd 1 daha sonra değişirse fd 2 bundan etkilenmez. Bu nedenle aşağıdaki
iki komut farklı sonuç verir:

```bash
komut > cikti.log 2>&1     # önce fd1 dosyaya, sonra fd2 = fd1 → ikisi de dosyada
komut 2>&1 > cikti.log     # önce fd2 = fd1 (terminal), sonra fd1 dosyaya → hatalar terminalde
```

<div class="akis" data-senaryo="fd-tablosu"></div>

Aynı durum gerçek bir tablo üzerinde aşağıda gösterilmiştir. Son adımlardaki `exec`, komut verilmeden
kullanıldığında yönlendirmeyi kabuğun kendi tablosuna kalıcı olarak uygular; bir betiğin tüm çıktısını
bir günlük dosyasına yönlendirmek için `exec >>"$GUNLUK" 2>&1` satırı betiğin başına yazılabilir.

<div class="terminal" data-oturum="fd-yonlendirme"></div>

!!! dikkat "`> dosya` dosyayı komut çalışmadan boşaltır"
    `sort sensor.log > sensor.log` komutu boş bir dosya üretir: kabuk önce `sensor.log`'u boşaltarak
    açar, sonra `sort` boş dosyayı okur. Aynı dosyayı okuyup yazmak için sonuç geçici bir dosyaya
    yazılıp taşınmalıdır (`sort sensor.log > sensor.log.yeni && mv sensor.log.yeni sensor.log`) veya
    bunu kendisi yapan araçlar kullanılmalıdır (`sort -o sensor.log sensor.log`, `sed -i`).

### Here-doc, here-string ve süreç ikamesi

**Here-doc** (`<<SONLANDIRICI`), betiğin içindeki bir metin bloğunu komutun standart girdisi yapar.
Yapılandırma dosyası üretmek, çok satırlı ileti yazmak veya etkileşimli bir programa komut vermek için
kullanılır. Sonlandırıcı tırnak içine alınırsa (`<<'EOF'`) blokta genişletme yapılmaz; `<<-EOF` biçimi
satır başlarındaki **sekme** karakterlerini (boşlukları değil) siler ve girintili yazıma izin verir.

**Here-string** (`<<< "metin"`, bash) tek bir dizgiyi girdi yapar. **Süreç ikamesi** (`<(komut)`,
`>(komut)`, bash) ise bir komutun çıktısını veya girdisini **dosya adı** olarak sunar; dosya adı
bekleyen ve borudan okuyamayan araçlar (`diff`, `comm`, `paste`) için kullanışlıdır. Her ikisi de POSIX
sh'de bulunmaz.

## 4.3 Borular

`komut1 | komut2` yazıldığında kabuk çekirdekten bir **boru** (*pipe*) ister: bir yazma ve bir okuma
ucu olan, çekirdek içinde tutulan bir tampon. komut1'in fd 1'i yazma ucuna, komut2'nin fd 0'ı okuma
ucuna bağlanır ve **iki süreç aynı anda** başlatılır. Bir boru hattı sıralı değil eşzamanlı çalışır;
`sort` gibi tüm girdiyi okuması gereken bir araç ise doğası gereği girdisi bitene kadar bekler.

<div class="akis" data-senaryo="boru-akisi"></div>

Borunun davranışını üç kural belirler:

1. **Akış denetimi:** Linux'ta borunun kapasitesi varsayılan olarak 64 KiB'tır. Tampon dolduğunda
   yazan süreç, okuyan süreç veri alana kadar bekletilir; boşken okuyan süreç bekletilir.
2. **Dosya sonu (EOF):** Okuyan süreç, borunun **tüm** yazma uçları kapandığında EOF alır. Yazma
   ucunu açık tutan bir süreç kalırsa okuyucu sonsuza kadar bekler.
3. **SIGPIPE:** Okuyucu çıktıktan sonra boruya yazan süreç `SIGPIPE` sinyaliyle sonlandırılır.
   `yes | head -n 2` komutunda `yes`'in bu biçimde, 128 + 13 = 141 durumuyla bittiği görülür. Bu bir
   hata değil, boru hattının erken bitmesinin olağan yoludur.

Boru hattının çıkış durumu **son komutun** durumudur. Önceki komutların durumları bash'in `PIPESTATUS`
dizisinde tutulur ve bir sonraki komutta üzerine yazılır. `set -o pipefail` etkinken hattın durumu,
sıfırdan farklı durumla biten en sağdaki komutun durumu olur; bu seçenek Bölüm 7'de sağlam betiklerin
temel parçalarından biri olarak ele alınacaktır. `komut |& komut2` ise bash'te `2>&1 |` kısaltmasıdır.

<div class="terminal" data-oturum="boru-pipestatus"></div>

!!! sss "`tail -f günlük | grep HATA | tee hatalar.txt` neden hemen çıktı vermiyor?"
    C kitaplığı, standart çıktı bir terminal olduğunda satır satır, **bir boru veya dosya olduğunda ise
    bloklar halinde** (genellikle 4–64 KiB) tamponlar. Ortadaki `grep` çıktısını boruya yazdığı için
    eşleşmeler tampon dolana kadar bekler. Çözüm, ilgili aracın satır tamponlama seçeneğini
    (`grep --line-buffered`, `sed -u`) veya GNU coreutils'in `stdbuf -oL komut` aracını kullanmaktır.
    Aynı etki, BitBake veya bir test programının çıktısı CI'da `tee` ile kaydedilirken de görülür.

## 4.4 Süreçler: fork, exec, wait

Unix'te yeni bir program iki ayrı adımda başlatılır. Önce **fork** (Linux'ta `clone` sistem çağrısı)
çağıran sürecin bir kopyasını oluşturur: aynı bellek görüntüsü (yazınca-kopyala ile), aynı
değişkenler, aynı fd tablosu. Ardından çocuk süreç **exec** (`execve`) ile kendi bellek görüntüsünü
yeni programla değiştirir; PID'i ve açık tanımlayıcıları korunur. Ebeveyn ise **wait** (`wait4`) ile
çocuğun bitmesini bekler ve çıkış durumunu toplar.

Bu ayrım, yönlendirmenin nasıl çalıştığını da açıklar: kabuk fork'tan sonra, exec'ten önce, yalnızca
çocuğun fd tablosunu değiştirir. Ebeveynin tablosu etkilenmez.

<div class="akis" data-senaryo="fork-exec-wait"></div>

Biten bir süreç, ebeveyni durumunu okuyana kadar süreç tablosunda **zombi** (`Z`) olarak kalır; zombi
hiçbir kaynak kullanmaz ama bir PID tutar. Ebeveyni önce biten süreç **öksüz** kalır ve PID 1'e (veya
bir "subreaper" sürecine) bağlanır; PID 1 bu çocukları toplamakla yükümlüdür. Gömülü sistemlerde
kendi init betiğini PID 1 olarak çalıştıran ürünlerde zombi birikmesinin nedeni çoğu zaman budur.

<div class="terminal" data-oturum="fork-exec-wait"></div>

### Alt kabuk ve komut grubu

Parantez içindeki komutlar `( … )` bir **alt kabukta**, yani fork ile oluşturulmuş bir kopyada
çalışır; içerideki `cd`, değişken ataması veya `exit` dışarıyı etkilemez. Kıvrık ayraç `{ …; }` ise
komutları **mevcut kabukta** gruplar; yönlendirmeyi topluca uygulamak için kullanılır. Kapanış
ayracından önce `;` veya satır sonu bulunmalıdır.

```bash
(cd build && make)                 # cd yalnızca alt kabukta; çağıran dizin değişmez
{ date; uname -r; } > durum.txt    # iki komutun çıktısı tek yönlendirmeyle aynı dosyaya
```

Borunun her öğesi, komut satırı ve komut ikamesi `$( … )` da alt kabukta çalışır. Bölüm 6'da bunun
`while read` döngülerindeki önemli bir sonucu ele alınacaktır. `$$` her zaman ana kabuğun PID'ini
verir; alt kabuğun kendi PID'i bash'te `$BASHPID` ile okunur.

## 4.5 İş denetimi

Etkileşimli kabuk, başlattığı her boru hattını bir **iş** (*job*) olarak izler. Her iş ayrı bir
**süreç grubudur**; terminalin o anda ön planda olan grubu, klavyeden gelen Ctrl-C ve Ctrl-Z
sinyallerini alır.

| Komut / tuş | İşlevi |
|---|---|
| `komut &` | İşi arka planda başlat; `$!` son arka plan sürecinin PID'idir |
| ++ctrl+z++ | Ön plandaki işi durdur (`SIGTSTP`) |
| `jobs -l` | İşleri numara, PID ve durumla listele |
| `fg %n` / `bg %n` | n numaralı işi ön plana al / arka planda sürdür |
| `wait [%n]` | İşin (veya tüm arka plan işlerinin) bitmesini bekle; durumunu döndür |
| `disown %n` | İşi kabuğun listesinden çıkar; kabuk kapanırken SIGHUP gönderilmez |

`%1`, `%+` (son iş) ve `%dizgi` (dizgiyle başlayan iş) biçimleri `kill`, `fg`, `bg` ve `wait`
komutlarında PID yerine kullanılabilir. İş denetimi varsayılan olarak yalnızca etkileşimli kabukta
açıktır; betiklerde arka plan süreçleri `$!` ile saklanıp `wait "$pid"` ile beklenir.

## 4.6 Sinyaller

**Sinyal**, çekirdeğin veya bir sürecin başka bir sürece gönderdiği eşzamansız bir bildirimdir. Her
sinyalin bir varsayılan eylemi vardır (sonlandır, durdur, sürdür, yok say); süreç çoğu sinyal için
kendi işleyicisini tanımlayabilir. Aşağıdaki numaralar x86 ve ARM üzerindeki Linux içindir; bazı
mimarilerde (ör. MIPS) farklıdır, bu nedenle betiklerde numara yerine ad kullanılmalıdır.

| Sinyal | No | Varsayılan | Tipik kaynak ve kullanım |
|---|---|---|---|
| `SIGHUP` | 1 | Sonlandır | Terminal kapandı; servislerde "yapılandırmayı yeniden oku" anlamında kullanılır |
| `SIGINT` | 2 | Sonlandır | Ctrl-C |
| `SIGQUIT` | 3 | Çekirdek dökümü | Ctrl-\\ |
| `SIGKILL` | 9 | Sonlandır | **Yakalanamaz**, yok sayılamaz; son çare |
| `SIGUSR1`, `SIGUSR2` | 10, 12 | Sonlandır | Uygulamaya özel (ör. durum yaz, günlüğü yeniden aç) |
| `SIGPIPE` | 13 | Sonlandır | Okuyucusu olmayan boruya yazma |
| `SIGTERM` | 15 | Sonlandır | `kill` varsayılanı; kibar sonlandırma isteği |
| `SIGCHLD` | 17 | Yok say | Çocuk süreç bitti veya durdu |
| `SIGCONT` | 18 | Sürdür | `fg`, `bg`, `kill -CONT` |
| `SIGSTOP`, `SIGTSTP` | 19, 20 | Durdur | `SIGSTOP` yakalanamaz; `SIGTSTP` Ctrl-Z'dir |

`kill -SİNYAL pid` bir sinyal gönderir (ad `SIG` öneki olmadan da yazılabilir); `kill -l` adları
listeler ve numarayı ada çevirir. `pkill ad` ve `killall ad` süreçleri adlarıyla bulur. Sinyalle
sonlanan bir sürecin kabuktaki durumu **128 + sinyal numarasıdır**: SIGINT için 130, SIGTERM için 143,
SIGKILL için 137. CI günlüğünde 137 durumu görülmesi, sürecin genellikle bellek yetersizliği nedeniyle
çekirdeğin OOM öldürücüsü tarafından sonlandırıldığına işaret eder.

Bir süreci durdurmanın doğru sırası şudur: önce `SIGTERM` gönderilir ve sürecin temizlik yapması için
birkaç saniye beklenir; süreç hâlâ çalışıyorsa `SIGKILL` gönderilir. Doğrudan `kill -9` kullanmak
geçici dosyaların, kilitlerin ve yarım yazılmış verilerin geride kalmasına yol açar. Kabuk betiklerinde
sinyaller `trap` ile yakalanır; aşağıdaki oturumdaki `sinyal-yakala.sh` betiği HUP, USR1 ve TERM
sinyallerini yakalayan bir servis benzetimidir. `trap` ayrıntılarıyla Bölüm 7'de ele alınacaktır.

<div class="terminal" data-oturum="is-denetimi-sinyaller"></div>

!!! iyi "Bekleyen bir betiğin sinyale hemen yanıt vermesi"
    bash, ön planda çalışan bir dış komut (ör. `sleep 60`) bitmeden trap işleyicisini çalıştırmaz.
    Uzun beklemeler içeren servis betiklerinde komut arka planda başlatılıp `wait` ile beklenir:
    `sleep "$ARALIK" & wait $!`. `wait` bir sinyal geldiğinde hemen döner ve işleyici gecikmeden
    çalışır. Bölüm 8'deki `sensor-izle` betiği bu kalıbı kullanır.

## 4.7 Terminalden bağımsız çalıştırma

Terminal kapandığında (SSH bağlantısı koptuğunda) çekirdek oturumun öncü sürecine, o da kendi işlerine
`SIGHUP` gönderir ve varsayılan eylem süreçleri sonlandırır. Uzun süren bir işin oturumdan bağımsız
sürmesi için birkaç yol vardır:

| Yöntem | Etkisi |
|---|---|
| `nohup komut > cikti.log 2>&1 &` | SIGHUP yok sayılır; çıktı yönlendirilmezse `nohup.out` dosyasına yazılır |
| `komut & disown` | bash iş listesinden çıkarır; kabuk kapanırken SIGHUP göndermez |
| `setsid komut` | Yeni bir oturum açar; süreç artık terminale bağlı değildir |
| `tmux`, `screen` | Terminal oturumunun kendisini sürdürür; yeniden bağlanılabilir |
| Servis yöneticisi | Cihazda kalıcı süreçler için doğru yol: systemd birimi veya init betiği (Bölüm 8) |

`timeout 30m komut` ise bir komutu belirli bir süre sonra `SIGTERM` ile sonlandırır ve bu durumda
124 döndürür; CI betiklerinde takılan testlerin tüm hattı kilitlemesini önlemek için kullanılır.

!!! lab "Uygulama 4.1 · Günlük akışının izlenmesi ve süreç ağacı"
    1. Bir terminalde ağ geçidinin günlüğünü taklit eden bir süreç başlatın:

        ```bash
        (while :; do echo "$(date +%T) sensor0 sicaklik=$((RANDOM % 10 + 20))"; sleep 1; done) > canli.log &
        ```

    2. Aynı terminalde `tail -f canli.log | grep --line-buffered 'sicaklik=2[89]' | tee yuksek.txt`
       hattını çalıştırın. `--line-buffered` olmadan `yuksek.txt` dosyasının neden geç dolduğunu
       gözlemleyin (Ctrl-C ile durdurup seçeneği kaldırarak yeniden deneyin).
    3. İlk terminalde `echo $$` ile kabuğun PID'ini öğrenin. İkinci bir terminalde
       `ps -o pid,ppid,pgid,stat,comm --ppid <kabuğun-PID>` ile süreçleri listeleyin; boru hattındaki
       üç sürecin aynı süreç grubunda (PGID) olduğunu doğrulayın.
    4. Hattı Ctrl-Z ile durdurun, `jobs` ile görün, `bg` ile arka planda sürdürün; ardından
       `kill %2` ve `kill %1` ile işleri sonlandırıp `wait` sonrasında durumlarını yazdırın.
    5. `examples/04-yonlendirme/boru-durum.sh` betiğini var olmayan bir dosyayla çalıştırın ve
       `grep` durumunun 2 olarak raporlandığını doğrulayın.

## Özet

- Her süreç bir fd tablosuna sahiptir; 0, 1 ve 2 standart girdi, çıktı ve hatadır. Tablo çocuk süreçlere kalıtımla geçer.
- Yönlendirmeler komut çalışmadan önce, soldan sağa uygulanır. `2>&1` o anki hedefin kopyasıdır; `>f 2>&1` ile `2>&1 >f` farklıdır.
- Here-doc metin bloğunu, here-string tek dizgiyi girdi yapar; süreç ikamesi bir komutun çıktısını dosya adı olarak sunar (bash).
- Boru hattındaki süreçler eşzamanlı çalışır; EOF tüm yazma uçları kapanınca gelir, okuyucusu olmayan yazar SIGPIPE alır.
- Hattın durumu son komutun durumudur; `PIPESTATUS` ve `pipefail` ara komutların hatasını görünür kılar.
- Program çalıştırma fork + exec + wait adımlarından oluşur; `( )` alt kabukta, `{ ; }` mevcut kabukta çalışır.
- Sinyalle sonlanan süreç 128 + numara döndürür. Önce SIGTERM, gerekirse SIGKILL gönderilir; kalıcı servisler için servis yöneticisi kullanılır.

## Değerlendirme soruları

<div class="quiz" data-id="b04-1">
<p class="quiz-soru"><code>derle.sh 2&gt;&amp;1 &gt; derleme.log</code> komutundan sonra hata iletileri nerede görünür?</p>
<ul>
<li>derleme.log dosyasında, çıktıyla birlikte</li>
<li data-dogru>Terminalde; yalnızca standart çıktı dosyaya gider</li>
<li>Hiçbir yerde; fd 2 kapatılır</li>
<li>Bash sözdizimi hatası verir</li>
</ul>
<p class="quiz-aciklama">Yönlendirmeler soldan sağa uygulanır. <code>2&gt;&amp;1</code> uygulandığında fd 1 hâlâ terminali gösterdiğinden fd 2 terminalin kopyası olur. Ardından yalnızca fd 1 dosyaya bağlanır.</p>
</div>

<div class="quiz" data-id="b04-2">
<p class="quiz-soru"><code>grep HATA yok.log | wc -l</code> komutundan sonra <code>echo $?</code> 0 yazıyor. Bunun nedeni nedir?</p>
<ul>
<li>grep dosya bulunamadığında 0 döndürür</li>
<li data-dogru>Boru hattının durumu son komutun (wc) durumudur; grep'in durumu <code>PIPESTATUS[0]</code> içindedir</li>
<li>Hata iletisi standart çıktıya yazıldığı için</li>
<li><code>$?</code> boru hatlarında her zaman 0'dır</li>
</ul>
<p class="quiz-aciklama">Varsayılan olarak yalnızca son komutun durumu dikkate alınır. <code>set -o pipefail</code> etkinleştirildiğinde grep'in 2 durumu hattın sonucu olur.</p>
</div>

<div class="quiz" data-id="b04-3">
<p class="quiz-soru">Bir sürecin kabukta gözlenen çıkış durumu 143'tür. Bu ne anlama gelir?</p>
<ul>
<li>Program 143 numaralı hata koduyla çıktı</li>
<li data-dogru>Süreç SIGTERM (15) sinyaliyle sonlandı: 128 + 15</li>
<li>Süreç bellek yetersizliğinden öldürüldü</li>
<li>Komut bulunamadı</li>
</ul>
<p class="quiz-aciklama">Kabuk, sinyalle sonlanan süreçler için 128 + sinyal numarasını raporlar. 137 (128 + 9) SIGKILL'e, 130 (128 + 2) SIGINT'e karşılık gelir.</p>
</div>

<div class="quiz" data-id="b04-4">
<p class="quiz-soru"><code>(cd /tmp; X=1)</code> ve <code>{ cd /tmp; X=1; }</code> komutları arasındaki fark nedir?</p>
<ul>
<li>Fark yoktur; ikisi de komutları gruplar</li>
<li data-dogru>Parantez alt kabukta çalışır ve dizin ile değişken değişikliği kaybolur; kıvrık ayraç mevcut kabukta çalışır ve değişiklikler kalıcıdır</li>
<li>Kıvrık ayraç arka planda çalışır</li>
<li>Parantez yalnızca aritmetik içindir</li>
</ul>
<p class="quiz-aciklama">( ) fork ile oluşturulan bir kopyada çalışır. { ; } yalnızca gruplama yapar; yönlendirmeyi birden çok komuta uygulamak için kullanılır.</p>
</div>

<div class="quiz" data-id="b04-5">
<p class="quiz-soru">Bir servis betiği <code>sleep 60</code> çalıştırırken gönderilen SIGTERM'e ancak bir dakika sonra yanıt veriyor. En uygun düzeltme hangisidir?</p>
<ul>
<li>SIGTERM yerine SIGKILL göndermek</li>
<li data-dogru><code>sleep 60 &amp; wait $!</code> biçimine geçmek; wait sinyal gelince hemen döner ve trap işleyicisi çalışır</li>
<li><code>trap</code> satırını betiğin sonuna taşımak</li>
<li>sleep süresini artırmak</li>
</ul>
<p class="quiz-aciklama">bash, ön plandaki dış komut bitmeden trap işleyicisini çalıştırmaz. Bekleme arka planda başlatılıp <code>wait</code> ile beklenirse işleyici hemen çalışır. SIGKILL temizlik yapılmasını engeller.</p>
</div>

!!! alistirma "Alıştırma: Derleme günlüğünün ayrıştırılması"
    Bir CI adımında `derle.sh` komutu çalıştırılacaktır. Aşağıdaki gereksinimleri tek bir komut
    satırıyla (gerekirse bash özellikleri kullanarak) karşılayın:

    1. Standart çıktı ve standart hatanın tamamı `tum.log` dosyasına yazılmalı.
    2. Yalnızca standart hata ayrıca `hatalar.log` dosyasına da yazılmalı.
    3. Her iki akış terminalde de görünmeye devam etmeli.
    4. Satırın çıkış durumu `derle.sh`'nin durumu olmalı.

    Denemek için `derle.sh` yerine `{ echo bilgi; echo uyari >&2; return 3; }` gövdeli bir fonksiyon kullanın.

    ??? success "Örnek çözüm"
        ```bash
        derle.sh() { echo bilgi; echo uyari >&2; return 3; }
        set -o pipefail
        { derle.sh 2> >(tee hatalar.log >&2); } 2>&1 | tee tum.log
        echo "durum: $?"      # 3
        ```

        Önce iç komutun fd 2'si, `hatalar.log`'a yazan ve aldığını yine standart hataya aktaran bir
        `tee` sürecine bağlanır (süreç ikamesi). Grubun dışındaki `2>&1`, bu standart hatayı da boruya
        yönlendirir; ikinci `tee` her şeyi `tum.log`'a yazar ve terminale gösterir. `pipefail`,
        hattın durumunun `tee` yerine `derle.sh`'den gelmesini sağlar. Süreç ikamesindeki `tee`
        eşzamansız çalıştığından satırların iki dosyadaki sırası farklı olabilir.

**Sonraki bölüm:** [5 · Bash betiklerine giriş: değişkenler, tırnaklar, genişletmeler →](05-betik-temelleri.md)
