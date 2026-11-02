/* Linux Komut Satırı ve Bash: animasyon ve terminal senaryoları
 *
 * Animasyon senaryosu:   window.AkisSenaryolari["ad"] = { baslik, istasyonlar:[{id,ad,yol}], dosyalar:[{id,ad,tur,yer,etiket?}],
 *                                                       kod?:{baslik,satirlar:[],tumunuGoster}, adimlar:[...] }
 * Terminal oturumu:      window.TerminalOturumlari["ad"] = { baslik, istem, adimlar:[{komut,cikti,aciklama,hata?,yorum?,istem?}] }
 * Ayrıntılar: _ortak/BENIOKU.md
 *
 * Terminal oturumlarının çıktıları, komutlar bir Linux derleme makinesinde (Ubuntu 24.04, bash 5.2,
 * GNU coreutils 9.4, BusyBox 1.36.1) kullanici/gelistirici hesaplarıyla gerçekten çalıştırılarak alınmıştır.
 */
window.AkisSenaryolari = window.AkisSenaryolari || {};
window.TerminalOturumlari = window.TerminalOturumlari || {};

/* ---------------------------------------------------------------- */
/* Bölüm 1                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["terminal-katmanlari"] = {
  baslik: "Bir tuşa basıldığında: terminal öykünücüsü, sözde terminal, kabuk ve çekirdek",
  istasyonlar: [
    { id: "emu", ad: "Terminal öykünücüsü", yol: "GNOME Terminal, ssh istemcisi…" },
    { id: "master", ad: "PTY ana ucu (master)", yol: "/dev/ptmx" },
    { id: "ld", ad: "Satır disiplini (çekirdek)", yol: "n_tty: düzenleme, yankı, sinyal" },
    { id: "slave", ad: "PTY yardımcı ucu (slave)", yol: "/dev/pts/0" },
    { id: "bash", ad: "Kabuk", yol: "bash (PID 2240)" },
    { id: "cocuk", ad: "Ön plan süreci", yol: "ls (PID 2251)" }
  ],
  dosyalar: [
    { id: "tus", ad: "tuşlar: l s ⏎", tur: "veri", yer: "emu" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Terminal öykünücüsü bir grafik programdır; kabuk değildir. Sözde terminal çiftinin ana ucunu açar, yardımcı ucu (/dev/pts/0) kabuğun 0, 1 ve 2 numaralı tanımlayıcıları olur.",
      vurgula: ["emu", "slave", "bash"] },
    { gorev: "Tuşlar ana uca", komut: "write(ptmx, \"ls\\r\")",
      aciklama: "Öykünücü, basılan tuşların baytlarını ana uca yazar. Bu baytlar çekirdekteki satır disiplinine ulaşır.",
      islemler: [{ tasi: "tus", hedef: "master" }], vurgula: ["master"] },
    { gorev: "Satır düzenleme ve yankı",
      aciklama: "Kanonik kipte satır disiplini baytları Enter'a kadar biriktirir, silme tuşunu işler ve her karakteri ekranda görünsün diye geri yansıtır (echo). Bash'in readline kitaplığı bu kipi kapatıp düzenlemeyi kendisi yapar.",
      islemler: [{ tasi: "tus", hedef: "ld" }, { olustur: { id: "yanki", ad: "yankı: ls", tur: "metin" }, hedef: "emu", kaynak: "tus" }], vurgula: ["ld", "emu"] },
    { gorev: "Kabuk satırı okur", komut: "read(0, \"ls\\n\")",
      aciklama: "Tamamlanan satır yardımcı uçtan okunur. Kabuk satırı sözcüklere ayırır, genişletmeleri yapar ve ls'nin bir dış komut olduğunu bulur.",
      islemler: [{ yeniden: "tus", ad: "satır: \"ls\\n\"" }, { tasi: "tus", hedef: "bash" }], vurgula: ["slave", "bash"] },
    { gorev: "fork + exec", komut: "clone() → execve(\"/usr/bin/ls\")",
      aciklama: "Kabuk bir çocuk süreç oluşturur; çocuk, ebeveynin dosya tanımlayıcılarını miras aldığı için aynı /dev/pts/0'a bağlıdır ve ls programına dönüşür.",
      islemler: [{ olustur: { id: "ls", ad: "ls (fd 0,1,2 → /dev/pts/0)", tur: "surec" }, hedef: "cocuk", kaynak: "tus" }, { soluk: "tus" }], vurgula: ["cocuk"] },
    { gorev: "Çıktı geri döner", komut: "write(1, \"sensor.log\\n\")",
      aciklama: "ls, fd 1'e yazar. Veri yardımcı uçtan satır disiplinine, oradan ana uca geçer; öykünücü okuduğu baytları ekranda çizer.",
      islemler: [{ olustur: { id: "cikti", ad: "çıktı: sensor.log", tur: "metin" }, hedef: "emu", kaynak: "ls" }], vurgula: ["cocuk", "emu"] },
    { gorev: "Ctrl-C", komut: "tuş: 0x03",
      aciklama: "Ctrl-C bir karakter olarak gelir; satır disiplini bunu ön plan süreç grubuna SIGINT sinyaline dönüştürür. Sinyali kabuk değil, çekirdek gönderir.",
      islemler: [{ olustur: { id: "sigint", ad: "SIGINT → ön plan grubu", tur: "veri", etiket: "SIG" }, hedef: "ld" }], vurgula: ["ld", "cocuk"] },
    { gorev: "Süreç biter", komut: "wait4() → $? = 0",
      aciklama: "ls sona erer, kabuk çocuğun durumunu toplar ve yeni istem yazar. Seri konsol (/dev/ttyS0) üzerinden bağlanıldığında öykünücü ve PTY yerine UART sürücüsü bulunur; satır disiplini aynıdır.",
      islemler: [{ sil: "ls" }, { sil: "sigint" }, { olustur: { id: "istem", ad: "istem: kullanici@agecidi:~$", tur: "metin" }, hedef: "emu" }], vurgula: ["bash", "emu"] }
  ]
};

window.AkisSenaryolari["komut-arama"] = {
  baslik: "Kabuk bir komut adını nasıl çözer? (ll, cd ve sensor-oku)",
  istasyonlar: [
    { id: "satir", ad: "Komut satırı", yol: "ilk sözcük" },
    { id: "alias", ad: "1 · Takma adlar", yol: "alias ll='ls -l'" },
    { id: "anahtar", ad: "2 · Ayrılmış sözcük, fonksiyon", yol: "if, for… / son()" },
    { id: "yerlesik", ad: "3 · Yerleşikler", yol: "cd, echo, type, read…" },
    { id: "hash", ad: "4 · hash tablosu", yol: "ad → tam yol önbelleği" },
    { id: "path", ad: "5 · PATH taraması", yol: "~/bin:/usr/local/bin:/usr/bin:/bin" },
    { id: "exec", ad: "Çalıştırma", yol: "fork + execve / kabuk içinde" }
  ],
  dosyalar: [
    { id: "ll", ad: "ll", tur: "metin", etiket: "AD", yer: "satir" },
    { id: "cd", ad: "cd /tmp", tur: "metin", etiket: "AD", yer: "satir" },
    { id: "so", ad: "sensor-oku 2", tur: "metin", etiket: "AD", yer: "satir" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Kabuk, satırın ilk sözcüğünü sırayla takma adlar, ayrılmış sözcükler, fonksiyonlar, yerleşikler ve dış komutlar arasında arar. Eğik çizgi içeren adlar için arama yapılmaz.",
      vurgula: ["satir"] },
    { gorev: "ll: takma ad", komut: "ll",
      aciklama: "Takma adlar ayrıştırma aşamasında metin olarak değiştirilir: ll, 'ls -l' olur ve arama yeni ilk sözcükle (ls) baştan başlar.",
      islemler: [{ tasi: "ll", hedef: "alias" }, { yeniden: "ll", ad: "ls -l" }], vurgula: ["alias"] },
    { gorev: "ls: PATH", komut: "ls -l",
      aciklama: "ls fonksiyon veya yerleşik değildir. hash tablosunda yoksa PATH dizinleri soldan sağa taranır; /usr/bin/ls bulunur ve tabloya yazılır.",
      islemler: [{ tasi: "ll", hedef: "path" }, { olustur: { id: "h-ls", ad: "ls → /usr/bin/ls", tur: "veri", etiket: "HASH" }, hedef: "hash", kaynak: "ll" }], vurgula: ["hash", "path"] },
    { gorev: "ls: execve", komut: "execve(\"/usr/bin/ls\", [\"ls\",\"-l\"])",
      aciklama: "Dış komut için kabuk çocuk süreç oluşturur ve programı execve ile yükler.",
      islemler: [{ tasi: "ll", hedef: "exec" }, { yeniden: "ll", ad: "/usr/bin/ls -l (yeni süreç)" }], vurgula: ["exec"] },
    { gorev: "cd: yerleşik", komut: "cd /tmp",
      aciklama: "cd yerleşiktir ve kabuğun kendi sürecinde çalışır. Ayrı bir süreç kendi çalışma dizinini değiştirse de bu değişiklik kabuğa yansımazdı.",
      islemler: [{ tasi: "cd", hedef: "yerlesik" }], vurgula: ["yerlesik"] },
    { gorev: "cd: süreç yok", komut: "chdir(\"/tmp\")",
      aciklama: "Yerleşik komutlar fork gerektirmez; bu nedenle döngülerde dış komutlara göre çok daha hızlıdır.",
      islemler: [{ tasi: "cd", hedef: "exec" }, { yeniden: "cd", ad: "cd (kabuk içinde, fork yok)" }, { soluk: "ll" }], vurgula: ["exec"] },
    { gorev: "sensor-oku: bulunamadı", komut: "sensor-oku 2",
      aciklama: "Hiçbir aşamada bulunamayan ad için kabuk 'command not found' yazar ve 127 döndürür. Dosya ~/bin'deyse ve ~/bin PATH'te değilse durum budur.",
      islemler: [{ tasi: "so", hedef: "path" }, { not: "path", metin: "bulunamadı → durum 127" }], vurgula: ["path"] },
    { gorev: "PATH güncellenir", komut: "PATH=\"$HOME/bin:$PATH\"",
      aciklama: "PATH'e atama hash tablosunu boşaltır. Yeni taramada ~/bin/sensor-oku bulunur, tabloya eklenir ve çalıştırılır.",
      islemler: [{ notSil: "path" }, { sil: "h-ls" }, { olustur: { id: "h-so", ad: "sensor-oku → ~/bin/sensor-oku", tur: "veri", etiket: "HASH" }, hedef: "hash", kaynak: "so" }, { tasi: "so", hedef: "exec" }], vurgula: ["hash", "exec"] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 2                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["inode-baglanti"] = {
  baslik: "Dizin kaydı, inode ve veri blokları: ln, ln -s ve rm",
  istasyonlar: [
    { id: "dizin", ad: "Dizin kayıtları (ad → inode)", yol: "~/deneme/" },
    { id: "inode", ad: "inode tablosu", yol: "tür, izinler, sahip, bağlantı sayısı, blok listesi" },
    { id: "blok", ad: "Veri blokları", yol: "dosya içeriği" },
    { id: "bos", ad: "Serbest alan", yol: "yeniden kullanılabilir" }
  ],
  dosyalar: [],
  kod: { baslik: "komutlar", satirlar: ["echo 'aralik=5' > sensor.conf", "ln sensor.conf sabit.conf", "ln -s sensor.conf sembolik.conf", "rm sensor.conf", "cat sembolik.conf", "rm sabit.conf"], tumunuGoster: false },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Bir dizin, ad ile inode numarası çiftlerinden oluşan özel bir dosyadır. Dosyanın adı inode'da değil, dizin kaydında tutulur; inode ise dosyanın kendisidir.",
      vurgula: ["dizin", "inode"] },
    { gorev: "Dosya oluşturma", komut: "echo 'aralik=5' > sensor.conf",
      aciklama: "Çekirdek boş bir inode ayırır (933908), içeriği veri bloklarına yazar ve dizine 'sensor.conf → 933908' kaydını ekler. Bağlantı sayısı 1'dir.",
      islemler: [
        { olustur: { id: "i1", ad: "inode 933908 · düzenli dosya · bağlantı 1", tur: "veri", etiket: "INO" }, hedef: "inode" },
        { olustur: { id: "b1", ad: "\"aralik=5\\n\" (9 bayt)", tur: "metin" }, hedef: "blok", kaynak: "i1" },
        { olustur: { id: "d1", ad: "sensor.conf → 933908", tur: "conf", etiket: "AD" }, hedef: "dizin", kaynak: "i1" }
      ], vurgula: ["dizin", "inode", "blok"], kodGoster: [0], kodSatir: [0] },
    { gorev: "Sabit bağlantı", komut: "ln sensor.conf sabit.conf",
      aciklama: "Yeni bir inode oluşturulmaz: aynı inode'u gösteren ikinci bir dizin kaydı eklenir ve bağlantı sayısı 2 olur. İki ad arasında asıl/kopya ayrımı yoktur.",
      islemler: [
        { olustur: { id: "d2", ad: "sabit.conf → 933908", tur: "conf", etiket: "AD" }, hedef: "dizin", kaynak: "d1" },
        { yeniden: "i1", ad: "inode 933908 · düzenli dosya · bağlantı 2" }
      ], vurgula: ["dizin", "inode"], kodGoster: [1], kodSatir: [1] },
    { gorev: "Sembolik bağlantı", komut: "ln -s sensor.conf sembolik.conf",
      aciklama: "Sembolik bağlantı ayrı bir inode'dur (933909); içeriği yalnızca hedefin yolu olan 'sensor.conf' metnidir (11 bayt). Hedefe ad üzerinden ulaşır.",
      islemler: [
        { olustur: { id: "i2", ad: "inode 933909 · sembolik bağlantı · bağlantı 1", tur: "veri", etiket: "INO" }, hedef: "inode" },
        { olustur: { id: "b2", ad: "\"sensor.conf\" (11 bayt)", tur: "metin" }, hedef: "blok", kaynak: "i2" },
        { olustur: { id: "d3", ad: "sembolik.conf → 933909", tur: "conf", etiket: "AD" }, hedef: "dizin", kaynak: "i2" }
      ], vurgula: ["dizin", "inode", "blok"], kodGoster: [2], kodSatir: [2] },
    { gorev: "rm sensor.conf", komut: "rm sensor.conf   (unlink)",
      aciklama: "rm yalnızca dizin kaydını siler ve bağlantı sayısını azaltır. Sayı 1'e indiği için inode ve veri yerinde kalır; sabit.conf ile içeriğe erişilir.",
      islemler: [{ sil: "d1" }, { yeniden: "i1", ad: "inode 933908 · düzenli dosya · bağlantı 1" }], vurgula: ["dizin", "inode"], kodGoster: [3], kodSatir: [3] },
    { gorev: "Kırık bağlantı", komut: "cat sembolik.conf",
      aciklama: "Çekirdek sembolik bağlantının içindeki 'sensor.conf' adını dizinde arar ve bulamaz: No such file or directory. Bağlantının kendisi varlığını sürdürür.",
      islemler: [{ vurgu: "d3" }, { not: "dizin", metin: "sensor.conf adı yok → ENOENT" }], vurgula: ["dizin"], kodGoster: [4], kodSatir: [4] },
    { gorev: "Son bağlantı", komut: "rm sabit.conf",
      aciklama: "Bağlantı sayısı 0'a iner. Dosyayı açık tutan süreç yoksa inode ve bloklar serbest bırakılır. Açık tutan bir süreç varsa (ör. günlük yazan servis) alan, dosya kapanana kadar kullanılmaya devam eder.",
      islemler: [{ notSil: "dizin" }, { sil: "d2" }, { tasi: "b1", hedef: "bos" }, { soluk: "b1" }, { sil: "i1" }], vurgula: ["bos"], kodGoster: [5], kodSatir: [5] }
  ]
};

window.AkisSenaryolari["izin-denetimi"] = {
  baslik: "Çekirdek open() isteğine nasıl karar verir? (/etc/sensor.conf, -rw-r----- root:sensor)",
  istasyonlar: [
    { id: "surec", ad: "İstekte bulunan süreç", yol: "uid, gid, ek gruplar" },
    { id: "sahip", ad: "1 · Sahip mi?", yol: "euid == dosya uid → u bitleri" },
    { id: "grup", ad: "2 · Grupta mı?", yol: "egid veya ek grup == dosya gid → g bitleri" },
    { id: "diger", ad: "3 · Diğerleri", yol: "o bitleri" },
    { id: "sonuc", ad: "Sonuç", yol: "fd veya EACCES" }
  ],
  dosyalar: [
    { id: "k", ad: "kullanici (uid 1001; gruplar 1001, sensor)", tur: "surec", yer: "surec" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Dosyanın izinleri rw- r-- --- (640), sahibi root, grubu sensor'dür. Çekirdek denetimleri sırayla yapar ve eşleşen ilk sınıfın bitlerini kullanır; sonraki sınıflara bakmaz.",
      vurgula: ["surec"] },
    { gorev: "Okuma isteği", komut: "open(\"/etc/sensor.conf\", O_RDONLY)",
      aciklama: "Önce yoldaki her dizin için yürütme (x) izni denetlenir: /, /etc. Ardından dosyanın kendisi için sınıf belirlenir.",
      islemler: [{ olustur: { id: "r", ad: "istek: okuma (r)", tur: "veri", etiket: "REQ" }, hedef: "surec", kaynak: "k" }], vurgula: ["surec"] },
    { gorev: "Sahip değil", aciklama: "Sürecin uid değeri 1001, dosyanınki 0'dır; sahip sınıfı uygulanmaz.",
      islemler: [{ tasi: "r", hedef: "sahip" }, { not: "sahip", metin: "1001 ≠ 0" }], vurgula: ["sahip"] },
    { gorev: "Grup eşleşti", aciklama: "Süreç sensor grubunun üyesidir; grup bitleri (r--) geçerlidir. r biti açık olduğundan okuma izni verilir.",
      islemler: [{ tasi: "r", hedef: "grup" }, { not: "grup", metin: "sensor ∈ gruplar → r--" }], vurgula: ["grup"] },
    { gorev: "fd döner", komut: "= 3",
      aciklama: "Erişim kararı açılış anında verilir; sonradan izinler değişse de açık tanımlayıcı geçerli kalır.",
      islemler: [{ tasi: "r", hedef: "sonuc" }, { yeniden: "r", ad: "okuma: izin verildi (fd 3)" }], vurgula: ["sonuc"] },
    { gorev: "Yazma isteği", komut: "open(\"/etc/sensor.conf\", O_WRONLY)",
      aciklama: "Aynı süreç yazmak istediğinde de grup sınıfı seçilir. Grup bitlerinde w yoktur ve diğerlerinin bitlerine bakılmaz.",
      islemler: [{ olustur: { id: "w", ad: "istek: yazma (w)", tur: "veri", etiket: "REQ" }, hedef: "grup", kaynak: "k" }, { notSil: "sahip" }], vurgula: ["grup"] },
    { gorev: "EACCES", komut: "= -1 EACCES (Permission denied)",
      aciklama: "Yazma reddedilir. root (uid 0) ise CAP_DAC_OVERRIDE yeteneği sayesinde bu denetimleri atlar; bu nedenle servislerin root olarak çalıştırılmaması önerilir.",
      islemler: [{ tasi: "w", hedef: "sonuc" }, { yeniden: "w", ad: "yazma: reddedildi (EACCES)" }, { notSil: "grup" }], vurgula: ["sonuc"] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 3                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["sed-desen-alani"] = {
  baslik: "sed satır satır nasıl çalışır? Desen alanı ve komut döngüsü",
  istasyonlar: [
    { id: "girdi", ad: "Girdi akışı", yol: "sensor.conf (ilk 5 satır)" },
    { id: "desen", ad: "Desen alanı (pattern space)", yol: "o anki satır" },
    { id: "cikti", ad: "Standart çıktı", yol: "otomatik yazdırma" },
    { id: "atilan", ad: "Silinen satırlar", yol: "d komutu: döngü biter, yazdırılmaz" }
  ],
  dosyalar: [
    { id: "s1", ad: "1: # sensor-oku yapılandırması (örnek)", tur: "metin", yer: "girdi" },
    { id: "s2", ad: "2: # Okuma aralığı (saniye)", tur: "metin", yer: "girdi" },
    { id: "s3", ad: "3: aralik=5", tur: "metin", yer: "girdi" },
    { id: "s4", ad: "4: (boş satır)", tur: "metin", yer: "girdi" },
    { id: "s5", ad: "5: i2c_yolu=/dev/i2c-1", tur: "metin", yer: "girdi" }
  ],
  kod: { baslik: "sed -e 's/#.*//' -e '/^[[:space:]]*$/d' sensor.conf", satirlar: ["s/#.*//              # 1. yorum kısmını sil", "/^[[:space:]]*$/d     # 2. boş satırsa sil ve sonraki satıra geç", "(döngü sonu)          # -n yoksa desen alanını yaz"], tumunuGoster: true },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "sed girdiyi bir kez, satır satır okur. Her satır desen alanına alınır, komut listesi baştan sona uygulanır ve döngü sonunda desen alanı yazdırılır. Dosyanın tamamı belleğe alınmaz.",
      vurgula: ["girdi"] },
    { gorev: "Satır 1 okunur", aciklama: "Satır sonu karakteri ayrılır ve satır desen alanına yerleştirilir.",
      islemler: [{ tasi: "s1", hedef: "desen" }], vurgula: ["desen"] },
    { gorev: "s/#.*//", aciklama: "# karakterinden satır sonuna kadar olan kısım silinir; desen alanı boş kalır.",
      islemler: [{ yeniden: "s1", ad: "1: \"\"" }], vurgula: ["desen"], kodSatir: [0] },
    { gorev: "/^…$/d", aciklama: "Desen alanı yalnızca boşluk karakterlerinden oluştuğu (burada boş olduğu) için adres eşleşir; d desen alanını siler ve sonraki döngüye geçer. Yazdırma yapılmaz.",
      islemler: [{ tasi: "s1", hedef: "atilan" }, { soluk: "s1" }], vurgula: ["atilan"], kodSatir: [1] },
    { gorev: "Satır 2", aciklama: "Aynı yol: yorum silinir, boş kalan satır atılır.",
      islemler: [{ tasi: "s2", hedef: "desen" }, { yeniden: "s2", ad: "2: \"\"" }, { tasi: "s2", hedef: "atilan" }, { soluk: "s2" }], vurgula: ["atilan"], kodSatir: [0, 1] },
    { gorev: "Satır 3", aciklama: "s komutu eşleşme bulamaz ve desen alanı değişmez; boş satır adresi de eşleşmez. Döngü sonunda desen alanı standart çıktıya yazılır.",
      islemler: [{ tasi: "s3", hedef: "desen" }], vurgula: ["desen"], kodSatir: [0, 1] },
    { gorev: "Otomatik yazdırma", aciklama: "-n seçeneği verilmediğinden döngü sonu desen alanını yazdırır.",
      islemler: [{ tasi: "s3", hedef: "cikti" }], vurgula: ["cikti"], kodSatir: [2] },
    { gorev: "Satır 4 ve 5", aciklama: "Boş satır ikinci komutla atılır; i2c_yolu satırı değişmeden yazılır. sed -i kullanıldığında çıktı geçici bir dosyaya yazılır ve sonunda asıl dosyanın yerine konur.",
      islemler: [{ tasi: "s4", hedef: "atilan" }, { soluk: "s4" }, { tasi: "s5", hedef: "cikti" }], vurgula: ["cikti", "atilan"], kodSatir: [1, 2] }
  ]
};

