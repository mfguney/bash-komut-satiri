# Animasyonlu şemalar ve terminal oturumları

Bu sayfa, kitaptaki tüm animasyonlu şemaları ve terminal canlandırmalarını bölüm sırasıyla bir arada sunar.
Her öğenin üstündeki bağlantı, öğenin anlatıldığı bölüme götürür. Animasyonlar adım adım veya **Oynat**
düğmesiyle izlenebilir; terminal oturumlarındaki çıktılar komutların gerçekten çalıştırılmasıyla elde edilmiştir.

## 1 · Kabuk, terminal ve komutların yapısı

### Animasyon: Bir tuşa basıldığında: terminal öykünücüsü, sözde terminal, kabuk ve çekirdek

[Bölüm 1](../bolumler/01-kabuk-ve-terminal.md)

<div class="akis" data-senaryo="terminal-katmanlari"></div>

### Animasyon: Kabuk bir komut adını nasıl çözer? (ll, cd ve sensor-oku)

[Bölüm 1](../bolumler/01-kabuk-ve-terminal.md)

<div class="akis" data-senaryo="komut-arama"></div>

### Terminal: Bir adın hangi tür komuta karşılık geldiğinin bulunması

[Bölüm 1](../bolumler/01-kabuk-ve-terminal.md)

<div class="terminal" data-oturum="komut-turleri"></div>

### Terminal: PATH araması ve hash tablosu

[Bölüm 1](../bolumler/01-kabuk-ve-terminal.md)

<div class="terminal" data-oturum="path-arama"></div>

### Terminal: Yardım kaynakları ve geçmiş genişletme

[Bölüm 1](../bolumler/01-kabuk-ve-terminal.md)

<div class="terminal" data-oturum="gecmis-yardim"></div>

## 2 · Dosya sistemi, izinler ve kullanıcılar

### Animasyon: Dizin kaydı, inode ve veri blokları: ln, ln -s ve rm

[Bölüm 2](../bolumler/02-dosya-sistemi-izinler.md)

<div class="akis" data-senaryo="inode-baglanti"></div>

### Terminal: inode, sabit bağlantı ve sembolik bağlantı

[Bölüm 2](../bolumler/02-dosya-sistemi-izinler.md)

<div class="terminal" data-oturum="inode-baglanti"></div>

### Animasyon: Çekirdek open() isteğine nasıl karar verir? (/etc/sensor.conf, -rw-r----- root:sensor)

[Bölüm 2](../bolumler/02-dosya-sistemi-izinler.md)

<div class="akis" data-senaryo="izin-denetimi"></div>

### Terminal: İzin bitleri, umask ve özel bitler

[Bölüm 2](../bolumler/02-dosya-sistemi-izinler.md)

<div class="terminal" data-oturum="izinler-umask"></div>

### Terminal: Örnek rootfs dizininin denetlenmesi

[Bölüm 2](../bolumler/02-dosya-sistemi-izinler.md)

<div class="terminal" data-oturum="rootfs-denetim"></div>

## 3 · Metin işleme: grep, sed, awk, find, xargs

### Terminal: grep ile günlük süzme: BRE, ERE ve sabit dizgiler

[Bölüm 3](../bolumler/03-metin-isleme.md)

<div class="terminal" data-oturum="grep-ifadeler"></div>

### Animasyon: sed satır satır nasıl çalışır? Desen alanı ve komut döngüsü

[Bölüm 3](../bolumler/03-metin-isleme.md)

<div class="akis" data-senaryo="sed-desen-alani"></div>

### Terminal: sed ile düzenleme, awk ile alan işleme

[Bölüm 3](../bolumler/03-metin-isleme.md)

<div class="terminal" data-oturum="sed-awk"></div>

### Animasyon: find -print0 | xargs -0 -n 2 wc -l: adlar nasıl gruplanır?

[Bölüm 3](../bolumler/03-metin-isleme.md)

<div class="akis" data-senaryo="find-xargs"></div>

### Terminal: find ve xargs: boşluk içeren adlar ve gruplama

[Bölüm 3](../bolumler/03-metin-isleme.md)

<div class="terminal" data-oturum="find-xargs"></div>

### Terminal: BitBake çıktısının metin araçlarıyla özetlenmesi

[Bölüm 3](../bolumler/03-metin-isleme.md)

<div class="terminal" data-oturum="bitbake-cikti-analizi"></div>

## 4 · Yönlendirme, borular, süreçler ve sinyaller

### Animasyon: Yönlendirme sırası: >f 2>&1 ile 2>&1 >f arasındaki fark

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="akis" data-senaryo="fd-tablosu"></div>

### Terminal: Dosya tanımlayıcı tablosu ve yönlendirme sırası

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="terminal" data-oturum="fd-yonlendirme"></div>

### Animasyon: grep HATA sensor.log | sort | uniq -c: süreçler, borular ve standart akışlar

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="akis" data-senaryo="boru-akisi"></div>

### Terminal: Borular, çıkış durumları, here-doc ve süreç ikamesi

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="terminal" data-oturum="boru-pipestatus"></div>

### Animasyon: ls >liste.txt komutunun çalıştırılması: clone, yönlendirme, execve, wait4

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="akis" data-senaryo="fork-exec-wait"></div>

### Terminal: Kabuğun bir komutu çalıştırması: clone, execve, wait4

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="terminal" data-oturum="fork-exec-wait"></div>

### Terminal: İş denetimi ve sinyal yakalama

