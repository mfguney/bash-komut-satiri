# Terimler sözlüğü

Kitapta kullanılan Türkçe terimler ve İngilizce karşılıkları. Terimin ayrıntılı olarak ele alındığı
bölüm son sütunda verilmiştir.

| Türkçe | İngilizce | Açıklama | Bölüm |
|---|---|---|---|
| açık dosya kaydı | open file description | Çekirdekte dosya konumunu ve açılış kipini tutan kayıt; fd'ler bunu gösterir | 4 |
| alt kabuk | subshell | Kabuğun fork ile oluşturulan kopyası; `( )`, boru öğeleri, `$( )` | 4, 6 |
| anahtar sözcük, ayrılmış sözcük | keyword, reserved word | Dilin yapı taşı olan sözcük: `if`, `for`, `[[` | 1 |
| applet | applet | BusyBox içindeki tek bir komutun gerçekleştirimi | 8 |
| argüman | argument | Komuta verilen sözcük; programa `argv` dizisi olarak ulaşır | 1 |
| arka plan işi | background job | `&` ile başlatılan, kabuğun beklemediği iş | 4 |
| atomik | atomic | Ya tamamen gerçekleşen ya da hiç gerçekleşmeyen işlem (ör. aynı dosya sisteminde `rename`) | 2, 7 |
| bağlama (dosya sistemi) | mount | Bir dosya sisteminin ağaçtaki bir dizine eklenmesi | 2 |
| bashizm | bashism | `/bin/sh` betiğinde kullanılan, bash'e özgü yapı | 7 |
| boru | pipe | İki süreci bağlayan, çekirdek içindeki tek yönlü tampon | 4 |
| boru hattı | pipeline | <code>&#124;</code> ile bağlanmış komut dizisi | 4 |
| çıkış durumu | exit status | Komutun bittiğinde bıraktığı 0–255 arası değer; `$?` | 1, 6 |
| dinamik kapsam | dynamic scoping | Fonksiyonun, çağıranın yerel değişkenlerini görmesi | 6 |
| dışa aktarma | export | Değişkenin ortama, dolayısıyla çocuk süreçlere verilmesi | 5 |
| dosya tanımlayıcısı | file descriptor (fd) | Sürecin açık dosyalarını gösteren küçük tamsayı | 4 |
| düzenli ifade | regular expression (regex) | Metin kalıbı tanımlama dili; BRE ve ERE | 3 |
| genişletilmiş düzenli ifade | extended regular expression (ERE) | `+`, `?`, <code>&#124;</code>, `( )`, `{ }` işleçlerini doğrudan kullanan sözdizimi | 3 |
| genişletme | expansion | Kabuğun bir sözcüğü çalıştırmadan önce dönüştürmesi | 5 |
| geçmiş genişletmesi | history expansion | `!!`, `!$` gibi ifadelerin geçmişteki metinle değiştirilmesi | 1 |
| glob, yol adı genişletmesi | glob, pathname expansion | `*`, `?`, `[…]` kalıplarının dosya adlarıyla değiştirilmesi | 5 |
| hash tablosu | hash table | bash'in bulduğu komut yollarını sakladığı önbellek | 1 |
| here-doc | here document | `<<SON` ile betik içindeki metnin girdi yapılması | 4 |
| inode | inode | Dosyanın meta verilerini ve veri bloklarını tutan kayıt; adı içermez | 2 |
| iş denetimi | job control | İşlerin ön/arka plana alınması ve durdurulması | 4 |
| kaynaklama | sourcing | Betiğin `.` veya `source` ile mevcut kabukta çalıştırılması | 5 |
| kilit dosyası | lock file | Bir işin tek örneğinin çalışmasını sağlayan dosya veya kilit | 7 |
| komut ikamesi | command substitution | `$(komut)` ile komut çıktısının yerine konması | 5 |
| konumsal parametre | positional parameter | `$1`, `$2`, …; betiğin veya fonksiyonun argümanları | 5 |
| kurulum sonrası betik | post-installation script | Paket kurulduktan sonra çalışan betik; Yocto'da `pkg_postinst` | 8 |
| oturum açma kabuğu | login shell | Oturum başında başlatılan, profil dosyalarını okuyan kabuk | 1 |
| ortam | environment | `execve` ile yeni programa verilen `AD=değer` listesi | 5 |
| öksüz süreç | orphan process | Ebeveyni sonlanmış, PID 1'e bağlanan süreç | 4 |
| parametre genişletme | parameter expansion | `${x:-v}`, `${x#k}` gibi değişken dönüşümleri | 5 |
| satır disiplini | line discipline | Terminal aygıtında düzenleme, yankı ve sinyal üretimini yapan çekirdek katmanı | 1 |
| sembolik bağlantı | symbolic link, symlink | İçinde hedef yolu taşıyan ayrı dosya | 2 |
| sabit bağlantı | hard link | Aynı inode'a verilen ek ad | 2 |
| sinyal | signal | Bir sürece gönderilen eşzamansız bildirim | 4 |
| sözcük bölme | word splitting | Tırnaksız genişletme sonuçlarının IFS'ye göre bölünmesi | 5 |
| sözde terminal | pseudo-terminal (PTY) | Terminal öykünücüsü ile kabuk arasındaki ana/yardımcı aygıt çifti | 1 |
| standart çıktı / girdi / hata | standard output / input / error | fd 1 / 0 / 2 | 4 |
| statik çözümleme | static analysis | Kodu çalıştırmadan inceleme; ShellCheck | 7 |
| süreç | process | Çalışmakta olan bir programın örneği | 4 |
| süreç grubu | process group | Birlikte sinyal alan süreçler; bir iş | 4 |
| süreç ikamesi | process substitution | `<(komut)` ile komut çıktısının dosya adı olarak sunulması | 4 |
| takma ad | alias | Ayrıştırmada metin olarak değiştirilen komut kısaltması | 1 |
| tamamlama | completion | Tab tuşuyla komut ve dosya adlarının tamamlanması | 1 |
| temel düzenli ifade | basic regular expression (BRE) | grep ve sed'in varsayılan sözdizimi | 3 |
| terminal öykünücüsü | terminal emulator | Tuşları ve ekranı yöneten grafik program | 1 |
| tırnaklama | quoting | Karakterlerin özel anlamlarının kapatılması | 5 |
| tuzak | trap | Bir olay veya sinyal olduğunda çalışacak kod | 7 |
| tutma alanı | hold space | sed'in satırlar arasında veri tuttuğu ikinci tampon | 3 |
| umask | umask (file mode creation mask) | Yeni dosyaların izninden çıkarılan bitler | 2 |
| yapışkan bit | sticky bit | Ortak dizinde dosyayı yalnızca sahibinin silebilmesini sağlayan bit | 2 |
| yerleşik komut | builtin | Kabuğun kendi içinde gerçekleştirdiği komut | 1 |
| yönlendirme | redirection | Komutun fd'lerinin dosyaya veya başka fd'ye bağlanması | 4 |
| zombi süreç | zombie process | Bitmiş ancak durumu ebeveynince toplanmamış süreç | 4 |
| desen alanı | pattern space | sed'in o anda işlediği satırı tuttuğu tampon | 3 |
| görev betiği | task script (run file) | BitBake'in bir görev için ürettiği `run.do_*` dosyası | 8 |
| geçici kök | destination directory (`D`) | `do_install`'un dosyaları kurduğu `${WORKDIR}/image` dizini | 8 |