window.AkisSenaryolari["find-xargs"] = {
  baslik: "find -print0 | xargs -0 -n 2 wc -l: adlar nasıl gruplanır?",
  istasyonlar: [
    { id: "agac", ad: "Dizin ağacı", yol: "~/kaynak/" },
    { id: "find", ad: "find", yol: "-name '*.c' -print0" },
    { id: "boru", ad: "Boru", yol: "NUL ile ayrılmış adlar" },
    { id: "xargs", ad: "xargs -0 -n 2", yol: "argüman grubu" },
    { id: "wc", ad: "wc -l süreçleri", yol: "her grup için bir execve" }
  ],
  dosyalar: [
    { id: "f1", ad: "src/surucu/i2c.c", tur: "kaynak", yer: "agac" },
    { id: "f2", ad: "src/surucu/spi.c", tur: "kaynak", yer: "agac" },
    { id: "f3", ad: "src/sensor okuyucu.c", tur: "kaynak", yer: "agac" },
    { id: "f4", ad: "src/ana.c", tur: "kaynak", yer: "agac" },
    { id: "f5", ad: "build/tmp/uretilen.c", tur: "kaynak", yer: "agac" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "find adları dizin okuma sırasıyla üretir (alfabetik değildir). -print0 her adın sonuna bir NUL baytı ekler; NUL, bir dosya yolunda hiçbir zaman bulunamayan tek bayttır; boşluk, sekme, hatta satır sonu ise dosya adında yer alabilir.",
      vurgula: ["agac", "find"] },
    { gorev: "İlk adlar", komut: "find . -name '*.c' -print0",
      aciklama: "find iki eşleşmeyi bulup boruya yazar. Boru, çekirdekte bir tampondur; xargs okumaya hazır olduğunda veri akar.",
      islemler: [{ kopyala: "f1", hedef: "boru", yeniId: "p1", yeniAd: "./src/surucu/i2c.c\\0", tur: "veri" }, { kopyala: "f2", hedef: "boru", yeniId: "p2", yeniAd: "./src/surucu/spi.c\\0", tur: "veri" }],
      vurgula: ["find", "boru"] },
    { gorev: "Grup doldu", aciklama: "xargs adları NUL'dan ayırır. -n 2 sınırına ulaşıldığında komut satırını oluşturur.",
      islemler: [{ tasi: "p1", hedef: "xargs" }, { tasi: "p2", hedef: "xargs" }], vurgula: ["xargs"] },
    { gorev: "1. wc", komut: "execve(\"wc\", [\"wc\",\"-l\",\"./src/surucu/i2c.c\",\"./src/surucu/spi.c\"])",
      aciklama: "xargs bir çocuk süreç başlatır, bitmesini bekler ve sonraki gruba geçer (-P ile paralel çalıştırma da mümkündür).",
      islemler: [{ tasi: "p1", hedef: "wc" }, { tasi: "p2", hedef: "wc" }, { soluk: "p1" }, { soluk: "p2" }], vurgula: ["wc"] },
    { gorev: "Boşluklu ad", aciklama: "'sensor okuyucu.c' içinde boşluk vardır; -0 kullanıldığı için tek bir argüman olarak kalır. Varsayılan kipte xargs bunu iki ayrı argümana bölerdi.",
      islemler: [{ kopyala: "f3", hedef: "boru", yeniId: "p3", yeniAd: "./src/sensor okuyucu.c\\0", tur: "veri" }, { kopyala: "f4", hedef: "boru", yeniId: "p4", yeniAd: "./src/ana.c\\0", tur: "veri" }, { tasi: "p3", hedef: "xargs" }, { tasi: "p4", hedef: "xargs" }],
      vurgula: ["boru", "xargs"] },
    { gorev: "2. wc", komut: "wc -l './src/sensor okuyucu.c' ./src/ana.c",
      aciklama: "İkinci grup ayrı bir wc sürecinde işlenir. Her wc kendi 'total' satırını yazar; tek bir toplam için -n kullanılmamalıdır.",
      islemler: [{ tasi: "p3", hedef: "wc" }, { tasi: "p4", hedef: "wc" }, { soluk: "p3" }, { soluk: "p4" }], vurgula: ["wc"] },
    { gorev: "Son grup", komut: "wc -l ./build/tmp/uretilen.c",
      aciklama: "Girdi bitince xargs eksik kalan grubu da çalıştırır. -n verilmezse xargs, ARG_MAX sınırına sığan tüm adları tek çağrıda toplar; find -exec ... {} + aynı gruplamayı boru olmadan yapar.",
      islemler: [{ kopyala: "f5", hedef: "boru", yeniId: "p5", yeniAd: "./build/tmp/uretilen.c\\0", tur: "veri" }, { tasi: "p5", hedef: "wc" }], vurgula: ["wc"] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 4                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["boru-akisi"] = {
  baslik: "grep HATA sensor.log | sort | uniq -c: süreçler, borular ve standart akışlar",
  istasyonlar: [
    { id: "dosya", ad: "sensor.log", yol: "grep'in argümanı (fd 3)" },
    { id: "grep", ad: "grep HATA", yol: "PID 3101 · fd1 → boru A" },
    { id: "sort", ad: "sort", yol: "PID 3102 · fd0 ← A, fd1 → B" },
    { id: "uniq", ad: "uniq -c", yol: "PID 3103 · fd0 ← B" },
    { id: "ekran", ad: "Terminal (stdout)", yol: "/dev/pts/0" },
    { id: "hata", ad: "Terminal (stderr)", yol: "/dev/pts/0 · borudan geçmez" }
  ],
  dosyalar: [
    { id: "l1", ad: "10:01:20 HATA sensor2: zaman aşımı", tur: "metin", yer: "dosya" },
    { id: "l2", ad: "10:01:25 sensor0 sicaklik=21.9", tur: "metin", yer: "dosya" },
    { id: "l3", ad: "10:02:45 HATA sensor1: zaman aşımı", tur: "metin", yer: "dosya" },
    { id: "l4", ad: "10:03:10 HATA sensor0: CRC", tur: "metin", yer: "dosya" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Kabuk iki boru (pipe) oluşturur ve üç süreci aynı anda başlatır. Her borunun yazma ucu soldaki sürecin fd 1'ine, okuma ucu sağdakinin fd 0'ına bağlanır. fd 2 hiçbir borudan geçmez.",
      vurgula: ["grep", "sort", "uniq"] },
    { gorev: "grep süzer", komut: "grep HATA sensor.log",
      aciklama: "grep satırları okur; eşleşenleri fd 1'e, yani boru A'ya yazar. Eşleşmeyen satır hiçbir yere gitmez.",
      islemler: [{ tasi: "l1", hedef: "sort" }, { soluk: "l2" }, { tasi: "l3", hedef: "sort" }], vurgula: ["grep", "sort"] },
    { gorev: "sort bekler", aciklama: "sort, sıralayabilmek için girdinin tamamını okumak zorundadır; boru A'nın yazma ucu kapanana (EOF) kadar hiçbir şey yazmaz. uniq bu sırada okuma çağrısında bekler.",
      islemler: [{ tasi: "l4", hedef: "sort" }, { not: "sort", metin: "EOF bekleniyor" }], vurgula: ["sort", "uniq"] },
    { gorev: "grep biter", aciklama: "grep dosyanın sonuna ulaşır ve çıkar; çekirdek fd'lerini kapatır. Boru A'nın tek yazarı kalmadığından sort EOF okur.",
      islemler: [{ notSil: "sort" }, { olustur: { id: "g0", ad: "grep: çıkış durumu 0", tur: "surec" }, hedef: "grep" }], vurgula: ["grep", "sort"] },
    { gorev: "sort yazar", aciklama: "Sıralanmış satırlar boru B'ye yazılır ve uniq tarafından okunur.",
      islemler: [{ tasi: "l1", hedef: "uniq" }, { tasi: "l3", hedef: "uniq" }, { tasi: "l4", hedef: "uniq" }], vurgula: ["uniq"] },
    { gorev: "uniq -c", aciklama: "uniq ardışık aynı satırları sayar. Satırlar zaman damgası içerdiğinden her biri farklıdır ve sayıları 1'dir; önce cut veya sed ile alan seçilmesi gerekir.",
      islemler: [{ yeniden: "l1", ad: "1 10:01:20 HATA sensor2…" }, { yeniden: "l3", ad: "1 10:02:45 HATA sensor1…" }, { yeniden: "l4", ad: "1 10:03:10 HATA sensor0…" }, { tasi: "l1", hedef: "ekran" }, { tasi: "l3", hedef: "ekran" }, { tasi: "l4", hedef: "ekran" }],
      vurgula: ["ekran"] },
    { gorev: "stderr ayrı yol", komut: "grep HATA yok.log | sort",
      aciklama: "Hata iletisi fd 2'ye yazılır; fd 2 terminale bağlı olduğundan doğrudan ekrana gider, sort'a ulaşmaz. Hataların da boruya girmesi için 2>&1 veya |& gerekir.",
      islemler: [{ olustur: { id: "e1", ad: "grep: yok.log: No such file or directory", tur: "metin", etiket: "ERR" }, hedef: "hata", kaynak: "g0" }], vurgula: ["hata"] },
    { gorev: "Çıkış durumu", komut: "echo \"${PIPESTATUS[@]}\" → 0 0 0",
      aciklama: "Boru hattının durumu son komutun (uniq) durumudur. Her sürecin durumu PIPESTATUS dizisindedir; set -o pipefail ise sıfırdan farklı durumla biten en sağdaki komutun durumunu hattın durumu yapar.",
      islemler: [{ vurgu: "g0" }], vurgula: ["grep", "sort", "uniq"] }
  ]
};

window.AkisSenaryolari["fd-tablosu"] = {
  baslik: "Yönlendirme sırası: >f 2>&1 ile 2>&1 >f arasındaki fark",
  istasyonlar: [
    { id: "tty", ad: "Terminal", yol: "/dev/pts/0" },
    { id: "dosya", ad: "Dosya", yol: "tablo.txt" },
    { id: "boru", ad: "Boru yazma ucu", yol: "| tr a-z A-Z" },
    { id: "null", ad: "Çöp aygıtı", yol: "/dev/null" },
    { id: "bos", ad: "Kapalı", yol: "3>&- / kullanılmayan" }
  ],
  dosyalar: [
    { id: "fd0", ad: "fd 0 (stdin)", tur: "veri", etiket: "FD" , yer: "tty" },
    { id: "fd1", ad: "fd 1 (stdout)", tur: "veri", etiket: "FD", yer: "tty" },
    { id: "fd2", ad: "fd 2 (stderr)", tur: "veri", etiket: "FD", yer: "tty" }
  ],
  kod: { baslik: "üç ayrı komut", satirlar: ["./fd-goster.sh >tablo.txt 2>&1     # A", "./fd-goster.sh 2>&1 >tablo.txt     # B", "ls yok.txt 2>&1 >/dev/null | tr a-z A-Z   # C"], tumunuGoster: true },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Her tanımlayıcı, çekirdekteki bir açık dosya kaydını gösteren bir işaretçidir. Kabuktan başlatılan süreçte üçü de terminali gösterir. Yönlendirmeler, kabuğun çocuk süreçte execve öncesinde yaptığı işlemlerdir ve soldan sağa uygulanır.",
      vurgula: ["tty"] },
    { gorev: "A: >tablo.txt", komut: "open(\"tablo.txt\") + dup2(fd, 1)",
      aciklama: "Dosya açılır ve fd 1 bu dosyayı gösterecek biçimde değiştirilir.",
      islemler: [{ tasi: "fd1", hedef: "dosya" }], vurgula: ["dosya"], kodSatir: [0] },
    { gorev: "A: 2>&1", komut: "dup2(1, 2)",
      aciklama: "2>&1 'fd 2, fd 1'in ŞU ANKİ hedefinin kopyası olsun' demektir. fd 1 dosyayı gösterdiğinden fd 2 de dosyaya bağlanır. İki tanımlayıcı aynı dosya konumunu paylaşır; çıktılar birbirinin üzerine yazmaz.",
      islemler: [{ tasi: "fd2", hedef: "dosya" }], vurgula: ["dosya"], kodSatir: [0] },
    { gorev: "B için sıfırla", aciklama: "İkinci komut yeni bir süreçte çalışır; tablo yeniden terminali gösterir.",
      islemler: [{ tasi: "fd1", hedef: "tty" }, { tasi: "fd2", hedef: "tty" }], vurgula: ["tty"] },
    { gorev: "B: 2>&1", komut: "dup2(1, 2)",
      aciklama: "Bu kez önce 2>&1 uygulanır. fd 1 henüz terminali gösterdiğinden fd 2 terminalin kopyası olur; yani hiçbir şey değişmez.",
      islemler: [{ vurgu: "fd2" }], vurgula: ["tty"], kodSatir: [1] },
    { gorev: "B: >tablo.txt", komut: "open(\"tablo.txt\") + dup2(fd, 1)",
      aciklama: "Ardından yalnızca fd 1 dosyaya bağlanır. fd 2 önceki adımda kopyalanan terminal hedefinde kalır: hatalar ekranda görünür. Bu sıra, 'yalnızca hataları boruya gönder' kalıbında bilerek kullanılır.",
      islemler: [{ tasi: "fd1", hedef: "dosya" }], vurgula: ["dosya", "tty"], kodSatir: [1] },
    { gorev: "C: boru önce", komut: "pipe() + dup2(yazma_ucu, 1)",
      aciklama: "Boru hattında kabuk, yönlendirmelerden ÖNCE sol komutun fd 1'ini borunun yazma ucuna bağlar.",
      islemler: [{ tasi: "fd1", hedef: "boru" }, { tasi: "fd2", hedef: "tty" }], vurgula: ["boru"], kodSatir: [2] },
    { gorev: "C: 2>&1 >/dev/null", komut: "dup2(1, 2) ; open(\"/dev/null\") + dup2(fd, 1)",
      aciklama: "fd 2 borunun kopyası olur, ardından fd 1 /dev/null'a bağlanır. Sonuç: yalnızca hata iletileri boruya, oradan tr'ye gider; normal çıktı atılır.",
      islemler: [{ tasi: "fd2", hedef: "boru" }, { tasi: "fd1", hedef: "null" }], vurgula: ["boru", "null"], kodSatir: [2] },
    { gorev: "exec ile kalıcı fd", komut: "exec 3>kayit.txt … exec 3>&-",
      aciklama: "Komutsuz exec yönlendirmeyi kabuğun kendi tablosuna uygular; fd 3 kapatılana kadar sonraki tüm komutlara miras kalır.",
      islemler: [{ olustur: { id: "fd3", ad: "fd 3 → kayit.txt", tur: "veri", etiket: "FD" }, hedef: "dosya" }, { tasi: "fd3", hedef: "bos" }, { soluk: "fd3" }], vurgula: ["bos"] }
  ]
};

window.AkisSenaryolari["fork-exec-wait"] = {
  baslik: "ls >liste.txt komutunun çalıştırılması: clone, yönlendirme, execve, wait4",
  istasyonlar: [
    { id: "bash", ad: "Ebeveyn kabuk", yol: "bash · PID 2240" },
    { id: "cocuk", ad: "Çocuk süreç", yol: "PID 2251" },
    { id: "disk", ad: "Program dosyası", yol: "/usr/bin/ls (ELF)" },
    { id: "cekirdek", ad: "Çekirdek", yol: "süreç tablosu · çıkış durumu" }
  ],
  dosyalar: [
    { id: "b", ad: "bash bellek görüntüsü + fd tablosu", tur: "surec", yer: "bash" },
    { id: "elf", ad: "ls", tur: "ikili", yer: "disk" }
  ],
  adimlar: [
    { gorev: "Başlangıç", komut: "ls > liste.txt",
      aciklama: "Kabuk satırı ayrıştırıp genişletmeleri yapar ve ls'nin dış komut olduğunu bulur. Unix'te yeni program çalıştırmak iki ayrı adımdır: kopyala (fork), sonra dönüş (exec).",
      vurgula: ["bash"] },
    { gorev: "fork (clone)", komut: "clone(… SIGCHLD) = 2251",
      aciklama: "Çekirdek kabuğun bir kopyasını oluşturur: aynı bellek (yazınca-kopyala), aynı değişkenler, aynı fd tablosu. Ebeveynde clone çocuğun PID'ini, çocukta 0 döndürür.",
      islemler: [{ kopyala: "b", hedef: "cocuk", yeniId: "c", yeniAd: "bash kopyası (fd 0,1,2 → pts/0)" }], vurgula: ["cocuk"] },
    { gorev: "Yönlendirme", komut: "openat(\"liste.txt\") ; dup2(3, 1)",
      aciklama: "Yönlendirme çocukta, execve'den önce yapılır; ebeveynin fd tablosu değişmez. Alt kabuk ( ) ile yazılan komutlar da böyle bir kopyada çalışır.",
      islemler: [{ yeniden: "c", ad: "bash kopyası (fd 1 → liste.txt)" }], vurgula: ["cocuk"] },
    { gorev: "exec", komut: "execve(\"/usr/bin/ls\", [\"ls\"], environ)",
      aciklama: "Çocuğun bellek görüntüsü silinir ve ls programı yüklenir. PID ve açık fd'ler korunur; dışa aktarılmamış kabuk değişkenleri ve fonksiyonlar kaybolur, ortam listesi aktarılır.",
      islemler: [{ kopyala: "elf", hedef: "cocuk", yeniId: "ls", yeniAd: "ls (fd 1 → liste.txt)" }, { sil: "c" }], vurgula: ["cocuk", "disk"] },
    { gorev: "wait", komut: "wait4(-1, …)",
      aciklama: "Ön plandaki komut için ebeveyn wait4 çağrısında bekler. & ile başlatılan arka plan işlerinde beklemez ve hemen yeni istem verir.",
      islemler: [{ not: "bash", metin: "wait4 içinde uyuyor" }], vurgula: ["bash"] },
    { gorev: "exit", komut: "exit_group(0)",
      aciklama: "ls bitince çekirdek kaynaklarını serbest bırakır, ancak çıkış durumunu ebeveyn okuyana kadar süreç kaydını tutar: bu kısa süreli durum 'zombi' (Z) olarak görünür. Ebeveyne SIGCHLD gönderilir.",
      islemler: [{ tasi: "ls", hedef: "cekirdek" }, { yeniden: "ls", ad: "zombi 2251 · durum 0" }, { soluk: "ls" }], vurgula: ["cekirdek"] },
    { gorev: "Durum toplanır", komut: "echo $? → 0",
      aciklama: "wait4 durumu döndürür ve süreç kaydı silinir. Kabuk durumu $? değişkenine yazar: normal çıkışta 0-255, sinyalle sonlanmada 128 + sinyal numarası.",
      islemler: [{ notSil: "bash" }, { sil: "ls" }, { olustur: { id: "d", ad: "$? = 0", tur: "veri" }, hedef: "bash" }], vurgula: ["bash"] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 5                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["genisletme-sirasi"] = {
  baslik: "Bir komut satırının genişletme adımları",
  istasyonlar: [
    { id: "ayr", ad: "0 · Ayrıştırma", yol: "sözcükler ve tırnaklar" },
    { id: "kume", ad: "1 · Küme ayracı", yol: "{a,b} {1..3}" },
    { id: "tilde", ad: "2 · Tilde", yol: "~ ~kullanıcı" },
    { id: "param", ad: "3 · Parametre, komut, aritmetik", yol: "$x $(…) $((…)) · soldan sağa" },
    { id: "bol", ad: "4 · Sözcük bölme", yol: "IFS · yalnızca tırnaksız sonuçlar" },
    { id: "glob", ad: "5 · Yol adı (glob)", yol: "* ? […]" },
    { id: "argv", ad: "6 · Tırnak kaldırma → argv", yol: "execve'e giden argümanlar" }
  ],
  dosyalar: [
    { id: "w0", ad: "ls", tur: "metin", etiket: "W", yer: "ayr" },
    { id: "w1", ad: "~/b5/{sensor,sistem}*", tur: "metin", etiket: "W", yer: "ayr" },
    { id: "w2", ad: "$DIZIN", tur: "metin", etiket: "W", yer: "ayr" },
    { id: "w3", ad: "\"$ETIKET\"", tur: "metin", etiket: "W", yer: "ayr" }
  ],
  kod: { baslik: "DIZIN='/etc /tmp'  ETIKET='a b'", satirlar: ["ls ~/b5/{sensor,sistem}* \\", "   $DIZIN \"$ETIKET\""], tumunuGoster: true },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Kabuk satırı önce sözcüklere (token) ayırır. Tırnaklar bu aşamada işaretlenir; hangi bölümün tırnak içinde olduğu sonraki adımların davranışını belirler.",
      vurgula: ["ayr"], kodSatir: [0, 1] },
    { gorev: "Küme ayracı", aciklama: "Yalnızca metin üretir, dosya sistemine bakmaz: bir sözcük ikiye çoğalır. Bu adım ilk olduğu için {1..$n} gibi değişken içeren aralıklar çalışmaz.",
      islemler: [{ tasi: "w1", hedef: "kume" }, { yeniden: "w1", ad: "~/b5/sensor*" }, { olustur: { id: "w1b", ad: "~/b5/sistem*", tur: "metin", etiket: "W" }, hedef: "kume", kaynak: "w1" }],
      vurgula: ["kume"] },
    { gorev: "Tilde", aciklama: "Sözcük başındaki tırnaksız ~, HOME değerine dönüşür.",
      islemler: [{ tasi: "w1", hedef: "tilde" }, { tasi: "w1b", hedef: "tilde" }, { yeniden: "w1", ad: "/home/kullanici/b5/sensor*" }, { yeniden: "w1b", ad: "/home/kullanici/b5/sistem*" }],
      vurgula: ["tilde"] },
    { gorev: "Parametre", aciklama: "$DIZIN ve \"$ETIKET\" değerleriyle değiştirilir. Komut ikamesi $(…) ve aritmetik $((…)) de bu adımda, soldan sağa aynı geçişte yapılır.",
      islemler: [{ tasi: "w2", hedef: "param" }, { tasi: "w3", hedef: "param" }, { yeniden: "w2", ad: "/etc /tmp (tırnaksız)" }, { yeniden: "w3", ad: "\"a b\" (tırnaklı)" }],
      vurgula: ["param"] },
    { gorev: "Sözcük bölme", aciklama: "Yalnızca tırnaksız genişletme sonuçları IFS karakterlerinden bölünür: /etc /tmp iki sözcük olur. Tırnaklı \"a b\" ve satırda doğrudan yazılmış metin bölünmez.",
      islemler: [{ tasi: "w2", hedef: "bol" }, { yeniden: "w2", ad: "/etc" }, { olustur: { id: "w2b", ad: "/tmp", tur: "metin", etiket: "W" }, hedef: "bol", kaynak: "w2" }, { tasi: "w3", hedef: "bol" }],
      vurgula: ["bol"] },
    { gorev: "Glob", aciklama: "Tırnaksız *, ? ve […] içeren sözcükler eşleşen dosya adlarıyla değiştirilir. Bulunan ad boşluk içerse bile tek argümandır; glob sonucu yeniden bölünmez.",
      islemler: [{ tasi: "w1", hedef: "glob" }, { tasi: "w1b", hedef: "glob" }, { yeniden: "w1", ad: "/home/kullanici/b5/sensor okuma.log" }, { yeniden: "w1b", ad: "/home/kullanici/b5/sistem.log" }],
      vurgula: ["glob"] },
    { gorev: "Tırnak kaldırma", aciklama: "Genişletmeden gelmeyen tırnak ve ters eğik çizgi karakterleri silinir. Sonuçta argv altı öğeden oluşur: ls, iki dosya adı, /etc, /tmp ve 'a b'.",
      islemler: [{ tasi: "w0", hedef: "argv" }, { tasi: "w1", hedef: "argv" }, { tasi: "w1b", hedef: "argv" }, { tasi: "w2", hedef: "argv" }, { tasi: "w2b", hedef: "argv" }, { tasi: "w3", hedef: "argv" }, { yeniden: "w3", ad: "a b" }],
      vurgula: ["argv"] },
    { gorev: "set -x ile görme", komut: "set -x",
      aciklama: "set -x bu son durumu '+ ls '/home/kullanici/b5/sensor okuma.log' /home/kullanici/b5/sistem.log /etc /tmp 'a b'' biçiminde yazar; boşluk içeren argümanlar tırnakla gösterilir.",
      islemler: [{ vurgu: "w1" }, { vurgu: "w3" }], vurgula: ["argv"] }
  ]
};

window.AkisSenaryolari["export-ortam"] = {
  baslik: "Kabuk değişkeni, ortam değişkeni ve çocuk süreç",
  istasyonlar: [
    { id: "kabuk", ad: "Kabuk değişkenleri", yol: "bash belleği (PID 2240)" },
    { id: "ortam", ad: "Dışa aktarılanlar (environ)", yol: "declare -x" },
    { id: "cocuk", ad: "Çocuk süreç ortamı", yol: "execve ile kopyalanır" },
    { id: "kayip", ad: "Sona eren süreçler", yol: "değişiklikler kaybolur" }
  ],
  dosyalar: [
    { id: "home", ad: "HOME=/home/kullanici", tur: "veri", etiket: "ENV", yer: "ortam" },
    { id: "path", ad: "PATH=/usr/local/bin:/usr/bin:…", tur: "veri", etiket: "ENV", yer: "ortam" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Kabuk, kendisini başlatan süreçten aldığı ortam değişkenlerini (HOME, PATH…) dışa aktarılmış olarak işaretler. Her çocuk süreç bu listenin bir kopyasını alır.",
      vurgula: ["ortam"] },
    { gorev: "Atama", komut: "SENSOR_ARALIK=5",
      aciklama: "Atama yalnızca kabuğun kendi değişkenini oluşturur. Ortama girmez.",
      islemler: [{ olustur: { id: "sa", ad: "SENSOR_ARALIK=5", tur: "veri", etiket: "VAR" }, hedef: "kabuk" }], vurgula: ["kabuk"] },
    { gorev: "Çocuk görmez", komut: "bash -c 'echo \"[$SENSOR_ARALIK]\"'  → []",
      aciklama: "execve yalnızca dışa aktarılan listeyi yeni programa verir. Çocuk değişkeni tanımsız görür.",
      islemler: [{ kopyala: "home", hedef: "cocuk", yeniId: "c1", yeniAd: "HOME=/home/kullanici" }, { kopyala: "path", hedef: "cocuk", yeniId: "c2", yeniAd: "PATH=…" }], vurgula: ["cocuk"] },
    { gorev: "export", komut: "export SENSOR_ARALIK",
      aciklama: "export değişkeni dışa aktarılmış olarak işaretler. Değeri kopyalanmaz; kabuk değişkeni ile ortam girdisi aynı değişkendir.",
      islemler: [{ sil: "c1" }, { sil: "c2" }, { tasi: "sa", hedef: "ortam" }], vurgula: ["ortam"] },
    { gorev: "Çocuk görür", komut: "bash -c 'echo \"[$SENSOR_ARALIK]\"'  → [5]",
      aciklama: "Yeni çocuk süreç ortamın kopyasını alır ve değeri görür.",
      islemler: [{ kopyala: "sa", hedef: "cocuk", yeniId: "c3", yeniAd: "SENSOR_ARALIK=5" }], vurgula: ["cocuk"] },
    { gorev: "Çocuk değiştirir", komut: "SENSOR_ARALIK=60 (çocukta)",
      aciklama: "Çocuk yalnızca kendi kopyasını değiştirir. Ortam tek yönlüdür: çocuktan ebeveyne değer aktarmanın tek yolu çıktı, dosya veya çıkış durumudur.",
      islemler: [{ yeniden: "c3", ad: "SENSOR_ARALIK=60" }, { tasi: "c3", hedef: "kayip" }, { soluk: "c3" }], vurgula: ["kayip", "ortam"] },
    { gorev: "Komut önü atama", komut: "LANG=C sort sensor.log",
      aciklama: "Komutun önüne yazılan atama yalnızca o komutun ortamına eklenir; kabuktaki LANG değişmez.",
      islemler: [{ olustur: { id: "lang", ad: "LANG=C (yalnızca sort için)", tur: "veri", etiket: "ENV" }, hedef: "cocuk" }], vurgula: ["cocuk"] },
    { gorev: "source", komut: ". ./ortam-ayarla.sh",
      aciklama: "Kaynaklanan betik yeni süreç başlatmaz; satırları mevcut kabukta çalışır. Bu nedenle cd ve export gibi değişiklikler kalıcıdır. oe-init-build-env ve SDK'nın environment-setup-* dosyaları bu yolla kullanılır.",
      islemler: [{ olustur: { id: "bd", ad: "BUILDDIR=/home/kullanici/b5/derleme", tur: "veri", etiket: "ENV" }, hedef: "ortam" }], vurgula: ["ortam", "kabuk"] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 6                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["boru-alt-kabuk"] = {
  baslik: "grep … | while read: sayaç neden sıfır kalır?",
  istasyonlar: [
    { id: "ana", ad: "Ana kabuk", yol: "PID 2240" },
    { id: "grep", ad: "Borunun sol tarafı", yol: "grep HATA sensor.log (alt süreç)" },
    { id: "dongu", ad: "Borunun sağ tarafı", yol: "while … done (alt kabuk, PID 2252)" },
    { id: "son", ad: "Sona eren alt kabuk", yol: "belleği atılır" }
  ],
  dosyalar: [
    { id: "s", ad: "sayac=0", tur: "veri", etiket: "VAR", yer: "ana" }
  ],
  kod: { baslik: "döngü", satirlar: ["sayac=0", "grep HATA sensor.log | while IFS= read -r satir; do", "    sayac=$((sayac + 1))", "done", "echo \"sayac=$sayac\"      # 0", "", "while IFS= read -r satir; do sayac=$((sayac + 1)); done < <(grep HATA sensor.log)", "echo \"sayac=$sayac\"      # 3"], tumunuGoster: true },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "bash, boru hattındaki her komutu ayrı bir süreçte çalıştırır. while döngüsü bir bileşik komut olsa da borunun bir öğesi olduğu için ana kabukta değil, bir alt kabukta çalışır.",
      vurgula: ["ana"], kodSatir: [0] },
    { gorev: "Alt kabuk kopyası", aciklama: "Alt kabuk fork ile oluşturulur ve ana kabuğun değişkenlerinin kopyasını alır: sayac=0.",
      islemler: [{ kopyala: "s", hedef: "dongu", yeniId: "k", yeniAd: "sayac=0 (kopya)" }], vurgula: ["dongu"], kodSatir: [1] },
    { gorev: "Satırlar akar", aciklama: "grep üç satır yazar; döngü her satırda kopyayı artırır.",
      islemler: [{ olustur: { id: "h1", ad: "HATA sensor2…", tur: "metin" }, hedef: "grep" }, { tasi: "h1", hedef: "dongu" }, { yeniden: "k", ad: "sayac=1 (kopya)" }, { soluk: "h1" }],
      vurgula: ["grep", "dongu"], kodSatir: [2] },
    { gorev: "sayac=3", aciklama: "Döngü sona erdiğinde kopyadaki değer 3'tür.",
      islemler: [{ olustur: { id: "h2", ad: "HATA sensor1…", tur: "metin" }, hedef: "dongu", kaynak: "h1" }, { olustur: { id: "h3", ad: "HATA sensor0…", tur: "metin" }, hedef: "dongu", kaynak: "h1" }, { soluk: "h2" }, { soluk: "h3" }, { yeniden: "k", ad: "sayac=3 (kopya)" }],
      vurgula: ["dongu"], kodSatir: [2, 3] },
    { gorev: "Alt kabuk biter", aciklama: "Alt kabuk çıkar ve belleğiyle birlikte kopya da yok olur. Ana kabuktaki sayac hiç değişmemiştir.",
      islemler: [{ tasi: "k", hedef: "son" }, { soluk: "k" }, { sil: "h1" }, { sil: "h2" }, { sil: "h3" }], vurgula: ["son", "ana"], kodSatir: [4] },
    { gorev: "Süreç ikamesi", aciklama: "< <(grep …) ile grep alt süreçte çalışır, döngü ise ana kabukta kalır ve girdisini /dev/fd/N üzerinden okur.",
      islemler: [{ olustur: { id: "h4", ad: "3 satır ← /dev/fd/63", tur: "metin" }, hedef: "grep" }, { tasi: "h4", hedef: "ana" }], vurgula: ["ana", "grep"], kodSatir: [6] },
    { gorev: "Değer korunur", aciklama: "Artırımlar doğrudan ana kabuğun değişkenine uygulanır: sayac=3. Aynı sonuç betiklerde shopt -s lastpipe ile de alınabilir; POSIX sh'de ise girdi bir dosyadan veya here-doc ile verilir.",
      islemler: [{ yeniden: "s", ad: "sayac=3" }, { soluk: "h4" }], vurgula: ["ana"], kodSatir: [7] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 7                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["trap-exit-akisi"] = {
  baslik: "Hata anında ERR ve EXIT tuzakları: saglam-sablon.sh dizin",
  istasyonlar: [
    { id: "akis", ad: "Betiğin ana akışı", yol: "set -Eeuo pipefail" },
    { id: "tuzak", ad: "Kayıtlı tuzaklar", yol: "trap -p" },
    { id: "gecici", ad: "Geçici dizin", yol: "$TMPDIR/tmp.Xq3f8ZkA1c/" },
    { id: "stderr", ad: "Standart hata", yol: "/dev/pts/0" },
    { id: "sonuc", ad: "Çağırana dönen durum", yol: "$?" }
  ],
  dosyalar: [],
  kod: { baslik: "saglam-sablon.sh (kısaltılmış)", satirlar: [
    "set -Eeuo pipefail",
    "trap temizle EXIT",
    "trap 'hata_yakala $?' ERR",
    "gecici=$(mktemp -d)",
    "sort -- \"$girdi\" > \"$gecici/sonuc\"     # satır 58",
    "mv -- \"$gecici/sonuc\" \"$cikti/...\"",
    "temizle() { local durum=$?; rm -rf -- \"$gecici\"; exit \"$durum\"; }"
  ], tumunuGoster: false },
  adimlar: [
    { gorev: "Başlangıç", komut: "./saglam-sablon.sh dizin",
      aciklama: "Betik bir dizini sıralanacak dosya olarak alır; sort bu girdiyi okuyamayacaktır. Seçenekler: -E ERR tuzağını fonksiyonlara geçirir, -e hata olunca durur, -u tanımsız değişkeni hata sayar, pipefail boru hatasını görünür kılar.",
      vurgula: ["akis"], kodGoster: [0], kodSatir: [0] },
    { gorev: "Tuzaklar kurulur", komut: "trap temizle EXIT; trap '…' ERR",
      aciklama: "EXIT tuzağı betik hangi yoldan çıkarsa çıksın (normal bitiş, exit, set -e) çalışır. ERR tuzağı, set -e'nin devreye gireceği her başarısız komuttan sonra çalışır.",
      islemler: [{ olustur: { id: "t-exit", ad: "EXIT → temizle", tur: "betik" }, hedef: "tuzak" }, { olustur: { id: "t-err", ad: "ERR → hata_yakala $?", tur: "betik" }, hedef: "tuzak" }],
      vurgula: ["tuzak"], kodGoster: [1, 2], kodSatir: [1, 2] },
    { gorev: "mktemp -d", komut: "gecici=$(mktemp -d)",
      aciklama: "mktemp tahmin edilemeyen adla, yalnızca sahibinin erişebildiği (700) bir dizin oluşturur. Sabit adlı /tmp dosyaları yarış durumlarına ve sembolik bağlantı saldırılarına açıktır.",
      islemler: [{ olustur: { id: "g", ad: "tmp.Xq3f8ZkA1c/ (drwx------)", tur: "dizin" }, hedef: "gecici" }],
      vurgula: ["gecici"], kodGoster: [3], kodSatir: [3] },
    { gorev: "sort başarısız", komut: "sort -- dizin  → durum 2",
      aciklama: "sort 'read failed: dizin: Is a directory' iletisiyle 2 durumunda çıkar. Komut bir koşulun parçası olmadığından set -e kapsamındadır.",
      islemler: [{ olustur: { id: "e1", ad: "sort: read failed: dizin: Is a directory", tur: "metin", etiket: "ERR" }, hedef: "stderr" }],
      vurgula: ["akis", "stderr"], kodGoster: [4], kodSatir: [4] },
    { gorev: "ERR tuzağı", komut: "hata_yakala 2",
      aciklama: "ERR tuzağı önce çalışır; BASH_COMMAND başarısız komutun metnini, BASH_LINENO satır numarasını verir. Tuzak çıkış yapmaz; yalnızca tanılama yazar.",
      islemler: [{ vurgu: "t-err" }, { olustur: { id: "e2", ad: "satır 58: komut başarısız (durum 2): sort -- …", tur: "metin", etiket: "ERR" }, hedef: "stderr", kaynak: "t-err" }],
      vurgula: ["tuzak", "stderr"], kodSatir: [4] },
    { gorev: "set -e çıkar", aciklama: "Ardından set -e kabuğu durumu 2 ile sonlandırmaya başlar; mv satırı hiç çalışmaz, yarım sonuç hedef dizine taşınmaz.",
      islemler: [{ not: "akis", metin: "mv çalışmadı" }], vurgula: ["akis"], kodGoster: [5], kodSatir: [5] },
    { gorev: "EXIT tuzağı", komut: "temizle",
      aciklama: "Çıkış sırasında EXIT tuzağı çalışır. İlk satırda $? (2) saklanır, geçici dizin silinir ve exit \"$durum\" ile aynı durumla çıkılır. İşleyicinin sonuna exit $? yazılsaydı rm'nin başarısı (0) betiğin hatasını gizlerdi.",
      islemler: [{ vurgu: "t-exit" }, { sil: "g" }], vurgula: ["tuzak", "gecici"], kodGoster: [6], kodSatir: [6] },
    { gorev: "Durum 2", komut: "echo $?  → 2",
      aciklama: "Çağıran (ör. CI) hatayı doğru durumla görür; geride geçici dosya kalmamıştır. SIGTERM ile sonlandırmada dash ve ash EXIT tuzağını çalıştırmaz; taşınabilir betiklerde ayrıca trap 'exit 143' TERM tanımlanır.",
      islemler: [{ notSil: "akis" }, { olustur: { id: "d", ad: "durum: 2", tur: "veri" }, hedef: "sonuc" }], vurgula: ["sonuc"] }
  ]
};

window.AkisSenaryolari["flock-kilit"] = {
  baslik: "flock ile tek örnek: iki yedekle.sh aynı anda başlatılırsa",
  istasyonlar: [
    { id: "a", ad: "Süreç A", yol: "./yedekle.sh (PID 5101)" },
    { id: "kilit", ad: "Kilit dosyası", yol: "yedekler/.yedekle.kilit" },
    { id: "b", ad: "Süreç B", yol: "./yedekle.sh (PID 5102)" },
    { id: "hedef", ad: "Yedek dizini", yol: "yedekler/" }
  ],
  dosyalar: [
    { id: "kd", ad: ".yedekle.kilit (boş dosya)", tur: "metin", yer: "kilit" }
  ],
  kod: { baslik: "yedekle.sh", satirlar: ["exec 9> \"$hedef/.yedekle.kilit\"", "if ! flock -n 9; then", "    echo \"başka bir yedekleme sürüyor\" >&2; exit 1", "fi", "gecici=$(mktemp \"$hedef/.yedek.XXXXXX\")", "tar -czf \"$gecici\" …", "mv -- \"$gecici\" \"$hedef/$ad\""], tumunuGoster: true },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Kilit, dosyanın varlığı değil, çekirdeğin bir açık dosya üzerinde tuttuğu işarettir. Dosya hep yerinde kalabilir; kilidi kimin tuttuğu çekirdek tarafından izlenir.",
      vurgula: ["kilit"] },
    { gorev: "A dosyayı açar", komut: "exec 9> .yedekle.kilit",
      aciklama: "A, kilit dosyasını fd 9 olarak açar. Bu tanımlayıcı betik boyunca açık kalır.",
      islemler: [{ olustur: { id: "a9", ad: "fd 9 → .yedekle.kilit", tur: "veri", etiket: "FD" }, hedef: "a" }], vurgula: ["a"], kodSatir: [0] },
    { gorev: "A kilidi alır", komut: "flock -n 9  → 0",
      aciklama: "flock, fd 9 üzerinde özel (exclusive) kilit ister. Başka sahip olmadığından hemen verilir.",
      islemler: [{ olustur: { id: "lk", ad: "kilit sahibi: PID 5101", tur: "veri", etiket: "LOCK" }, hedef: "kilit", kaynak: "a9" }], vurgula: ["kilit"], kodSatir: [1] },
    { gorev: "B dener", komut: "flock -n 9  → 1",
      aciklama: "B de dosyayı açar ve kilit ister. -n (beklemeden) verildiği için flock hemen 1 döndürür; B iletiyi yazıp çıkar. -n olmadan B, kilit kalkana kadar beklerdi.",
      islemler: [{ olustur: { id: "b9", ad: "fd 9 → .yedekle.kilit", tur: "veri", etiket: "FD" }, hedef: "b" }, { not: "b", metin: "başka bir yedekleme sürüyor · exit 1" }], vurgula: ["b"], kodSatir: [1, 2] },
    { gorev: "B çıkar", aciklama: "B'nin tanımlayıcısı çekirdek tarafından kapatılır; A'nın kilidi etkilenmez.",
      islemler: [{ sil: "b9" }], vurgula: ["b"] },
    { gorev: "A çalışır", komut: "tar … && mv",
      aciklama: "A arşivi geçici ada yazar ve tamamlanınca asıl adına taşır. Aynı dosya sisteminde mv (rename) atomiktir: okuyucular ya eski ya yeni dosyayı görür.",
      islemler: [{ notSil: "b" }, { olustur: { id: "y", ad: "yedek-20261102-104512.tar.gz", tur: "paket" }, hedef: "hedef", kaynak: "a9" }], vurgula: ["hedef"], kodSatir: [4, 5, 6] },
    { gorev: "Kilit kendiliğinden kalkar", aciklama: "A sona erdiğinde (normal, hata veya kill -9) çekirdek fd 9'u kapatır ve kilit kalkar. PID dosyası veya mkdir tabanlı kilitlerin aksine, çöken süreç geride 'bayat' kilit bırakmaz.",
      islemler: [{ sil: "a9" }, { sil: "lk" }], vurgula: ["kilit"] }
  ]
};

/* ---------------------------------------------------------------- */
/* Bölüm 8                                                           */
/* ---------------------------------------------------------------- */
window.AkisSenaryolari["bitbake-kabuk-gorevi"] = {
  baslik: "do_install kabuk görevi: tariften run.do_install'a, oradan ${D}'ye",
  istasyonlar: [
    { id: "tarif", ad: "Tarif", yol: "meta-ornek/recipes-ornek/sensor-izle/" },
    { id: "veri", ad: "BitBake veri deposu", yol: "ayrıştırma + genişletme" },
    { id: "temp", ad: "Görev betiği ve günlük (T)", yol: "${WORKDIR}/temp/" },
    { id: "sh", ad: "/bin/sh süreci", yol: "dash (Ubuntu) · set -e" },
    { id: "src", ad: "Kaynak dizini (S = B)", yol: "${WORKDIR}/sources/" },
    { id: "d", ad: "Geçici kök (D)", yol: "${WORKDIR}/image/" }
  ],
  dosyalar: [
    { id: "bb", ad: "sensor-izle_1.0.bb", tur: "tarif", yer: "tarif" },
    { id: "s1", ad: "sensor-izle.sh", tur: "betik", yer: "src" },
    { id: "s2", ad: "sensor-izle.default", tur: "conf", yer: "src" },
    { id: "s3", ad: "sensor-izle.service", tur: "conf", yer: "src" }
  ],
  kod: { baslik: "do_install (tarifte)", satirlar: [
    "do_install() {",
    "    install -d ${D}${bindir} ${D}${sysconfdir}/default",
    "    install -m 0755 ${S}/sensor-izle.sh ${D}${bindir}/sensor-izle",
    "    install -m 0644 ${S}/sensor-izle.default ${D}${sysconfdir}/default/sensor-izle",
    "    if ${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'true', 'false', d)}; then",
    "        install -d ${D}${systemd_system_unitdir}",
    "        install -m 0644 ${S}/sensor-izle.service ${D}${systemd_system_unitdir}/",
    "    fi",
    "}"
  ], tumunuGoster: true },
  adimlar: [
    { gorev: "Başlangıç", komut: "bitbake -c install sensor-izle",
      aciklama: "do_unpack kaynak dosyaları S dizinine açmıştır. do_install tarifte bir kabuk fonksiyonu olarak tanımlıdır; BitBake bu metni olduğu gibi çalıştırmaz.",
      vurgula: ["tarif", "src"] },
    { gorev: "Genişletme", aciklama: "BitBake fonksiyon gövdesindeki ${D}, ${bindir}, ${S} gibi kendi değişkenlerini ve ${@…} Python ifadelerini metin olarak genişletir: ${D}${bindir} → …/image/usr/bin, ${@…} → true. Kabuk değişkenleri ($i, $x) dokunulmadan kalır.",
      islemler: [{ kopyala: "bb", hedef: "veri", yeniId: "f", yeniAd: "do_install (genişletilmiş)", tur: "betik" }], vurgula: ["veri"], kodSatir: [1, 2, 3, 4] },
    { gorev: "run.do_install yazılır", komut: "temp/run.do_install.4242",
      aciklama: "BitBake bir betik dosyası üretir: #!/bin/sh, EXIT tuzağı ve set -e, export satırları, fonksiyonun genişletilmiş hali, cd '${B}' ve fonksiyon çağrısı. Kısa ad run.do_install en son betiğe bağlanır.",
      islemler: [{ tasi: "f", hedef: "temp" }, { yeniden: "f", ad: "run.do_install.4242" }, { olustur: { id: "lg", ad: "log.do_install.4242", tur: "metin" }, hedef: "temp" }],
      vurgula: ["temp"] },
    { gorev: "/bin/sh çalıştırır", aciklama: "Betik derleme makinesinin /bin/sh kabuğuyla çalışır (Debian/Ubuntu'da dash). Bash'e özgü yapılar burada sözdizimi hatası verir. Standart çıktı ve hata günlük dosyasına yazılır.",
      islemler: [{ olustur: { id: "p", ad: "sh run.do_install.4242 (cwd: sources/)", tur: "surec" }, hedef: "sh", kaynak: "f" }],
      vurgula: ["sh"] },
    { gorev: "install", komut: "install -m 0755 …/sources/sensor-izle.sh …/image/usr/bin/sensor-izle",
      aciklama: "install, cp'den farklı olarak hedef dizinde izinleri ve (yetkiliyse) sahipliği tek adımda ayarlar. Dosyalar hedef sistemdeki yollarıyla ${D} altına yerleşir.",
      islemler: [{ kopyala: "s1", hedef: "d", yeniId: "d1", yeniAd: "usr/bin/sensor-izle (0755)" }, { kopyala: "s2", hedef: "d", yeniId: "d2", yeniAd: "etc/default/sensor-izle (0644)" }],
      vurgula: ["d"], kodSatir: [1, 2, 3] },
    { gorev: "Koşullu kurulum", aciklama: "ÖrnekOS systemd kullandığından ${@…} ifadesi 'true' olarak genişletilmiştir; birim dosyası usr/lib/systemd/system altına kurulur. sysvinit dalı 'if false' olarak kalır.",
      islemler: [{ kopyala: "s3", hedef: "d", yeniId: "d3", yeniAd: "usr/lib/systemd/system/sensor-izle.service", tur: "conf" }],
      vurgula: ["d"], kodSatir: [4, 5, 6, 7] },
    { gorev: "Hata olursa", komut: "install: cannot stat '…/sensor-izle.servis'",
      aciklama: "Bir komut başarısız olursa set -e betiği durdurur, EXIT tuzağı 'WARNING: exit code 1 from a shell command.' yazar. BitBake görevi başarısız sayar ve günlüğün yolunu bildirir.",
      islemler: [{ yeniden: "lg", ad: "log.do_install.4242 (WARNING: exit code 1…)" }, { vurgu: "lg" }], vurgula: ["temp"] },
    { gorev: "Sonraki görev", komut: "do_package",
      aciklama: "Başarılı bir do_install sonrası ${D} içeriği paketlemeye girer. Sahiplik ve izinler pseudo (fakeroot) ortamında kaydedilir; bu nedenle do_install içinde chown kullanılabilir.",
      islemler: [{ sil: "p" }], vurgula: ["d"] }
  ]
};

window.AkisSenaryolari["init-baslatma"] = {
  baslik: "SysVinit ile açılış: /sbin/init'ten sensor-izle servisine",
  istasyonlar: [
    { id: "kernel", ad: "Çekirdek", yol: "init=/sbin/init" },
    { id: "init", ad: "init (PID 1)", yol: "/sbin/init · /etc/inittab" },
    { id: "rcs", ad: "Erken açılış", yol: "/etc/init.d/rcS → /etc/rcS.d/S*" },
    { id: "rc5", ad: "Çalışma düzeyi 5", yol: "/etc/init.d/rc 5 → /etc/rc5.d/S*" },
    { id: "betik", ad: "Init betiği", yol: "/etc/init.d/sensor-izle start" },
    { id: "servis", ad: "Servis süreci", yol: "/bin/sh /usr/bin/sensor-izle" }
  ],
  dosyalar: [
    { id: "it", ad: "inittab: si::sysinit:/etc/init.d/rcS", tur: "conf", yer: "init" },
    { id: "it5", ad: "inittab: l5:5:wait:/etc/init.d/rc 5", tur: "conf", yer: "init" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Çekirdek kök dosya sistemini bağladıktan sonra ilk kullanıcı alanı sürecini (PID 1) başlatır. Poky'nin varsayılanı SysVinit'tir; BusyBox init de benzer bir inittab biçimi kullanır.",
      vurgula: ["kernel"] },
    { gorev: "init", komut: "execve(\"/sbin/init\")",
      aciklama: "init, /etc/inittab dosyasını okur ve sysinit girdisini çalıştırır.",
      islemler: [{ olustur: { id: "pid1", ad: "init (PID 1)", tur: "surec" }, hedef: "init" }], vurgula: ["init"] },
    { gorev: "rcS", komut: "/etc/init.d/rcS",
      aciklama: "rcS, /etc/rcS.d altındaki S ile başlayan bağlantıları ad sırasıyla 'start' argümanıyla çalıştırır: dosya sistemlerinin bağlanması, udev, ana makine adı…",
      islemler: [{ tasi: "it", hedef: "rcs" }, { olustur: { id: "s1", ad: "S…sysfs.sh, S…udev, S…mountall.sh …", tur: "betik" }, hedef: "rcs" }], vurgula: ["rcs"] },
    { gorev: "rc 5", komut: "/etc/init.d/rc 5",
      aciklama: "Ardından varsayılan çalışma düzeyinin dizini işlenir. update-rc.d sınıfı INITSCRIPT_PARAMS = \"defaults 90 10\" ile rc2-5.d altına S90, rc0/1/6.d altına K10 bağlantısı oluşturmuştur. Bu işi, imaj oluşturulurken paketin kurulum sonrası betiğine eklenen update-rc.d -r $D çağrısı yapar.",
      islemler: [{ tasi: "it5", hedef: "rc5" }, { olustur: { id: "s90", ad: "S90sensor-izle → ../init.d/sensor-izle", tur: "betik" }, hedef: "rc5" }], vurgula: ["rc5"] },
    { gorev: "start", komut: "/etc/init.d/sensor-izle start",
      aciklama: "Bağlantı sıradaki numarasıyla çalışır. Betik POSIX sh ile yazılmıştır: hedefteki /bin/sh BusyBox ash'tir ve bash bulunmayabilir.",
      islemler: [{ kopyala: "s90", hedef: "betik", yeniId: "ib", yeniAd: "sensor-izle start", tur: "betik" }], vurgula: ["betik"] },
    { gorev: "start-stop-daemon", komut: "start-stop-daemon -S -b -m -p /run/sensor-izle.pid -x /bin/sh -- -c 'exec …'",
      aciklama: "Program arka plana alınır, PID dosyası yazılır. Ara kabuk çıktıyı /var/log/sensor-izle.log dosyasına yönlendirir ve exec ile programa dönüşür; PID değişmez.",
      islemler: [{ olustur: { id: "sv", ad: "sensor-izle (PID 412) · stdout → /var/log/sensor-izle.log", tur: "surec" }, hedef: "servis", kaynak: "ib" }, { olustur: { id: "pidf", ad: "/run/sensor-izle.pid", tur: "metin" }, hedef: "betik" }],
      vurgula: ["servis"] },
    { gorev: "Kapanış", komut: "/etc/rc0.d/K10sensor-izle stop",
      aciklama: "Kapanışta K bağlantıları 'stop' ile çalışır; betik PID dosyasındaki sürece SIGTERM gönderir ve program trap ile temiz biçimde çıkar. systemd kullanan ÖrnekOS'ta aynı işi sensor-izle.service birimi yapar.",
      islemler: [{ sil: "sv" }, { sil: "pidf" }, { yeniden: "ib", ad: "sensor-izle stop" }], vurgula: ["betik"] }
  ]
};


/* ---------------------------------------------------------------- */
/* Terminal oturumları                                               */
/* ---------------------------------------------------------------- */

window.TerminalOturumlari["komut-turleri"] = {
 "baslik": "Bir adın hangi tür komuta karşılık geldiğinin bulunması",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "yorum": true,
   "komut": "type -a, bir adın tüm olası karşılıklarını arama sırasıyla listeler"
  },
  {
   "komut": "type -a echo",
   "cikti": "echo is a shell builtin\necho is /usr/bin/echo\necho is /bin/echo",
   "aciklama": "echo hem yerleşik hem dış komut olarak vardır. Yerleşik önce bulunduğundan /usr/bin/echo çalışmaz. /bin bu sistemde /usr/bin'e bağlantı olduğu için aynı dosya iki kez görünür."
  },
  {
   "komut": "alias ll='ls -l'\ntype ll",
   "cikti": "ll is aliased to `ls -l'",
   "aciklama": "Takma ad, sözcük düzeyinde bir metin değiştirmedir; type bunun hangi metne açılacağını gösterir."
  },
  {
   "komut": "type cd if",
   "cikti": "cd is a shell builtin\nif is a shell keyword",
   "aciklama": "cd yerleşiktir; ayrı bir süreç kendi dizinini değiştirse bile kabuğun dizini değişmezdi. if ise ayrılmış sözcüktür (keyword)."
  },
  {
   "komut": "son() { tail -n \"${1:-5}\" /etc/passwd; }\ntype son",
   "cikti": "son is a function\nson () \n{ \n    tail -n \"${1:-5}\" /etc/passwd\n}",
   "aciklama": "Kabuk fonksiyonu, kabuğun belleğinde tutulan bir komut grubudur. type, fonksiyonun gövdesini kabuğun kendi biçimlendirmesiyle yazar."
  },
  {
   "komut": "type -t ll cd if son ls",
   "cikti": "alias\nbuiltin\nkeyword\nfunction\nfile",
   "aciklama": "-t yalnızca türü yazar: alias, builtin, keyword, function, file. Betiklerde bir adın türünü sınamak için kullanışlıdır."
  },
  {
   "komut": "command -v ls cd ll",
   "cikti": "/usr/bin/ls\ncd\nalias ll='ls -l'",
   "aciklama": "command -v POSIX'tir ve betiklerde which yerine tercih edilir: dış komut için tam yolu, yerleşik için yalnızca adı, takma ad için tanımını yazar."
  },
  {
   "komut": "ls / >/dev/null; hash",
   "cikti": "hits\tcommand\n   1\t/usr/bin/ls",
   "aciklama": "Bir dış komut ilk çalıştırıldığında bulunan yol hash tablosuna yazılır; sonraki çağrılarda PATH yeniden taranmaz."
  }
 ]
};

window.TerminalOturumlari["path-arama"] = {
 "baslik": "PATH araması ve hash tablosu",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "echo \"$PATH\" | tr ':' '\\n'",
   "cikti": "/usr/local/sbin\n/usr/local/bin\n/usr/sbin\n/usr/bin\n/sbin\n/bin",
   "aciklama": "PATH, iki nokta üst üste ile ayrılmış dizin listesidir. Kabuk bu dizinleri soldan sağa tarar ve ilk eşleşmede durur."
  },
  {
   "komut": "mkdir -p ~/bin\ninstall -m 0755 \"$ORNEK/01-kabuk/sensor-oku\" ~/bin/\nsensor-oku 2",
   "cikti": "bash: sensor-oku: command not found",
   "aciklama": "Dosya çalıştırılabilir olsa da bulunduğu dizin PATH listesinde olmadığından kabuk onu bulamaz. Çıkış durumu 127'dir.",
   "hata": true
  },
  {
   "komut": "~/bin/sensor-oku 2",
   "cikti": "Örnek ağ geçidi · sensör okuması\n  sensor0  okuma 1     21.0 C\n  sensor0  okuma 2     21.4 C",
   "aciklama": "Adın içinde eğik çizgi varsa PATH araması yapılmaz; dosya doğrudan verilen yoldan çalıştırılır."
  },
  {
   "komut": "PATH=\"$HOME/bin:$PATH\"\nsensor-oku 2",
   "cikti": "Örnek ağ geçidi · sensör okuması\n  sensor0  okuma 1     21.0 C\n  sensor0  okuma 2     21.4 C",
   "aciklama": "Dizin PATH başına eklendiğinde komut adıyla çalışır. Başa eklenen dizin, sistem dizinlerindeki aynı adlı komutları gölgeler."
  },
  {
   "komut": "hash",
   "cikti": "hits\tcommand\n   1\t/home/kullanici/bin/sensor-oku",
   "aciklama": "Bulunan yol hash tablosuna kaydedilmiştir; hits sütunu kaç kez kullanıldığını gösterir."
  },
  {
   "komut": "mkdir -p ~/.local/bin\nmv ~/bin/sensor-oku ~/.local/bin/\nsensor-oku 2",
   "cikti": "bash: /home/kullanici/bin/sensor-oku: No such file or directory",
   "aciklama": "Dosya taşındığında kabuk, hash tablosundaki eski yolu kullanmaya devam eder ve hata verir. Bu, bash'in varsayılan davranışıdır (checkhash seçeneği kapalı).",
   "hata": true
  },
  {
   "komut": "PATH=\"$PATH:$HOME/.local/bin\"\nsensor-oku 2",
   "cikti": "Örnek ağ geçidi · sensör okuması\n  sensor0  okuma 1     21.0 C\n  sensor0  okuma 2     21.4 C",
   "aciklama": "PATH değişkenine değer atanması hash tablosunu boşaltır; PATH yeniden taranır ve yeni konum bulunur. PATH değişmeden tabloyu boşaltmak için hash -r kullanılır."
  },
  {
   "komut": "type sensor-oku",
   "cikti": "sensor-oku is hashed (/home/kullanici/.local/bin/sensor-oku)",
   "aciklama": "type, bir dış komut tablodaysa bunu 'hashed' olarak belirtir."
  }
 ]
};