[Bölüm 4](../bolumler/04-yonlendirme-surecler.md)

<div class="terminal" data-oturum="is-denetimi-sinyaller"></div>

## 5 · Bash betiklerine giriş: değişkenler, tırnaklar, genişletmeler

### Animasyon: Kabuk değişkeni, ortam değişkeni ve çocuk süreç

[Bölüm 5](../bolumler/05-betik-temelleri.md)

<div class="akis" data-senaryo="export-ortam"></div>

### Terminal: Kabuk değişkeni, ortam değişkeni ve source

[Bölüm 5](../bolumler/05-betik-temelleri.md)

<div class="terminal" data-oturum="export-ortam"></div>

### Terminal: Tırnaklama, sözcük bölme ve glob

[Bölüm 5](../bolumler/05-betik-temelleri.md)

<div class="terminal" data-oturum="tirnaklar"></div>

### Animasyon: Bir komut satırının genişletme adımları

[Bölüm 5](../bolumler/05-betik-temelleri.md)

<div class="akis" data-senaryo="genisletme-sirasi"></div>

### Terminal: Genişletmelerin sırası

[Bölüm 5](../bolumler/05-betik-temelleri.md)

<div class="terminal" data-oturum="genisletme-sirasi"></div>

### Terminal: Parametre genişletme biçimleri

[Bölüm 5](../bolumler/05-betik-temelleri.md)

<div class="terminal" data-oturum="parametre-genisletme"></div>

## 6 · Koşullar, döngüler, diziler ve fonksiyonlar

### Terminal: test, [ ] ve [[ ]] ile koşullar

[Bölüm 6](../bolumler/06-kosul-dongu-fonksiyon.md)

<div class="terminal" data-oturum="kosullar"></div>

### Animasyon: grep … | while read: sayaç neden sıfır kalır?

[Bölüm 6](../bolumler/06-kosul-dongu-fonksiyon.md)

<div class="akis" data-senaryo="boru-alt-kabuk"></div>

### Terminal: while read döngüsü ve borudaki alt kabuk

[Bölüm 6](../bolumler/06-kosul-dongu-fonksiyon.md)

<div class="terminal" data-oturum="dongu-alt-kabuk"></div>

### Terminal: Diziler ve ilişkisel diziler

[Bölüm 6](../bolumler/06-kosul-dongu-fonksiyon.md)

<div class="terminal" data-oturum="diziler"></div>

### Terminal: Fonksiyonlar: kapsam ve dönüş değeri

[Bölüm 6](../bolumler/06-kosul-dongu-fonksiyon.md)

<div class="terminal" data-oturum="fonksiyonlar"></div>

## 7 · Sağlam betikler: hata yönetimi, trap, getopts, ShellCheck

### Terminal: set -e: ne zaman durur, ne zaman durmaz?

[Bölüm 7](../bolumler/07-saglam-betikler.md)

<div class="terminal" data-oturum="set-e-tuzaklari"></div>

### Animasyon: Hata anında ERR ve EXIT tuzakları: saglam-sablon.sh dizin

[Bölüm 7](../bolumler/07-saglam-betikler.md)

<div class="akis" data-senaryo="trap-exit-akisi"></div>

### Terminal: trap EXIT/ERR, mktemp ve getopts ile şablon betik

[Bölüm 7](../bolumler/07-saglam-betikler.md)

<div class="terminal" data-oturum="trap-temizlik"></div>

### Animasyon: flock ile tek örnek: iki yedekle.sh aynı anda başlatılırsa

[Bölüm 7](../bolumler/07-saglam-betikler.md)

<div class="akis" data-senaryo="flock-kilit"></div>

### Terminal: Kilit dosyası ile tek örnek çalıştırma

[Bölüm 7](../bolumler/07-saglam-betikler.md)

<div class="terminal" data-oturum="getopts-kilit"></div>

### Terminal: ShellCheck ile statik çözümleme ve POSIX uyumu

[Bölüm 7](../bolumler/07-saglam-betikler.md)

<div class="terminal" data-oturum="shellcheck-posix"></div>

## 8 · Gömülü sistemlerde ve Yocto'da kabuk betikleri

### Terminal: BusyBox: tek ikili, çok komut ve ash farkları

[Bölüm 8](../bolumler/08-gomulu-betikler.md)

<div class="terminal" data-oturum="busybox-ash"></div>

### Animasyon: SysVinit ile açılış: /sbin/init'ten sensor-izle servisine

[Bölüm 8](../bolumler/08-gomulu-betikler.md)

<div class="akis" data-senaryo="init-baslatma"></div>

### Terminal: SysV init betiğinin denenmesi

[Bölüm 8](../bolumler/08-gomulu-betikler.md)

<div class="terminal" data-oturum="init-betigi"></div>

### Animasyon: do_install kabuk görevi: tariften run.do_install'a, oradan ${D}'ye

[Bölüm 8](../bolumler/08-gomulu-betikler.md)

<div class="akis" data-senaryo="bitbake-kabuk-gorevi"></div>

### Terminal: Bir BitBake kabuk görevinin benzetimi: run.do_install

[Bölüm 8](../bolumler/08-gomulu-betikler.md)

<div class="terminal" data-oturum="run-do-install"></div>

### Terminal: CI derleme betiğinin sahte bir kurulumla denenmesi

[Bölüm 8](../bolumler/08-gomulu-betikler.md)

<div class="terminal" data-oturum="ci-betigi"></div>