window.TerminalOturumlari["gecmis-yardim"] = {
 "baslik": "Yardım kaynakları ve geçmiş genişletme",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "help -d cd pwd type",
   "cikti": "cd - Change the shell working directory.\npwd - Print the name of the current working directory.\ntype - Display information about command type.",
   "aciklama": "help yalnızca bash yerleşikleri için bilgi verir; -d kısa açıklamayı yazar. Dış komutlar için man veya --help kullanılır."
  },
  {
   "komut": "ls --help | head -n 4",
   "cikti": "Usage: ls [OPTION]... [FILE]...\nList information about the FILEs (the current directory by default).\nSort entries alphabetically if none of -cftuvSUX nor --sort is specified.",
   "aciklama": "GNU araçlarının çoğu --help ile kullanım özetini standart çıktıya yazar; bu nedenle head veya grep ile süzülebilir."
  },
  {
   "komut": "set -o history -o histexpand",
   "cikti": "",
   "aciklama": "Bu iki seçenek etkileşimli kabukta zaten açıktır. Burada, oturum betik olarak kaydedildiği için açıkça etkinleştirilir."
  },
  {
   "komut": "./sensor-oku 2",
   "cikti": "Örnek ağ geçidi · sensör okuması\n  sensor0  okuma 1     21.0 C\n  sensor0  okuma 2     21.4 C",
   "aciklama": "Geçmiş genişletmeyi göstermek için önce bir komut çalıştırılır."
  },
  {
   "komut": "!!",
   "cikti": "./sensor-oku 2\nÖrnek ağ geçidi · sensör okuması\n  sensor0  okuma 1     21.0 C\n  sensor0  okuma 2     21.4 C",
   "aciklama": "!! önceki komutun tamamına genişler. Kabuk, genişletilmiş satırı çalıştırmadan önce ekrana yazar."
  },
  {
   "komut": "ls -l /etc/hostname",
   "cikti": "-rw-r--r-- 1 root root 3 Nov  2 20:15 /etc/hostname",
   "aciklama": "Uzun bir yol içeren bir komut çalıştırılır."
  },
  {
   "komut": "wc -c !$",
   "cikti": "wc -c /etc/hostname\n3 /etc/hostname",
   "aciklama": "!$ önceki komutun son sözcüğüdür. Uzun bir yolu yeniden yazmadan başka bir komuta vermek için kullanılır."
  },
  {
   "komut": "history 4",
   "cikti": "    2  ./sensor-oku 2\n    3  ls -l /etc/hostname\n    4  wc -c /etc/hostname\n    5  history 4",
   "aciklama": "history listesi numaralıdır; !n ile n numaralı komut, !ls ile ls ile başlayan son komut yeniden çalıştırılır."
  }
 ]
};

window.TerminalOturumlari["inode-baglanti"] = {
 "baslik": "inode, sabit bağlantı ve sembolik bağlantı",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/deneme\necho 'aralik=5' > sensor.conf\nls -li sensor.conf",
   "cikti": "903178 -rw-r--r-- 1 kullanici kullanici 9 Nov  2 21:24 sensor.conf",
   "aciklama": "İlk sütun inode numarası, izinlerden sonraki sayı bağlantı sayısıdır. Dosya adı inode'da değil, dizin kaydında tutulur."
  },
  {
   "komut": "ln sensor.conf sabit.conf\nln -s sensor.conf sembolik.conf\nls -li",
   "cikti": "total 8\n903178 -rw-r--r-- 2 kullanici kullanici  9 Nov  2 21:24 sabit.conf\n903179 lrwxrwxrwx 1 kullanici kullanici 11 Nov  2 21:24 sembolik.conf -> sensor.conf\n903178 -rw-r--r-- 2 kullanici kullanici  9 Nov  2 21:24 sensor.conf",
   "aciklama": "Sabit bağlantı aynı inode'u gösteren ikinci bir dizin kaydıdır; bağlantı sayısı 2 olur. Sembolik bağlantı ise kendi inode'u olan ve içinde yalnızca hedef yolu taşıyan ayrı bir dosyadır.",
   "istem": "kullanici@agecidi:~/deneme$"
  },
  {
   "komut": "stat -c '%i %h %s %F %n' sensor.conf sabit.conf sembolik.conf",
   "cikti": "903178 2 9 regular file sensor.conf\n903178 2 9 regular file sabit.conf\n903179 1 11 symbolic link sembolik.conf",
   "aciklama": "stat ile inode, bağlantı sayısı, bayt cinsinden boyut ve tür görülür. Sembolik bağlantının boyutu, hedef yolun uzunluğudur ('sensor.conf' 11 bayttır).",
   "istem": "kullanici@agecidi:~/deneme$"
  },
  {
   "komut": "rm sensor.conf\ncat sabit.conf",
   "cikti": "aralik=5",
   "aciklama": "rm dosyayı değil, bir dizin kaydını siler (unlink). Bağlantı sayısı 0'a inmedikçe veri yerinde kalır.",
   "istem": "kullanici@agecidi:~/deneme$"
  },
  {
   "komut": "cat sembolik.conf",
   "cikti": "cat: sembolik.conf: No such file or directory",
   "aciklama": "Sembolik bağlantı ada bağlıdır; hedef ad kaldırıldığında bağlantı kırık hale gelir.",
   "istem": "kullanici@agecidi:~/deneme$",
   "hata": true
  },
  {
   "komut": "readlink sembolik.conf; ls -l sembolik.conf",
   "cikti": "sensor.conf\nlrwxrwxrwx 1 kullanici kullanici 11 Nov  2 21:24 sembolik.conf -> sensor.conf",
   "aciklama": "Kırık bağlantı varlığını sürdürür; readlink içindeki yolu yazar. Yeni bir sensor.conf oluşturulursa bağlantı yeniden çalışır.",
   "istem": "kullanici@agecidi:~/deneme$"
  },
  {
   "komut": "ln /etc/hostname ~/deneme/hn",
   "cikti": "ln: failed to create hard link '/home/kullanici/deneme/hn' => '/etc/hostname': Operation not permitted",
   "aciklama": "Sabit bağlantı, dizinler arasında yalnızca aynı dosya sistemi içinde ve bağlantıyı yapanın yetkisi yetiyorsa kurulabilir. Bu sistemde fs.protected_hardlinks etkin olduğundan, başkasına ait bir dosyaya sabit bağlantı reddedilir.",
   "istem": "kullanici@agecidi:~/deneme$",
   "hata": true
  }
 ]
};

window.TerminalOturumlari["izinler-umask"] = {
 "baslik": "İzin bitleri, umask ve özel bitler",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/izin\numask\ntouch dosya; mkdir dizin\nls -ld dosya dizin",
   "cikti": "0022\ndrwxr-xr-x 2 kullanici kullanici 4096 Nov  2 21:24 dizin\n-rw-r--r-- 1 kullanici kullanici    0 Nov  2 21:24 dosya",
   "aciklama": "Yeni dosyalar 666, dizinler 777 istenerek oluşturulur; umask (022) bu istekten yazma bitlerini çıkarır: 644 ve 755."
  },
  {
   "komut": "umask 077; touch gizli; umask 022\nstat -c '%A %a %n' gizli",
   "cikti": "-rw------- 600 gizli",
   "aciklama": "umask 077 grup ve diğerlerinin tüm haklarını çıkarır. %A simgesel, %a sekizli gösterimdir.",
   "istem": "kullanici@agecidi:~/izin$"
  },
  {
   "komut": "printf '#!/bin/sh\\necho calisti\\n' > betik.sh\n./betik.sh",
   "cikti": "bash: ./betik.sh: Permission denied",
   "aciklama": "Yürütme biti olmayan dosya, içeriği geçerli bir betik olsa da çalıştırılamaz; çıkış durumu 126'dır.",
   "istem": "kullanici@agecidi:~/izin$",
   "hata": true
  },
  {
   "komut": "chmod u+x,go-r betik.sh; stat -c '%A %a' betik.sh; ./betik.sh",
   "cikti": "-rwx------ 700\ncalisti",
   "aciklama": "Simgesel chmod mevcut bitleri değiştirir: sahibe yürütme eklenir, grup ve diğerlerinden okuma kaldırılır.",
   "istem": "kullanici@agecidi:~/izin$"
  },
  {
   "komut": "chmod a-x dizin; ls dizin; cd dizin",
   "cikti": "bash: cd: dizin: Permission denied",
   "aciklama": "Dizinde r biti adları listelemeye, x biti dizine girmeye ve içindeki adları kullanmaya izin verir. x kaldırıldığında ls çalışır, cd reddedilir.",
   "istem": "kullanici@agecidi:~/izin$",
   "hata": true
  },
  {
   "komut": "chmod 755 dizin\nls -ld /tmp; stat -c '%A %a %U %n' /usr/bin/passwd",
   "cikti": "drwxrwxrwt 33 root root 4096 Nov  2 21:24 /tmp\n-rwsr-xr-x 4755 root /usr/bin/passwd",
   "aciklama": "/tmp'deki t (yapışkan bit, 1000) herkesin yazabildiği dizinde yalnızca dosya sahibinin dosyasını silebilmesini sağlar. passwd'deki s (setuid, 4000) programın dosya sahibinin (root) kimliğiyle çalışmasını sağlar.",
   "istem": "kullanici@agecidi:~/izin$"
  },
  {
   "komut": "find /usr/bin /usr/sbin -perm -4000 -type f | head -n 5",
   "cikti": "/usr/bin/fusermount3\n/usr/bin/sudo\n/usr/bin/chfn\n/usr/bin/chsh\n/usr/bin/gpasswd",
   "aciklama": "-perm -4000, setuid biti açık dosyaları bulur. Gömülü imajlarda bu liste düzenli olarak denetlenmeli ve olabildiğince kısa tutulmalıdır.",
   "istem": "kullanici@agecidi:~/izin$"
  }
 ]
};

window.TerminalOturumlari["rootfs-denetim"] = {
 "baslik": "Örnek rootfs dizininin denetlenmesi",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "~/araclar/ornek-rootfs-olustur.sh ~/rootfs\nls ~/rootfs",
   "cikti": "bin\ndata\ndev\netc\nhome\nproc\nrun\nsbin\nsys\ntmp\nusr\nvar",
   "aciklama": "Betik, Yocto imajlarındaki dizin düzenine benzeyen küçük bir kök dizin oluşturur."
  },
  {
   "komut": "cd ~/rootfs\nstat -c '%A  %N' bin/* var/*",
   "cikti": "-rwxr-xr-x  'bin/busybox'\nlrwxrwxrwx  'bin/cat' -> 'busybox'\nlrwxrwxrwx  'bin/ls' -> 'busybox'\nlrwxrwxrwx  'bin/mount' -> 'busybox'\nlrwxrwxrwx  'bin/sh' -> 'busybox'\n-rwsr-xr-x  'bin/su'\nlrwxrwxrwx  'var/log' -> 'volatile/log'\nlrwxrwxrwx  'var/tmp' -> 'volatile/tmp'\ndrwxr-xr-x  'var/volatile'",
   "aciklama": "BusyBox uygulamaları tek ikiliye sembolik bağlantıdır. /var/log ve /var/tmp, RAM'deki /var/volatile altına yönlendirilmiştir. Bağlantılar göreli yazıldığından rootfs dizini derleme makinesinde incelenirken de doğru yeri gösterir."
  },
  {
   "komut": "~/araclar/rootfs-denetle.sh .",
   "cikti": "== setuid/setgid dosyalar\n  -rwsr-xr-x 1 kullanici kullanici 18 Nov  2 21:24 ./bin/su\n== herkesin yazabildiği dosyalar\n  ./data/kalibrasyon.csv\n== yapışkan biti olmayan, herkesin yazabildiği dizinler\n== kırık sembolik bağlantılar\n  ./etc/kirik-baglanti -> ../usr/bin/yok",
   "aciklama": "Denetim betiği find ile setuid dosyaları, herkesin yazabildiği dosyaları, yapışkan biti eksik dizinleri ve kırık bağlantıları bulur. Örnekteki kasıtlı hatalar raporlanmıştır.",
   "istem": "kullanici@agecidi:~/rootfs$"
  },
  {
   "komut": "du -sh .; find . -type l | wc -l",
   "cikti": "104K\t.\n7",
   "aciklama": "du disk kullanımını, find ile sayılan sembolik bağlantılar BusyBox tabanlı bir sistemdeki bağlantı yoğunluğunu gösterir.",
   "istem": "kullanici@agecidi:~/rootfs$"
  }
 ]
};

window.TerminalOturumlari["grep-ifadeler"] = {
 "baslik": "grep ile günlük süzme: BRE, ERE ve sabit dizgiler",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/gunluk\ngrep -c HATA sensor.log",
   "cikti": "3",
   "aciklama": "-c eşleşen satır sayısını verir. grep, eşleşme bulduğunda 0, bulamadığında 1, hata durumunda 2 ile çıkar."
  },
  {
   "komut": "grep -n -E 'HATA|UYARI' sensor.log",
   "cikti": "12:2026-11-02T10:01:20 agecidi sensor-oku[412]: HATA sensor2: okuma zaman aşımı (i2c-1, adres 0x48)\n18:2026-11-02T10:01:50 agecidi modbus-izle[455]: UYARI bağlantı yeniden kuruldu: 192.168.7.10:502\n26:2026-11-02T10:02:45 agecidi sensor-oku[412]: HATA sensor1: okuma zaman aşımı (i2c-1, adres 0x48)\n31:2026-11-02T10:03:10 agecidi sensor-oku[412]: HATA sensor0: CRC uyuşmazlığı",
   "aciklama": "-E genişletilmiş düzenli ifade (ERE) kullanır; | seçenek işlecidir. -n satır numarasını ekler.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "grep 'sicaklik=2[6-9]\\.[0-9]' sensor.log",
   "cikti": "2026-11-02T10:02:00 agecidi sensor-oku[412]: sensor1 sicaklik=27.0 durum=ESIK\n2026-11-02T10:02:20 agecidi sensor-oku[412]: sensor1 sicaklik=27.6 durum=ESIK\n2026-11-02T10:03:00 agecidi sensor-oku[412]: sensor1 sicaklik=27.2 durum=ESIK",
   "aciklama": "Köşeli parantez bir karakter kümesidir. Nokta herhangi bir karakterle eşleştiği için gerçek nokta \\. ile kaçırılır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "grep -c 'sensor[0-9]\\{1,\\} sicaklik' sensor.log; grep -cE 'sensor[0-9]{1,} sicaklik' sensor.log",
   "cikti": "32\n32",
   "aciklama": "Temel düzenli ifadede (BRE) {} tekrar işleci ters eğik çizgiyle yazılır; ERE'de doğrudan kullanılır. Sonuç aynıdır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "grep -o 'sicaklik=[0-9.]*' sensor.log | sort -t= -k2 -n | tail -n 3",
   "cikti": "sicaklik=27.0\nsicaklik=27.2\nsicaklik=27.6",
   "aciklama": "-o yalnızca eşleşen parçayı yazar. sort -t= -k2 -n, = işaretinden sonraki alanı sayı olarak sıralar.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "grep -F '0x48' sensor.log | wc -l\ngrep -A1 UYARI sensor.log",
   "cikti": "2\n2026-11-02T10:01:50 agecidi modbus-izle[455]: UYARI bağlantı yeniden kuruldu: 192.168.7.10:502\n2026-11-02T10:01:55 agecidi sensor-oku[412]: sensor0 sicaklik=21.3 durum=TAMAM",
   "aciklama": "-F kalıbı düzenli ifade değil sabit dizgi olarak arar (daha hızlı ve kaçırma gerektirmez). -A1 eşleşmeden sonraki bir satırı da gösterir.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "grep -v TAMAM sensor.log | grep -v ESIK",
   "cikti": "2026-11-02T10:01:20 agecidi sensor-oku[412]: HATA sensor2: okuma zaman aşımı (i2c-1, adres 0x48)\n2026-11-02T10:01:50 agecidi modbus-izle[455]: UYARI bağlantı yeniden kuruldu: 192.168.7.10:502\n2026-11-02T10:02:45 agecidi sensor-oku[412]: HATA sensor1: okuma zaman aşımı (i2c-1, adres 0x48)\n2026-11-02T10:03:10 agecidi sensor-oku[412]: HATA sensor0: CRC uyuşmazlığı",
   "aciklama": "-v eşleşmeyen satırları seçer. Normal ölçüm dışındaki tüm satırlar böylece görülür.",
   "istem": "kullanici@agecidi:~/gunluk$"
  }
 ]
};

window.TerminalOturumlari["sed-awk"] = {
 "baslik": "sed ile düzenleme, awk ile alan işleme",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/gunluk\nsed -n '12,14p' sensor.log",
   "cikti": "2026-11-02T10:01:20 agecidi sensor-oku[412]: HATA sensor2: okuma zaman aşımı (i2c-1, adres 0x48)\n2026-11-02T10:01:25 agecidi sensor-oku[412]: sensor0 sicaklik=21.9 durum=TAMAM\n2026-11-02T10:01:30 agecidi sensor-oku[412]: sensor1 sicaklik=23.7 durum=TAMAM",
   "aciklama": "-n otomatik yazdırmayı kapatır; p komutu yalnızca adreslenen satırları (12-14) yazar."
  },
  {
   "komut": "sed -e 's/#.*//' -e '/^[[:space:]]*$/d' sensor.conf",
   "cikti": "aralik=5\ni2c_yolu=/dev/i2c-1\nadres=0x48\nesik=26.0\ngunluk=/var/log/sensor.log",
   "aciklama": "İlk ifade # ile başlayan yorumu siler, ikincisi boş veya yalnızca boşluk içeren satırları siler. Bir yapılandırma dosyasının etkin satırları böyle çıkarılır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "sed -i.yedek 's/^aralik=.*/aralik=10/' sensor.conf\ndiff sensor.conf.yedek sensor.conf",
   "cikti": "3c3\n< aralik=5\n---\n> aralik=10",
   "aciklama": "-i dosyayı yerinde değiştirir; ek verilirse (.yedek) önce yedek alınır. GNU sed'de -i eki bitişik yazılır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "sed -n '/UYARI/,/sensor2/p' sensor.log",
   "cikti": "2026-11-02T10:01:50 agecidi modbus-izle[455]: UYARI bağlantı yeniden kuruldu: 192.168.7.10:502\n2026-11-02T10:01:55 agecidi sensor-oku[412]: sensor0 sicaklik=21.3 durum=TAMAM\n2026-11-02T10:02:00 agecidi sensor-oku[412]: sensor1 sicaklik=27.0 durum=ESIK\n2026-11-02T10:02:05 agecidi sensor-oku[412]: sensor2 sicaklik=20.0 durum=TAMAM",
   "aciklama": "İki düzenli ifadeyle aralık adreslemesi: UYARI içeren satırdan, sonraki ilk sensor2 satırına kadar.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "awk '$4 == \"sensor1\" { print $1, $5 }' sensor.log | head -n 3",
   "cikti": "2026-11-02T10:00:15 sicaklik=23.9\n2026-11-02T10:00:30 sicaklik=24.3\n2026-11-02T10:00:50 sicaklik=23.0",
   "aciklama": "awk her satırı boşluklara göre alanlara böler. Desen koşulu sağlanan satırlarda eylem çalışır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "awk -F'[ =]' '$4 ~ /^sensor/ && $6 > 27 { print $4, $6 }' sensor.log",
   "cikti": "sensor1 27.6\nsensor1 27.2",
   "aciklama": "-F ile ayırıcı düzenli ifade olur: boşluk veya =. Alan değerleri sayı gibi göründüğünde sayısal karşılaştırma yapılır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  },
  {
   "komut": "awk -f sensor-ozet.awk sensor.log",
   "cikti": "sensor    adet    min    max    ort  esik  hata\nsensor0     11   20.5   21.9  21.18     0     1\nsensor1     11   23.0   27.6  24.62     3     1\nsensor2     10   19.3   20.4  19.89     0     1",
   "aciklama": "İlişkisel diziler (adet[s], toplam[s]) ile sensör başına istatistik üretilir; END bloğu tüm satırlar okunduktan sonra çalışır.",
   "istem": "kullanici@agecidi:~/gunluk$"
  }
 ]
};

window.TerminalOturumlari["find-xargs"] = {
 "baslik": "find ve xargs: boşluk içeren adlar ve gruplama",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/kaynak\nfind . -name '*.c'",
   "cikti": "./src/surucu/i2c.c\n./src/surucu/spi.c\n./src/sensor okuyucu.c\n./src/ana.c\n./build/tmp/uretilen.c",
   "aciklama": "find dizin ağacını özyinelemeli gezer; -name kalıbı tırnak içinde yazılır, aksi halde kabuk kalıbı find'dan önce genişletebilir.",
   "istem": "kullanici@agecidi:~/kaynak$"
  },
  {
   "komut": "find . -name '*.c' | xargs wc -l",
   "cikti": " 1 ./src/surucu/i2c.c\n 1 ./src/surucu/spi.c\nwc: ./src/sensor: No such file or directory\nwc: okuyucu.c: No such file or directory\n 1 ./src/ana.c\n 1 ./build/tmp/uretilen.c\n 4 total",
   "aciklama": "xargs girdiyi boşluklardan böler: 'sensor okuyucu.c' iki ayrı argümana dönüşür ve wc iki olmayan dosya arar.",
   "istem": "kullanici@agecidi:~/kaynak$",
   "hata": true
  },
  {
   "komut": "find . -name '*.c' -print0 | xargs -0 wc -l",
   "cikti": " 1 ./src/surucu/i2c.c\n 1 ./src/surucu/spi.c\n 2 ./src/sensor okuyucu.c\n 1 ./src/ana.c\n 1 ./build/tmp/uretilen.c\n 6 total",
   "aciklama": "-print0 adları NUL baytıyla ayırır; xargs -0 yalnızca NUL'dan böler. Dosya adlarında NUL bulunamayacağından bu yöntem her ad için güvenlidir.",
   "istem": "kullanici@agecidi:~/kaynak$"
  },
  {
   "komut": "find . -path ./build -prune -o -name '*.c' -print",
   "cikti": "./src/surucu/i2c.c\n./src/surucu/spi.c\n./src/sensor okuyucu.c\n./src/ana.c",
   "aciklama": "-prune, eşleşen dizine inilmesini engeller. -o (veya) ile birleşir; sondaki -print yalnızca ikinci dalda çalışır.",
   "istem": "kullanici@agecidi:~/kaynak$"
  },
  {
   "komut": "find . -name '*.c' -print0 | xargs -0 -n 2 echo grup:",
   "cikti": "grup: ./src/surucu/i2c.c ./src/surucu/spi.c\ngrup: ./src/sensor okuyucu.c ./src/ana.c\ngrup: ./build/tmp/uretilen.c",
   "aciklama": "-n 2 her çağrıya en fazla iki argüman verir. Varsayılanda xargs, sistemin argüman sınırına sığdığı kadar argümanı tek çağrıda toplar.",
   "istem": "kullanici@agecidi:~/kaynak$"
  },
  {
   "komut": "find src -type f -newer src/ana.c -exec ls {} +\nfind src -name '*.c' -size -100c -exec grep -l 'int c' {} \\;",
   "cikti": "src/sensor okuyucu.c\nsrc/surucu/spi.c\nsrc/sensor okuyucu.c",
   "aciklama": "-exec ... {} + adları gruplayarak çağırır (xargs gibi); -exec ... {} \\; her dosya için ayrı süreç başlatır. -newer ana.c'den sonra değiştirilen dosyaları, -size -100c 100 bayttan küçük dosyaları seçer.",
   "istem": "kullanici@agecidi:~/kaynak$"
  }
 ]
};

window.TerminalOturumlari["bitbake-cikti-analizi"] = {
 "baslik": "BitBake çıktısının metin araçlarıyla özetlenmesi",
 "istem": "gelistirici@derleme:~$",
 "adimlar": [
  {
   "yorum": true,
   "komut": "bitbake-cikti.txt, 'bitbake ornek-image 2>&1 | tee derleme.log' ile kaydedilmiş temsili bir çıktıdır"
  },
  {
   "komut": "cd ~/gunluk\ngrep -E '^(WARNING|ERROR):' bitbake-cikti.txt | cut -d: -f1 | sort | uniq -c",
   "cikti": "      3 ERROR\n      4 WARNING",
   "aciklama": "Satır başındaki düzey sözcükleri cut ile ayrılır; sort | uniq -c her düzeyin sayısını verir."
  },
  {
   "komut": "grep -oE '\\[[a-z][a-z0-9-]*\\]$' bitbake-cikti.txt | sort | uniq -c | sort -rn",
   "cikti": "      2 [ldflags]\n      1 [installed-vs-shipped]\n      1 [file-rdeps]",
   "aciklama": "QA uyarılarının etiketi satır sonunda köşeli parantez içindedir. Aynı tür uyarıların toplu çözümü için sayım önemlidir.",
   "istem": "gelistirici@derleme:~/gunluk$"
  },
  {
   "komut": "sed -n 's/^WARNING: \\([^ ]*\\)-[0-9.]*-r[0-9]* .*/\\1/p' bitbake-cikti.txt | sort -u",
   "cikti": "alarm-izle\nkalibrasyon-veri\nolcum-gunluk\nsaglik-kontrol",
   "aciklama": "BRE yakalama grubu \\( \\) ile PN-PV-PR biçimindeki tarif adından PN kısmı çıkarılır.",
   "istem": "gelistirici@derleme:~/gunluk$"
  },
  {
   "komut": "./bitbake-ozet.sh bitbake-cikti.txt",
   "cikti": "== QA uyarı türleri\n      2 [ldflags]\n      1 [installed-vs-shipped]\n      1 [file-rdeps]\n== Uyarı veren tarif ve görevler\n  kalibrasyon-veri-1.0-r0 do_package_qa\n  olcum-gunluk-1.0-r0 do_package_qa\n  alarm-izle-1.0-r0 do_package_qa\n  saglik-kontrol-1.0-r0 do_package_qa\n== Başarısız görevler\n  modbus-izle_1.0.bb:do_compile\n== Hata günlükleri\n  /home/gelistirici/bitbake-builds/ornek/build/tmp/work/x86-64-v3-poky-linux/modbus-izle/1.0/temp/log.do_compile.41872\n== İlk derleyici hatası\n  modbus-izle.c:14:5: error: implicit declaration of function 'modbus_new_tcp' [-Wimplicit-function-declaration]",
   "aciklama": "Aynı adımlar bir betikte birleştirilmiştir (examples/03-metin-isleme/bitbake-ozet.sh). CI'da derleme günlüğüne uygulanıp özet rapora eklenebilir.",
   "istem": "gelistirici@derleme:~/gunluk$"
  }
 ]
};

window.TerminalOturumlari["fd-yonlendirme"] = {
 "baslik": "Dosya tanımlayıcı tablosu ve yönlendirme sırası",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/yon\n./fd-goster.sh",
   "cikti": "0 -> /dev/pts/0\n1 -> /dev/pts/0\n2 -> /dev/pts/0",
   "aciklama": "Etkileşimli kabuktan başlatılan bir sürecin 0, 1 ve 2 numaralı tanımlayıcıları aynı terminal aygıtına (sözde terminal) bağlıdır."
  },
  {
   "komut": "./fd-goster.sh > tablo.txt; cat tablo.txt",
   "cikti": "0 -> /dev/pts/0\n1 -> /home/kullanici/yon/tablo.txt\n2 -> /dev/pts/0",
   "aciklama": "> yönlendirmesi, komut çalıştırılmadan önce fd 1'i dosyaya bağlar. Tablo da fd 1'e yazıldığı için dosyaya gider.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "./fd-goster.sh > tablo.txt 2>&1; cat tablo.txt",
   "cikti": "0 -> /dev/pts/0\n1 -> /home/kullanici/yon/tablo.txt\n2 -> /home/kullanici/yon/tablo.txt",
   "aciklama": "Yönlendirmeler soldan sağa uygulanır: önce fd 1 dosyaya bağlanır, sonra fd 2, fd 1'in o anki hedefinin kopyası olur. Her ikisi de dosyayı gösterir.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "./fd-goster.sh 2>&1 > tablo.txt; cat tablo.txt",
   "cikti": "0 -> /dev/pts/0\n1 -> /home/kullanici/yon/tablo.txt\n2 -> /dev/pts/0",
   "aciklama": "Sıra ters çevrildiğinde fd 2, fd 1'in o anki hedefini (terminal) kopyalar; ardından yalnızca fd 1 dosyaya bağlanır. Hata çıktısı terminalde kalır.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "ls /etc/hostname yok.txt 2>&1 >/dev/null | tr a-z A-Z",
   "cikti": "LS: CANNOT ACCESS 'YOK.TXT': NO SUCH FILE OR DIRECTORY",
   "aciklama": "Bu sıra, yalnızca hata çıktısını boruya göndermek için kullanılır: fd 2 boruya (fd 1'in ilk hedefi) bağlanır, standart çıktı atılır.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "exec 3> kayit.txt\n./fd-goster.sh\necho 'fd 3 üzerinden yazıldı' >&3\nexec 3>&-; cat kayit.txt",
   "cikti": "0 -> /dev/pts/0\n1 -> /dev/pts/0\n2 -> /dev/pts/0\n3 -> /home/kullanici/yon/kayit.txt\nfd 3 üzerinden yazıldı",
   "aciklama": "exec ile kabuğun kendi tablosuna kalıcı bir tanımlayıcı eklenir; alt süreçler bunu miras alır. 3>&- tanımlayıcıyı kapatır.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "./fd-goster.sh < sensor.log 3< /etc/hostname",
   "cikti": "0 -> /home/kullanici/yon/sensor.log\n1 -> /dev/pts/0\n2 -> /dev/pts/0\n3 -> /etc/hostname",
   "aciklama": "Girdi yönlendirmesi < fd 0'ı, n< ise n numaralı tanımlayıcıyı okuma için açar.",
   "istem": "kullanici@agecidi:~/yon$"
  }
 ]
};

window.TerminalOturumlari["boru-pipestatus"] = {
 "baslik": "Borular, çıkış durumları, here-doc ve süreç ikamesi",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/yon\nyes | head -n 2; echo \"${PIPESTATUS[@]}\"",
   "cikti": "y\ny\n141 0",
   "aciklama": "head iki satır okuyup çıkınca boru okuyucusuz kalır; yes'in bir sonraki yazması SIGPIPE ile sonlanır: 128 + 13 = 141."
  },
  {
   "komut": "grep HATA yok.log | wc -l; echo \"durum: $?\"",
   "cikti": "grep: yok.log: No such file or directory\n0\ndurum: 0",
   "aciklama": "Boru hattının çıkış durumu son komutun durumudur. grep dosyayı bulamasa da wc başarılı olduğundan sonuç 0'dır.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "set -o pipefail\ngrep HATA yok.log | wc -l; echo \"durum: $?\"\nset +o pipefail",
   "cikti": "grep: yok.log: No such file or directory\n0\ndurum: 2",
   "aciklama": "pipefail etkinken sonuç, sıfırdan farklı durumla biten en sağdaki komutun durumudur (grep: 2).",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "./boru-durum.sh sensor.log",
   "cikti": "      1 2026-11-02T10:01:20 agecidi sensor-oku[412]: HATA sensor2: okuma zaman aşımı (i2c-1, adres 0x48)\n      1 2026-11-02T10:02:45 agecidi sensor-oku[412]: HATA sensor1: okuma zaman aşımı (i2c-1, adres 0x48)\n      1 2026-11-02T10:03:10 agecidi sensor-oku[412]: HATA sensor0: CRC uyuşmazlığı\ngrep=0 sort=0 uniq=0\nhata satırı bulundu",
   "aciklama": "PIPESTATUS dizisi her komutun durumunu ayrı ayrı verir; bir sonraki komutta üzerine yazıldığından hemen kopyalanır.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "cat <<EOF\nKullanıcı: $USER, ev dizini: $HOME\nEOF\ncat <<'EOF'\nKullanıcı: $USER (genişletilmedi)\nEOF",
   "cikti": "Kullanıcı: kullanici, ev dizini: /home/kullanici\nKullanıcı: $USER (genişletilmedi)",
   "aciklama": "Here-doc, sonlandırıcıya kadarki satırları fd 0 olarak verir. Sonlandırıcı tırnak içine alınırsa içerikte genişletme yapılmaz.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "tr a-z A-Z <<< 'agecidi'\ndiff <(printf '%s\\n' b a c | sort) <(printf '%s\\n' a b d)",
   "cikti": "AGECIDI\n3c3\n< c\n---\n> d",
   "aciklama": "<<< tek bir dizgiyi girdi yapar. <(...) süreç ikamesidir: komutun çıktısı /dev/fd/N biçiminde bir dosya adı olarak verilir.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "echo <(true)",
   "cikti": "/dev/fd/61",
   "aciklama": "Süreç ikamesinin yerine geçen ad, bir boru ucunu gösteren /dev/fd yoludur. Bu özellik bash'e özgüdür; POSIX sh'de bulunmaz.",
   "istem": "kullanici@agecidi:~/yon$"
  }
 ]
};

window.TerminalOturumlari["fork-exec-wait"] = {
 "baslik": "Kabuğun bir komutu çalıştırması: clone, execve, wait4",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/yon\necho \"kabuk PID: $$\"; bash -c 'echo \"alt kabuk PID: $$, ebeveyn: $PPID\"'",
   "cikti": "kabuk PID: 13501\nalt kabuk PID: 13506, ebeveyn: 13501",
   "aciklama": "$$ kabuğun kendi süreç numarası, PPID ebeveyn sürecinkidir. Yeni bash süreci, çalıştıran kabuğun çocuğudur."
  },
  {
   "komut": "strace -f -qq -e trace=clone,execve,wait4 -e signal=none \\\n    bash -c 'ls /etc/hostname; echo bitti' 2>&1 | sed -E 's/^\\[pid +[0-9]+\\] //'",
   "cikti": "execve(\"/usr/bin/bash\", [\"bash\", \"-c\", \"ls /etc/hostname; echo bitti\"], 0x… /* … vars */) = 0\nclone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD, child_tidptr=0x…) = 13512\nwait4(-1,  <unfinished ...>\nexecve(\"/usr/bin/ls\", [\"ls\", \"/etc/hostname\"], 0x… /* … vars */) = 0\n/etc/hostname\n<... wait4 resumed>[{WIFEXITED(s) && WEXITSTATUS(s) == 0}], 0, NULL) = 13512\nwait4(-1, 0x…, WNOHANG, NULL) = -1 ECHILD (No child processes)\nbitti",
   "aciklama": "strace sistem çağrılarını izler. bash, ls için clone ile çocuk oluşturur, çocuk execve ile ls programına dönüşür, ebeveyn wait4 ile bekler. echo yerleşik olduğundan süreç oluşturulmaz.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "sleep 30 &\nps -o pid,ppid,stat,comm --ppid $$",
   "cikti": "  PID  PPID STAT COMMAND\n13513 13501 S    sleep\n13514 13501 R    ps",
   "aciklama": "Arka plandaki sleep kabuğun çocuğudur. STAT sütunundaki S, kesilebilir uyku durumunu gösterir.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "kill -TERM $!; wait $!; echo \"durum: $?\"",
   "cikti": "durum: 143",
   "aciklama": "wait, çocuğun çıkış durumunu toplar. Sinyalle sonlanan sürecin durumu 128 + sinyal numarasıdır (SIGTERM = 15).",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "kill -l 9 15 13; kill -l TERM",
   "cikti": "KILL\nTERM\nPIPE\n15",
   "aciklama": "kill -l numarayı ada, adı numaraya çevirir.",
   "istem": "kullanici@agecidi:~/yon$"
  }
 ]
};

window.TerminalOturumlari["is-denetimi-sinyaller"] = {
 "baslik": "İş denetimi ve sinyal yakalama",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/yon\n./sinyal-yakala.sh > servis.log &\nsleep 1; jobs -l",
   "cikti": "[1]+ 13523 Running                 ./sinyal-yakala.sh > servis.log &",
   "aciklama": "& komutu arka planda başlatır; jobs -l iş numarasını ve PID'i listeler. Çıktı servis.log dosyasına yönlendirilmiştir."
  },
  {
   "komut": "kill -HUP %1; sleep 1; kill -USR1 %1; sleep 1\nkill -STOP %1; sleep 1; jobs",
   "cikti": "[1]+  Stopped                 ./sinyal-yakala.sh > servis.log",
   "aciklama": "%1 iş numarasıdır. HUP ve USR1 betikteki trap işleyicilerini çalıştırır. STOP yakalanamaz; süreç durdurulur.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "kill -CONT %1; sleep 1; kill %1; wait %1; echo \"durum: $?\"",
   "cikti": "durum: 143",
   "aciklama": "CONT süreci sürdürür. kill varsayılan olarak SIGTERM gönderir; betik temizlik yapıp 143 ile çıkar.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "cat servis.log",
   "cikti": "[13523] yapılandırma okundu\n[13523] yapılandırma okundu\n[13523] durum: 3 okuma\n[13523] SIGTERM alındı, temizleniyor",
   "aciklama": "Günlükte trap işleyicilerinin çıktıları görülür.",
   "istem": "kullanici@agecidi:~/yon$"
  },
  {
   "komut": "sleep 100 &\nkill -KILL %1; wait %1 2>/dev/null; echo \"durum: $?\"",
   "cikti": "durum: 137",
   "aciklama": "SIGKILL (9) yakalanamaz ve yok sayılamaz; süreç temizlik yapma fırsatı bulamadan sonlanır: 128 + 9 = 137.",
   "istem": "kullanici@agecidi:~/yon$"
  }
 ]
};

window.TerminalOturumlari["tirnaklar"] = {
 "baslik": "Tırnaklama, sözcük bölme ve glob",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b5\ndosya='sensor okuma.log'\n./argv-goster.sh $dosya",
   "cikti": "argüman sayısı: 2\n  <sensor>\n  <okuma.log>",
   "aciklama": "Tırnaksız genişletilen değişken sözcük bölmeye uğrar: tek dosya adı iki argümana dönüşür.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "./argv-goster.sh \"$dosya\" '$dosya'",
   "cikti": "argüman sayısı: 2\n  <sensor okuma.log>\n  <$dosya>",
   "aciklama": "Çift tırnak genişletmeye izin verir, sözcük bölmeyi ve glob'u engeller. Tek tırnak içindeki hiçbir karakter özel değildir.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "bos=''\n./argv-goster.sh $bos x; ./argv-goster.sh \"$bos\" x",
   "cikti": "argüman sayısı: 1\n  <x>\nargüman sayısı: 2\n  <>\n  <x>",
   "aciklama": "Boş ve tırnaksız bir değişken argüman listesinden tamamen kaybolur; tırnaklı olduğunda boş bir argüman olarak kalır.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "./argv-goster.sh *.log \"*.log\"",
   "cikti": "argüman sayısı: 3\n  <sensor okuma.log>\n  <sistem.log>\n  <*.log>",
   "aciklama": "Tırnaksız * mevcut dosya adlarına genişler (alfabetik sırayla); tırnak içindeki * düz karakterdir.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "./argv-goster.sh *.yok\nshopt -s nullglob; ./argv-goster.sh *.yok; shopt -u nullglob",
   "cikti": "argüman sayısı: 1\n  <*.yok>\nargüman sayısı: 0",
   "aciklama": "Eşleşme yoksa bash kalıbı olduğu gibi bırakır. nullglob etkinken eşleşmeyen kalıp hiçbir argüman üretmez.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "./argv-goster.sh $'sekme:\\t|' \"satır\\nsonu\" 'O'\\''nun'",
   "cikti": "argüman sayısı: 3\n  <sekme:\t|>\n  <satır\\nsonu>\n  <O'nun>",
   "aciklama": "$'...' C tarzı kaçış dizilerini çözer. Çift tırnak içinde \\n özel değildir. Tek tırnak içine tek tırnak, tırnağı kapatıp \\' ekleyerek yazılır.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "veri='a:b::c'\nIFS=: read -r -a parca <<< \"$veri\"; ./argv-goster.sh \"${parca[@]}\"",
   "cikti": "argüman sayısı: 4\n  <a>\n  <b>\n  <>\n  <c>",
   "aciklama": "IFS sözcük bölmede kullanılan ayırıcıları belirler. Boşluk dışındaki IFS karakterleri ardışık geldiğinde aralarında boş alan oluşur.",
   "istem": "kullanici@agecidi:~/b5$"
  }
 ]
};

window.TerminalOturumlari["genisletme-sirasi"] = {
 "baslik": "Genişletmelerin sırası",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b5\necho sensor{0..2}.log ayar.{conf,yedek}",
   "cikti": "sensor0.log sensor1.log sensor2.log ayar.conf ayar.yedek",
   "aciklama": "Küme ayracı genişletmesi ilk adımdır ve dosya sistemine bakmaz: yalnızca metin üretir.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "n=3; echo {1..$n}",
   "cikti": "{1..3}",
   "aciklama": "Küme ayracı genişletmesi parametre genişletmesinden önce yapıldığından {1..$n} geçerli bir dizi değildir ve olduğu gibi kalır. Bunun yerine seq veya for ((...)) kullanılır.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "echo ~ ~gelistirici \"~\"",
   "cikti": "/home/kullanici /home/gelistirici ~",
   "aciklama": "Tilde genişletmesi ev dizinini verir; ~ad başka kullanıcının ev dizinidir. Tırnak içinde yapılmaz.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "kalip='*.log'; echo $kalip; echo \"$kalip\"",
   "cikti": "sensor okuma.log sistem.log\n*.log",
   "aciklama": "Parametre genişletmesinin sonucu, tırnaksızsa daha sonra sözcük bölme ve glob adımlarından geçer.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "echo \"$(( 7 / 2 )) $(( 7 % 2 )) $(( 2 ** 10 ))\"",
   "cikti": "3 1 1024",
   "aciklama": "Aritmetik genişletme yalnızca tam sayılarla çalışır: bölme aşağı yuvarlanır, ** üs alır.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "set -x\ncp $kalip /tmp/ 2>/dev/null; set +x",
   "cikti": "+ cp 'sensor okuma.log' sistem.log /tmp/\n+ set +x",
   "aciklama": "set -x, her komutun tüm genişletmelerden sonraki son halini + önekiyle standart hataya yazar. Hata ayıklamada genişletme sorunlarını görmenin en kısa yoludur.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "echo \"$(echo '  iki   boşluk  ')\" ; echo $(echo '  iki   boşluk  ')",
   "cikti": "  iki   boşluk  \niki boşluk",
   "aciklama": "Komut ikamesinin çıktısı da tırnaksızsa sözcük bölmeye uğrar ve boşluklar tek boşluğa iner.",
   "istem": "kullanici@agecidi:~/b5$"
  }
 ]
};

window.TerminalOturumlari["parametre-genisletme"] = {
 "baslik": "Parametre genişletme biçimleri",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b5\nunset MAKINE; echo \"${MAKINE:-qemux86-64}\"; echo \"[${MAKINE}]\"",
   "cikti": "qemux86-64\n[]",
   "aciklama": "${x:-v}: değişken tanımsız veya boşsa v kullanılır, değişkene atanmaz.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "echo \"${MAKINE:=qemuarm64}\"; echo \"[$MAKINE]\"",
   "cikti": "qemuarm64\n[qemuarm64]",
   "aciklama": "${x:=v}: tanımsız veya boşsa v atanır ve kullanılır.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "echo \"${HATA_AYIKLA:+-v}\" sensor-oku; HATA_AYIKLA=1; echo \"${HATA_AYIKLA:+-v}\" sensor-oku",
   "cikti": " sensor-oku\n-v sensor-oku",
   "aciklama": "${x:+v}: değişken boş değilse v, aksi halde boş dizgi. İsteğe bağlı seçenek eklemek için kullanılır.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "bash -c 'echo \"${1:?hedef dizin verilmedi}\"' betik",
   "cikti": "betik: line 1: 1: hedef dizin verilmedi",
   "aciklama": "${x:?ileti}: tanımsız veya boşsa iletiyi standart hataya yazar ve etkileşimsiz kabuk sonlanır. Zorunlu argüman denetimi için kısa bir yöntemdir (bash 5.2 burada 127, dash 2 durumuyla çıkar).",
   "istem": "kullanici@agecidi:~/b5$",
   "hata": true
  },
  {
   "komut": "./yol-islemleri.sh",
   "cikti": "yol            : tmp/deploy/images/qemux86-64/ornek-image-qemux86-64.rootfs.wic.bz2\ndizin (%/*)    : tmp/deploy/images/qemux86-64\nad (##*/)      : ornek-image-qemux86-64.rootfs.wic.bz2\nson uzantı     : bz2\nuzantısız (%.*): ornek-image-qemux86-64.rootfs.wic\nkök ad (%%.*)  : ornek-image-qemux86-64\nmakine (# ve %%): qemux86-64\ndeğiştir (/)   : ornek-image-qemux86-64.rootfs.wic\nuzunluk (#)    : 37",
   "aciklama": "# ve ## baştan, % ve %% sondan kalıp kaldırır; tek işaret en kısa, çift işaret en uzun eşleşmeyi siler.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "s='sensor-oku-1.0-r0'; echo \"${s/-/_}\" \"${s//-/_}\" \"${s:0:6}\" \"${s^^}\"",
   "cikti": "sensor_oku-1.0-r0 sensor_oku_1.0_r0 sensor SENSOR-OKU-1.0-R0",
   "aciklama": "${x/a/b} ilk, ${x//a/b} tüm eşleşmeleri değiştirir; ${x:i:n} alt dizgi, ${x^^} büyük harf dönüşümüdür. Bu biçimler bash'e özgüdür.",
   "istem": "kullanici@agecidi:~/b5$"
  }
 ]
};

window.TerminalOturumlari["export-ortam"] = {
 "baslik": "Kabuk değişkeni, ortam değişkeni ve source",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b5\nSENSOR_ARALIK=5\nbash -c 'echo \"alt süreç: [$SENSOR_ARALIK]\"'",
   "cikti": "alt süreç: []",
   "aciklama": "Atama yalnızca kabuğun kendi belleğindeki değişkeni oluşturur; alt süreçlere aktarılmaz.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "export SENSOR_ARALIK\nbash -c 'echo \"alt süreç: [$SENSOR_ARALIK]\"'; declare -p SENSOR_ARALIK",
   "cikti": "alt süreç: [5]\ndeclare -x SENSOR_ARALIK=\"5\"",
   "aciklama": "export değişkeni ortam listesine işaretler; execve sırasında yeni programa bir kopya verilir. declare -x işareti bunu gösterir.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "bash -c 'SENSOR_ARALIK=60; echo \"çocukta: $SENSOR_ARALIK\"'; echo \"ebeveynde: $SENSOR_ARALIK\"",
   "cikti": "çocukta: 60\nebeveynde: 5",
   "aciklama": "Çocuk kendi kopyasını değiştirir; ebeveynin değeri etkilenmez. Ortam yalnızca ebeveynden çocuğa akar.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "LANG=C SENSOR_ARALIK=1 bash -c 'echo \"$LANG $SENSOR_ARALIK\"'; echo \"$LANG $SENSOR_ARALIK\"",
   "cikti": "C 1\nC.UTF-8 5",
   "aciklama": "Komutun önüne yazılan atamalar yalnızca o komutun ortamına eklenir; kabuktaki değerler değişmez.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": "./ortam-ayarla.sh; echo \"PWD=$PWD BUILDDIR=${BUILDDIR:-tanımsız}\"",
   "cikti": "Derleme dizini: /home/kullanici/b5/derleme\nPWD=/home/kullanici/b5 BUILDDIR=tanımsız",
   "aciklama": "Betik çalıştırıldığında ayrı bir süreçte cd ve export yapar; süreç bitince bu değişiklikler kaybolur.",
   "istem": "kullanici@agecidi:~/b5$"
  },
  {
   "komut": ". ./ortam-ayarla.sh; echo \"PWD=$PWD BUILDDIR=$BUILDDIR\"",
   "cikti": "Derleme dizini: /home/kullanici/b5/derleme\nPWD=/home/kullanici/b5/derleme BUILDDIR=/home/kullanici/b5/derleme",
   "aciklama": "source (.) betiği mevcut kabukta satır satır çalıştırır; dizin değişikliği ve değişkenler kalıcıdır. oe-init-build-env bu nedenle kaynaklanarak kullanılır.",
   "istem": "kullanici@agecidi:~/b5$"
  }
 ]
};

window.TerminalOturumlari["kosullar"] = {
 "baslik": "test, [ ] ve [[ ]] ile koşullar",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b6\n[ -f sensor.log ]; echo $?; [ -d sensor.log ]; echo $?",
   "cikti": "0\n1",
   "aciklama": "Koşul, bir komutun çıkış durumudur: 0 doğru, sıfır dışı yanlış. [ bir komuttur (test'in diğer adı) ve son argümanı ] olmalıdır."
  },
  {
   "komut": "bos=''\n[ $bos = evet ] && echo eşit",
   "cikti": "bash: [: =: unary operator expected",
   "aciklama": "Tırnaksız boş değişken kaybolur; [ yalnızca '= evet' görür ve sözdizimi hatası verir. [ ] içinde değişkenler her zaman tırnaklanmalıdır.",
   "istem": "kullanici@agecidi:~/b6$",
   "hata": true
  },
  {
   "komut": "[[ $bos = evet ]] || echo 'eşit değil'",
   "cikti": "eşit değil",
   "aciklama": "[[ ]] bir anahtar sözcüktür; içinde sözcük bölme ve glob yapılmaz. Boş değişken güvenle karşılaştırılır.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "[[ 10 < 9 ]] && echo 'dizgi olarak küçük'\n(( 10 < 9 )) || echo 'sayı olarak küçük değil'",
   "cikti": "dizgi olarak küçük\nsayı olarak küçük değil",
   "aciklama": "[[ ]] içinde < dizgi (sözlük) karşılaştırmasıdır. Sayısal karşılaştırma için -lt veya (( )) kullanılır.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "s=sensor-oku-1.0-r0\n[[ $s == sensor-* ]] && echo 'kalıp eşleşti'\n[[ $s =~ -([0-9.]+)-r([0-9]+)$ ]] && echo \"PV=${BASH_REMATCH[1]} PR=${BASH_REMATCH[2]}\"",
   "cikti": "kalıp eşleşti\nPV=1.0 PR=0",
   "aciklama": "== sağ tarafı tırnaksızsa glob kalıbıdır; =~ ERE ile eşleştirir ve yakalanan grupları BASH_REMATCH dizisine yazar.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "for f in sensor.log /dev/null /etc yok; do\n  case $f in\n    /dev/*) echo \"$f: aygıt\" ;;\n    *.log)  echo \"$f: günlük\" ;;\n    *)      [ -e \"$f\" ] && echo \"$f: var\" || echo \"$f: yok\" ;;\n  esac\ndone",
   "cikti": "sensor.log: günlük\n/dev/null: aygıt\n/etc: var\nyok: yok",
   "aciklama": "case değeri sırayla glob kalıplarıyla karşılaştırır ve ilk eşleşen dalı çalıştırır; ;; dalı bitirir.",
   "istem": "kullanici@agecidi:~/b6$"
  }
 ]
};

window.TerminalOturumlari["diziler"] = {
 "baslik": "Diziler ve ilişkisel diziler",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b6\npaketler=(sensor-oku 'modbus izle' busybox)\npaketler+=(dropbear)\necho \"${#paketler[@]} öğe; ilk: ${paketler[0]}; son: ${paketler[-1]}\"",
   "cikti": "4 öğe; ilk: sensor-oku; son: dropbear",
   "aciklama": "Dizi () ile tanımlanır, += ile genişletilir. ${#a[@]} öğe sayısı, negatif indis sondan sayar."
  },
  {
   "komut": "./argv-goster.sh \"${paketler[@]}\"",
   "cikti": "argüman sayısı: 4\n  <sensor-oku>\n  <modbus izle>\n  <busybox>\n  <dropbear>",
   "aciklama": "\"${a[@]}\" her öğeyi ayrı ve bütün bir argüman olarak verir; boşluk içeren öğe korunur.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "./argv-goster.sh \"${paketler[*]}\"; ./argv-goster.sh ${paketler[@]}",
   "cikti": "argüman sayısı: 1\n  <sensor-oku modbus izle busybox dropbear>\nargüman sayısı: 5\n  <sensor-oku>\n  <modbus>\n  <izle>\n  <busybox>\n  <dropbear>",
   "aciklama": "\"${a[*]}\" tüm öğeleri IFS'nin ilk karakteriyle birleştirip tek argüman yapar. Tırnaksız kullanım ise yeniden sözcük bölmeye yol açar.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "unset 'paketler[1]'; echo \"indisler: ${!paketler[@]}\"",
   "cikti": "indisler: 0 2 3",
   "aciklama": "unset ile silinen öğe boşluk bırakır; diziler seyrek olabilir. Döngülerde indis yerine \"${a[@]}\" kullanmak bu nedenle daha güvenlidir.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "declare -A surum=([busybox]=1.37.0 [dropbear]=2025.88)\nsurum[sensor-oku]=1.0\nfor p in \"${!surum[@]}\"; do echo \"$p=${surum[$p]}\"; done | sort",
   "cikti": "busybox=1.37.0\ndropbear=2025.88\nsensor-oku=1.0",
   "aciklama": "İlişkisel dizi (bash 4+) declare -A ile tanımlanmalıdır. Anahtarların sırası tanımsızdır; sıralı çıktı için sort kullanılır.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "mapfile -t hatalar < <(grep HATA sensor.log)\necho \"${#hatalar[@]} hata; ilki: ${hatalar[0]#* * }\"",
   "cikti": "3 hata; ilki: sensor-oku[412]: HATA sensor2: okuma zaman aşımı (i2c-1, adres 0x48)",
   "aciklama": "mapfile (readarray) her satırı bir dizi öğesine okur; -t satır sonlarını kaldırır.",
   "istem": "kullanici@agecidi:~/b6$"
  }
 ]
};

window.TerminalOturumlari["dongu-alt-kabuk"] = {
 "baslik": "while read döngüsü ve borudaki alt kabuk",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b6\nsayac=0\ngrep HATA sensor.log | while IFS= read -r satir; do sayac=$((sayac + 1)); done\necho \"sayac=$sayac\"",
   "cikti": "sayac=0",
   "aciklama": "Borunun her öğesi ayrı bir süreçte çalışır. Döngü bir alt kabukta sayacı artırır; alt kabuk bitince değişiklik kaybolur."
  },
  {
   "komut": "sayac=0\nwhile IFS= read -r satir; do sayac=$((sayac + 1)); done < <(grep HATA sensor.log)\necho \"sayac=$sayac\"",
   "cikti": "sayac=3",
   "aciklama": "Süreç ikamesiyle grep alt süreçte, döngü ise mevcut kabukta çalışır; sayaç korunur.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "shopt -s lastpipe; sayac=0\ngrep HATA sensor.log | while IFS= read -r satir; do sayac=$((sayac + 1)); done\necho \"sayac=$sayac\"; shopt -u lastpipe",
   "cikti": "sayac=3",
   "aciklama": "lastpipe, iş denetimi kapalıyken (betiklerde) borunun son komutunu mevcut kabukta çalıştırır.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "printf 'a b\\n  girintili\\nson' | while read -r s; do echo \"[$s]\"; done",
   "cikti": "[a b]\n[girintili]",
   "aciklama": "IFS= olmadan read baştaki ve sondaki boşlukları kırpar. Son satırda satır sonu yoksa read başarısız döner ve satır işlenmez.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "printf 'a b\\n  girintili\\nson' | while IFS= read -r s || [ -n \"$s\" ]; do echo \"[$s]\"; done",
   "cikti": "[a b]\n[  girintili]\n[son]",
   "aciklama": "IFS= boşlukları korur, -r ters eğik çizgiyi kaçış olarak yorumlamaz; || [ -n \"$s\" ] satır sonu olmayan son satırı da işler.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "./sensor-rapor.sh sensor.log",
   "cikti": "sensor    adet    ort    max  hata\nsensor0     11   21.2   21.9     1\nsensor1     11   24.6   27.6     1\nsensor2     10   19.9   20.4     1\nEşik (26.0) aşımı: 3\n  2026-11-02T10:02:00 sensor1 27.0\n  2026-11-02T10:02:20 sensor1 27.6\n  2026-11-02T10:03:00 sensor1 27.2\nTanınmayan satır: 1",
   "aciklama": "Örnek betik bu kalıpları birleştirir: while IFS= read -r, [[ =~ ]], ilişkisel diziler, fonksiyonlar ve case.",
   "istem": "kullanici@agecidi:~/b6$"
  }
 ]
};

window.TerminalOturumlari["fonksiyonlar"] = {
 "baslik": "Fonksiyonlar: kapsam ve dönüş değeri",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b6\n./kapsam-deneme.sh",
   "cikti": "başlangıç: seviye=genel\n  goster(): seviye=yerel (çağıran: yerel_kullanan)\nyerel_kullanan sonrası: seviye=genel\n  goster(): seviye=degisti (çağıran: genel_degistiren)\ngenel_degistiren sonrası: seviye=degisti\n84/4 = 21\n1/0: hesaplanamadı (dönüş değeri 1)",
   "aciklama": "bash dinamik kapsam kullanır: çağrılan fonksiyon, çağıranın local değişkenlerini görür. local olmayan atama genel değişkeni değiştirir."
  },
  {
   "komut": "f() { return 300; }; f; echo $?",
   "cikti": "44",
   "aciklama": "Dönüş değeri 0-255 aralığındadır; 300 mod 256 = 44 olur. Sayısal sonuçlar return ile değil, standart çıktıyla döndürülmelidir.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "bul() { grep -q \"$1\" sensor.log; }\nif bul CRC; then echo 'CRC hatası var'; fi; bul yok; echo $?",
   "cikti": "CRC hatası var\n1",
   "aciklama": "Fonksiyon return kullanmazsa dönüş değeri son komutun durumudur; böylece fonksiyon doğrudan koşul olarak kullanılabilir.",
   "istem": "kullanici@agecidi:~/b6$"
  },
  {
   "komut": "toplam() { local t=0 x; for x in \"$@\"; do (( t += x )); done; echo \"$t\"; }\nsonuc=$(toplam 3 4 5); echo \"sonuc=$sonuc\"",
   "cikti": "sonuc=12",
   "aciklama": "Fonksiyonun argümanları $1, $2, ... ve \"$@\" ile alınır; çıktı komut ikamesiyle yakalanır.",
   "istem": "kullanici@agecidi:~/b6$"
  }
 ]
};

window.TerminalOturumlari["set-e-tuzaklari"] = {
 "baslik": "set -e: ne zaman durur, ne zaman durmaz?",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b7\nbash -c 'set -e; false; echo devam'; echo \"durum: $?\"",
   "cikti": "durum: 1",
   "aciklama": "set -e etkinken başarısız olan basit bir komut kabuğu sonlandırır; sonraki satır çalışmaz."
  },
  {
   "komut": "bash -c 'set -e; f() { false; echo \"f içinde devam\"; }; if f; then :; fi; echo bitti'",
   "cikti": "f içinde devam\nbitti",
   "aciklama": "Koşul olarak kullanılan bir fonksiyonun içinde set -e tümüyle askıya alınır; false sonrası satırlar çalışır.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "bash -c 'set -e; f() { local x=$(false); echo \"local maskeledi\"; }; f'",
   "cikti": "local maskeledi",
   "aciklama": "local bir komuttur ve kendi durumu (0) komut ikamesinin durumunu gizler. ShellCheck bunu SC2155 ile uyarır.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "bash -c 'set -e; n=0; (( n++ )); echo \"n=$n\"'; echo \"durum: $?\"",
   "cikti": "durum: 1",
   "aciklama": "(( )) ifadenin değeri 0 olduğunda 1 döndürür. n++ eski değeri (0) verdiğinden betik sessizce durur. n=$((n + 1)) biçimi bu tuzağa düşmez.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "bash -c 'set -euo pipefail; grep HATA yok.log | wc -l; echo devam'; echo \"durum: $?\"",
   "cikti": "grep: yok.log: No such file or directory\n0\ndurum: 2",
   "aciklama": "pipefail olmadan boru hattının durumu wc'nin durumu olurdu. pipefail ile grep'in hatası (2) yakalanır ve set -e betiği durdurur.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "bash -c 'set -u; echo \"${TANIMSIZ:-varsayılan}\"; echo \"$TANIMSIZ\"'",
   "cikti": "varsayılan\nbash: TANIMSIZ: unbound variable",
   "aciklama": "set -u tanımsız değişkene başvuruyu hata sayar ve etkileşimsiz kabuğu sonlandırır. Varsayılan değerli genişletme (${x:-}) bu denetimden muaftır.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "./set-e-tuzaklari.sh | grep -c 'betik devam etti'",
   "cikti": "5",
   "aciklama": "Örnek betik dokuz durumu sırayla dener; bunların beşinde set -e betiği durdurmaz.",
   "istem": "kullanici@agecidi:~/b7$"
  }
 ]
};

window.TerminalOturumlari["trap-temizlik"] = {
 "baslik": "trap EXIT/ERR, mktemp ve getopts ile şablon betik",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b7; export TMPDIR=~/gecici\n./saglam-sablon.sh -h",
   "cikti": "Kullanım: saglam-sablon.sh [-v] [-o çıktı-dizini] <girdi>...\n  -v            ayrıntılı çıktı\n  -o DİZİN      sonuçların yazılacağı dizin (varsayılan: .)\n  -h            bu yardım",
   "aciklama": "getopts ile ayrıştırılan seçenekler ve here-doc ile yazılmış yardım metni."
  },
  {
   "komut": "./saglam-sablon.sh -v liste.txt; cat liste.txt.sirali",
   "cikti": "saglam-sablon.sh: geçici dizin: /home/kullanici/gecici/tmp.Xq3f8ZkA1c\nsaglam-sablon.sh: işleniyor: liste.txt\nsaglam-sablon.sh: tamamlandı\na\nb\nc",
   "aciklama": "-v ile ayrıntılı iletiler standart hataya yazılır. Sonuç önce mktemp ile oluşturulan geçici dizine yazılır, sonra yerine taşınır.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "./saglam-sablon.sh -o; ./saglam-sablon.sh -q liste.txt",
   "cikti": "saglam-sablon.sh: HATA: -o seçeneği bir değer gerektirir\nsaglam-sablon.sh: HATA: bilinmeyen seçenek: -q (yardım için -h)",
   "aciklama": "getopts dizgisinin başındaki : sessiz kipi açar; eksik değer ':' dalına, bilinmeyen seçenek '?' dalına düşer.",
   "istem": "kullanici@agecidi:~/b7$",
   "hata": true
  },
  {
   "komut": "./saglam-sablon.sh dizin; echo \"durum: $?\"",
   "cikti": "sort: read failed: dizin: Is a directory\nsaglam-sablon.sh: satır 58: komut başarısız (durum 2): sort -- \"$girdi\" > \"$gecici/sonuc\"\ndurum: 2",
   "aciklama": "sort bir dizini okuyamaz. ERR tuzağı başarısız komutu, satır numarasını ve durumu yazar; ardından set -e betiği sonlandırır.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "ls -A ~/gecici | wc -l",
   "cikti": "0",
   "aciklama": "Betik hatayla bitse de EXIT tuzağı çalışmış ve geçici dizini silmiştir.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "for k in bash dash; do\n  $k -c 'trap \"echo EXIT tuzağı çalıştı\" EXIT; sleep 5' &\n  sleep 0.3; kill $!; wait $!; echo \"$k: durum $?\"\ndone",
   "cikti": "EXIT tuzağı çalıştı\nbash: durum 143\ndash: durum 143",
   "aciklama": "SIGTERM ile sonlandırılan bash EXIT tuzağını çalıştırır; dash (ve BusyBox ash) çalıştırmaz. Taşınabilir betiklerde trap 'exit 143' TERM ve trap 'exit 130' INT eklenerek sinyalin normal bir çıkışa dönüştürülmesi gerekir.",
   "istem": "kullanici@agecidi:~/b7$"
  }
 ]
};

window.TerminalOturumlari["shellcheck-posix"] = {
 "baslik": "ShellCheck ile statik çözümleme ve POSIX uyumu",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b7\nshellcheck -f gcc hatali-betik.sh",
   "cikti": "hatali-betik.sh:6:1: warning: Use 'cd ... || exit' or 'cd ... || return' in case cd fails. [SC2164]\nhatali-betik.sh:6:4: note: Double quote to prevent globbing and word splitting. [SC2086]\nhatali-betik.sh:7:10: error: Iterating over ls output is fragile. Use globs. [SC2045]\nhatali-betik.sh:7:10: note: Use $(...) notation instead of legacy backticks `...`. [SC2006]\nhatali-betik.sh:7:14: note: Use ./*glob* or -- *glob* so names with dashes won't become options. [SC2035]\nhatali-betik.sh:8:24: note: Double quote to prevent globbing and word splitting. [SC2086]\nhatali-betik.sh:9:10: note: Double quote to prevent globbing and word splitting. [SC2086]\nhatali-betik.sh:13:1: warning: local_kopya appears unused. Verify use (or export if used externally). [SC2034]\nhatali-betik.sh:14:8: note: Double quote to prevent globbing and word splitting. [SC2086]\nhatali-betik.sh:15:11: note: Use ./*glob* or -- *glob* so names with dashes won't become options. [SC2035]\nhatali-betik.sh:16:6: note: Check exit code directly with e.g. 'if mycmd;', not indirectly with $?. [SC2181]",
   "aciklama": "-f gcc her uyarıyı dosya:satır:sütun biçiminde tek satıra yazar; düzenleyiciler ve CI bu biçimi tanır. Çıkış durumu uyarı varsa 1'dir."
  },
  {
   "komut": "shellcheck duzeltilmis-betik.sh && echo 'uyarı yok'",
   "cikti": "uyarı yok",
   "aciklama": "Düzeltilmiş betikte değişkenler tırnaklanmış, ls yerine glob, $? yerine doğrudan koşul kullanılmıştır.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "shellcheck -f gcc -S warning bashizm-ornek.sh | cut -d: -f2,4-",
   "cikti": "6: warning: In POSIX sh, arrays are undefined. [SC3030]\n7: warning: In POSIX sh, [[ ]] is undefined. [SC3010]\n7: warning: In POSIX sh, == in place of = is undefined. [SC3014]\n8: warning: In POSIX sh, echo flags are undefined. [SC3037]\n8: warning: In POSIX sh, array references are undefined. [SC3054]\n10: warning: In POSIX sh, brace expansion is undefined. [SC3009]\n11: warning: In POSIX sh, exponentials are undefined. [SC3019]\n14: warning: 'function' keyword is non-standard. Use 'foo()' instead of 'function foo'. [SC2113]\n15: warning: In POSIX sh, case modification is undefined. [SC3059]",
   "aciklama": "Shebang #!/bin/sh olduğundan ShellCheck betiği POSIX sh olarak denetler ve bash'e özgü yapıları SC3xxx koduyla bildirir. -S warning bilgi düzeyindeki iletileri gizler.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "bash bashizm-ornek.sh; dash bashizm-ornek.sh",
   "cikti": "iki dosya:\ta.log b.log\nkare: 1\nkare: 4\nkare: 9\nmerhaba kullanici\nbashizm-ornek.sh: 6: Syntax error: \"(\" unexpected",
   "aciklama": "Aynı betik bash ile çalışır, dash ile ilk dizi tanımında sözdizimi hatası verir. Debian ve Ubuntu'da /bin/sh dash'tir.",
   "istem": "kullanici@agecidi:~/b7$",
   "hata": true
  },
  {
   "komut": "dash -c 'echo -e \"a\\tb\"'; dash -c 'echo {1..3}'",
   "cikti": "-e a\tb\n{1..3}",
   "aciklama": "Bazı bashizmler hata vermez, yalnızca farklı davranır: dash'in echo'su -e seçeneğini tanımaz ve kaçışları her zaman yorumlar; küme ayracı genişletmesi yapılmaz.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "for k in bash dash 'busybox sh'; do printf '%-11s' \"$k:\"; $k posix-karsilik.sh | tail -n 1; done",
   "cikti": "bash:      merhaba kullanici\ndash:      merhaba kullanici\nbusybox sh:merhaba kullanici",
   "aciklama": "POSIX karşılığı üç kabukta da aynı sonucu verir.",
   "istem": "kullanici@agecidi:~/b7$"
  }
 ]
};

window.TerminalOturumlari["getopts-kilit"] = {
 "baslik": "Kilit dosyası ile tek örnek çalıştırma",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b7\n./yedekle.sh; echo \"durum: $?\"",
   "cikti": "Kullanım: yedekle.sh [-n adet] [-k kaynak-dizin] <hedef-dizin>\ndurum: 2",
   "aciklama": "Zorunlu argüman verilmediğinde kullanım iletisi standart hataya yazılır ve betik 2 ile çıkar (geleneksel 'yanlış kullanım' durumu).",
   "hata": true
  },
  {
   "komut": "./yedekle.sh -n 2 -k etc/ornek yedekler",
   "cikti": "yedek alındı: yedekler/yedek-20261102-104512.tar.gz",
   "aciklama": "Arşiv önce mktemp ile oluşturulan geçici ada yazılır, tamamlanınca mv ile asıl adına taşınır. Yarım arşiv hiçbir zaman asıl adla görünmez.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "(flock 9; sleep 2) 9> yedekler/.yedekle.kilit &\nsleep 0.5; ./yedekle.sh -k etc/ornek yedekler; echo \"durum: $?\"",
   "cikti": "başka bir yedekleme sürüyor\ndurum: 1",
   "aciklama": "Başka bir süreç kilidi tutarken flock -n beklemeden başarısız olur ve betik ikinci kez çalışmaz.",
   "istem": "kullanici@agecidi:~/b7$"
  },
  {
   "komut": "wait; ./yedekle.sh -n abc yedekler",
   "cikti": "geçersiz adet: abc",
   "aciklama": "Sayısal argüman [[ =~ ]] ile doğrulanır; geçersiz değer işe başlamadan reddedilir.",
   "istem": "kullanici@agecidi:~/b7$",
   "hata": true
  }
 ]
};

window.TerminalOturumlari["busybox-ash"] = {
 "baslik": "BusyBox: tek ikili, çok komut ve ash farkları",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "yorum": true,
   "komut": "Bu oturum derleme makinesinde Ubuntu'nun BusyBox 1.36.1 paketiyle çalıştırılmıştır"
  },
  {
   "komut": "cd ~/b8\nbusybox | head -n 1; busybox --list | wc -l",
   "cikti": "BusyBox v1.36.1 (Ubuntu 1:1.36.1-6ubuntu3.1) multi-call binary.\n272",
   "aciklama": "BusyBox yüzlerce komutu (applet) tek bir çalıştırılabilir dosyada toplar. Hangi applet'lerin bulunduğu derleme yapılandırmasına bağlıdır."
  },
  {
   "komut": "ln -s \"$(command -v busybox)\" bb/ls; ln -s \"$(command -v busybox)\" bb/sh\nbb/ls --help 2>&1 | head -n 3",
   "cikti": "BusyBox v1.36.1 (Ubuntu 1:1.36.1-6ubuntu3.1) multi-call binary.\n\nUsage: ls [-1AaCxdLHRFplinshrSXvctu] [-w WIDTH] [FILE]...",
   "aciklama": "BusyBox çalışacak applet'i argv[0]'dan, yani çağrıldığı addan seçer. Hedef cihazdaki /bin/ls, /bin/sh gibi dosyalar bu nedenle busybox'a sembolik bağlantıdır.",
   "istem": "kullanici@agecidi:~/b8$"
  },
  {
   "komut": "bb/sh -c 'echo \"kabuk: $0\"; a=(1 2)'",
   "cikti": "bb/sh: syntax error: unexpected \"(\"",
   "aciklama": "BusyBox'ın varsayılan kabuğu ash'tir. Bu derlemede diziler desteklenmez; dizi tanımı sözdizimi hatası verir.",
   "istem": "kullanici@agecidi:~/b8$",
   "hata": true
  },
  {
   "komut": "printf 'bash\\tdash\\tash\\tyapı\\n' | expand -t 6\npaste <(bash busybox-uyum.sh -b) <(dash busybox-uyum.sh -b) \\\n  <(busybox sh busybox-uyum.sh -b) <(bash busybox-uyum.sh | cut -c6-) | expand -t 6",
   "cikti": "bash  dash  ash   yapı\nvar   var   var   local\nvar   var   var   $((...)) aritmetik\nvar   var   var   ${x#} ${x%}\nvar   YOK   var   [[ ]]\nvar   YOK   var   == ile [ ]\nvar   YOK   YOK   dizi\nvar   YOK   var   ${x/a/b}\nvar   YOK   var   ${x:1:2}\nvar   YOK   var   $'...' alıntı\nvar   YOK   var   echo -e\nvar   YOK   YOK   {1..3}\nvar   YOK   var   ** üs\nvar   YOK   var   function sözcüğü\nvar   YOK   YOK   <<< here-string\nvar   YOK   var   <(...) süreç ikamesi\nvar   YOK   var   set -o pipefail\nvar   YOK   YOK   read -a",
   "aciklama": "Aynı sınama betiği üç kabukta çalıştırılır. ash, bash'in bazı yapılarını ([[ ]], ${x/a/b}, $'...') destekler; dash yalnızca POSIX yapıları sunar. Sonuç kabuğun derleme seçeneklerine bağlıdır.",
   "istem": "kullanici@agecidi:~/b8$"
  },
  {
   "komut": "busybox sh -c 'echo $((2**10)); x=abc; echo ${x^^}'",
   "cikti": "1024\nsh: syntax error: bad substitution",
   "aciklama": "Desteklenmeyen bir genişletme ash'te 'bad substitution' hatası verir; bu hata betiğin tamamını durdurur.",
   "istem": "kullanici@agecidi:~/b8$",
   "hata": true
  }
 ]
};

window.TerminalOturumlari["init-betigi"] = {
 "baslik": "SysV init betiğinin denenmesi",
 "istem": "kullanici@agecidi:~$",
 "adimlar": [
  {
   "komut": "cd ~/b8i\necho 27500 > temp1_input\nprintf 'ARALIK=1\\nESIK=26000\\nGIRDI=%s\\n' \"$PWD/temp1_input\" > ayar\nexport SENSOR_IZLE_AYAR=$PWD/ayar DAEMON=$PWD/sensor-izle.sh PIDFILE=$PWD/pid LOG=$PWD/servis.log",
   "cikti": "",
   "aciklama": "Cihazdaki /sys/class/hwmon/... dosyası yerine elle oluşturulmuş bir dosya (27,5 °C) kullanılır; yollar denemeye özgü ortam değişkenleriyle değiştirilir.",
   "istem": "kullanici@agecidi:~/b8i$"
  },
  {
   "komut": "./sensor-izle.init start; sleep 2; ./sensor-izle.init status",
   "cikti": "Starting sensor-izle: tamam\nsensor-izle çalışıyor (PID 13980)",
   "aciklama": "start-stop-daemon programı arka plana alır ve PID dosyasını yazar. status, PID dosyasındaki süreci kill -0 ile sınar.",
   "istem": "kullanici@agecidi:~/b8i$"
  },
  {
   "komut": "echo 21000 > temp1_input; ./sensor-izle.init reload; sleep 2\n./sensor-izle.init stop; ./sensor-izle.init status; echo \"durum: $?\"",
   "cikti": "Stopping sensor-izle: tamam\nsensor-izle çalışmıyor\ndurum: 3",
   "aciklama": "reload SIGHUP gönderir, stop SIGTERM gönderir. LSB kuralına göre çalışmayan servis için status 3 döndürür.",
   "istem": "kullanici@agecidi:~/b8i$"
  },
  {
   "komut": "cat servis.log",
   "cikti": "2026-11-02T21:24:24 sensor-izle[13980]: başladı: girdi=/home/kullanici/b8i/temp1_input aralik=1 esik=26000\n2026-11-02T21:24:24 sensor-izle[13980]: UYARI eşik aşıldı: 27.5 C\n2026-11-02T21:24:25 sensor-izle[13980]: UYARI eşik aşıldı: 27.5 C\n2026-11-02T21:24:26 sensor-izle[13980]: ayarlar yeniden okundu: aralik=1 esik=26000\n2026-11-02T21:24:28 sensor-izle[13980]: sonlandırılıyor (SIGTERM)",
   "aciklama": "Program iletilerini standart çıktıya yazar; init betiği bu çıktıyı günlük dosyasına yönlendirmiştir. Sıcaklık düştükten sonra uyarı yazılmamıştır.",
   "istem": "kullanici@agecidi:~/b8i$"
  },
  {
   "komut": "PATH=$PWD/bb:$PATH ./sensor-izle.init start; sleep 1; PATH=$PWD/bb:$PATH ./sensor-izle.init stop",
   "cikti": "Starting sensor-izle: tamam\nStopping sensor-izle: tamam",
   "aciklama": "Aynı betik BusyBox'ın start-stop-daemon applet'iyle de çalışır; betik iki uygulamada ortak olan kısa seçenekleri kullanır.",
   "istem": "kullanici@agecidi:~/b8i$"
  },
  {
   "komut": "./sensor-izle.init yeniden",
   "cikti": "Kullanım: ./sensor-izle.init {start|stop|restart|reload|status}",
   "aciklama": "Tanınmayan eylemde kullanım iletisi standart hataya yazılır ve 1 döndürülür.",
   "istem": "kullanici@agecidi:~/b8i$",
   "hata": true
  }
 ]
};

window.TerminalOturumlari["run-do-install"] = {
 "baslik": "Bir BitBake kabuk görevinin benzetimi: run.do_install",
 "istem": "gelistirici@derleme:~$",
 "adimlar": [
  {
   "yorum": true,
   "komut": "Çıktılarda uzun WORKDIR yolu ${WORKDIR}, istemde ~/…/ olarak kısaltılmıştır"
  },
  {
   "komut": "W=$(~/araclar/benzetim-hazirla.sh \"$ORNEK\")\ncd \"$W/temp\"; ls -l",
   "cikti": "total 8\nlrwxrwxrwx 1 gelistirici gelistirici   19 Nov  2 21:29 run.do_install -> run.do_install.4242\n-rwxrwxr-x 1 gelistirici gelistirici 4647 Nov  2 21:29 run.do_install.4242",
   "aciklama": "BitBake her görev için T (temp/) dizinine run.do_<görev>.<pid> betiğini yazar ve kısa adı en son betiğe bağlar."
  },
  {
   "komut": "grep -n -e '^case' -e 'set -e' -e '^do_install' -e '^cd ' -e '^export PATH' run.do_install | cut -c1-90",
   "cikti": "52:case $BASH_VERSION in\n54:    set -e\n58:    set -e\n66:export PATH=\"/home/gelistirici/bitbake-builds/ornek/build/tmp/work/x86-64-v3-poky-linux\n70:do_install() {\n85:cd '/home/gelistirici/bitbake-builds/ornek/build/tmp/work/x86-64-v3-poky-linux/sensor-i\n86:do_install",
   "aciklama": "Betik, tuzak kodu ve set -e ile başlar; dışa aktarılan değişkenler, genişletilmiş fonksiyon gövdesi, cd ve fonksiyon çağrısı izler. PATH yalnızca sysroot ve hosttools dizinlerini içerir.",
   "istem": "gelistirici@derleme:~/…/sensor-izle/1.0/temp$"
  },
  {
   "komut": "sed -n '/^do_install() {/,/^}/p' run.do_install | head -n 4",
   "cikti": "do_install() {\n    install -d ${WORKDIR}/image/usr/bin ${WORKDIR}/image/etc/default\n    install -m 0755 ${WORKDIR}/sources/sensor-izle.sh ${WORKDIR}/image/usr/bin/sensor-izle\n    install -m 0644 ${WORKDIR}/sources/sensor-izle.default ${WORKDIR}/image/etc/default/sensor-izle",
   "aciklama": "${D}, ${bindir} ve ${S} gibi BitBake başvuruları betik yazılmadan önce genişletilmiştir; kabuk bu değişkenleri hiç görmez.",
   "istem": "gelistirici@derleme:~/…/sensor-izle/1.0/temp$"
  },
  {
   "komut": "./run.do_install > log.do_install.4242 2>&1; echo \"durum: $?\"\ncd ..; find image -type f | sort",
   "cikti": "durum: 0\nimage/etc/default/sensor-izle\nimage/usr/bin/sensor-izle\nimage/usr/lib/systemd/system/sensor-izle.service",
   "aciklama": "Betik /bin/sh ile (bu makinede dash) çalışır. Kurulan dosyalar hedef sistemdeki yollarıyla ${D} = image/ altında yer alır.",
   "istem": "gelistirici@derleme:~/…/sensor-izle/1.0/temp$"
  },
  {
   "komut": "sed -i 's|sources/sensor-izle.service|sources/sensor-izle.servis|' temp/run.do_install.4242\ntemp/run.do_install; echo \"durum: $?\"",
   "cikti": "install: cannot stat '${WORKDIR}/sources/sensor-izle.servis': No such file or directory\nWARNING: exit code 1 from a shell command.\ndurum: 1",
   "aciklama": "Bir komut başarısız olunca set -e betiği durdurur; EXIT tuzağı (bb_sh_exit_handler) BitBake'in günlükte gösterdiği uyarıyı yazar.",
   "istem": "gelistirici@derleme:~/…/sensor-izle/1.0$",
   "hata": true
  },
  {
   "komut": "sh -x temp/run.do_install 2>&1 | grep -m 2 '^+ install'",
   "cikti": "+ install -d ${WORKDIR}/image/usr/bin ${WORKDIR}/image/etc/default\n+ install -m 0755 ${WORKDIR}/sources/sensor-izle.sh ${WORKDIR}/image/usr/bin/sensor-izle",
   "aciklama": "sh -x her komutu genişletilmiş haliyle yazar; başarısız görevin hangi satırda durduğunu bulmanın hızlı bir yoludur.",
   "istem": "gelistirici@derleme:~/…/sensor-izle/1.0$"
  }
 ]
};

window.TerminalOturumlari["ci-betigi"] = {
 "baslik": "CI derleme betiğinin sahte bir kurulumla denenmesi",
 "istem": "gelistirici@derleme:~$",
 "adimlar": [
  {
   "komut": "cd ~/ci\n./sahte-kurulum-olustur.sh ~/bitbake-builds/ornek \"$ORNEK\"/03-metin-isleme/veri/bitbake-cikti.txt",
   "cikti": "sahte kurulum: /home/gelistirici/bitbake-builds/ornek",
   "aciklama": "Sahte kurulum, gerçek bir derleme yapmadan init-build-env ve bitbake komutlarının davranışını taklit eder: örnek çıktıyı yazar ve 1 ile çıkar."
  },
  {
   "komut": "./ci-derle.sh -k ~/bitbake-builds/ornek > ekran.txt 2>&1; echo \"durum: $?\"\nhead -n 2 ekran.txt; tail -n 1 ekran.txt",
   "cikti": "durum: 1\nci-derle: ornek-image derleniyor (/home/gelistirici/bitbake-builds/ornek/build)\nNOTE: Resolving any missing task queue dependencies\nci-derle: durum 1, çıktılar: /home/gelistirici/ci/ci-cikti",
   "aciklama": "bitbake'in durumu PIPESTATUS ile tee'den ayrılır ve betiğin çıkış durumu olur; CI sistemi işi başarısız sayar.",
   "istem": "gelistirici@derleme:~/ci$"
  },
  {
   "komut": "ls ci-cikti; head -n 6 ci-cikti/ozet.txt",
   "cikti": "bitbake.log\nlog.do_compile.41872\nozet.txt\n== QA uyarı türleri\n      2 [ldflags]\n      1 [installed-vs-shipped]\n      1 [file-rdeps]\n== Uyarı veren tarif ve görevler\n  kalibrasyon-veri-1.0-r0 do_package_qa",
   "aciklama": "EXIT tuzağı başarısız görevin günlüğünü CI yapıtı olarak kopyalamış ve Bölüm 3'teki özet betiğini çalıştırmıştır.",
   "istem": "gelistirici@derleme:~/ci$"
  },
  {
   "komut": "./ci-derle.sh -x; echo \"durum: $?\"",
   "cikti": "./ci-derle.sh: illegal option -- x\nKullanım: ci-derle.sh [-k] [-i imaj] [-o çıktı-dizini] <kurulum-dizini>\ndurum: 2",
   "aciklama": "Tanınmayan seçenekte getopts bir tanılama yazar; betik 2 ile çıkar.",
   "istem": "gelistirici@derleme:~/ci$",
   "hata": true
  }
 ]
};
