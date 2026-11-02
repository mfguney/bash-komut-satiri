# Örnek dosyalar

Bu dizindeki dosyalar *Linux Komut Satırı ve Bash* kitabının bölümlerinde kullanılır. Kabuk betiklerinin
tamamı `bash -n` (POSIX sh betikleri ayrıca `dash -n`) ve ShellCheck 0.11 ile denetlenmiş, Ubuntu 24.04
üzerinde bash 5.2, dash 0.5.12 ve (hedef betikleri için) BusyBox 1.36.1 ile çalıştırılarak denenmiştir.
Lisans: MIT (`COPYING.MIT`).

Kitap deposu bir dosya sisteminden yürütme izinleri korunmadan kopyalandıysa betikler önce
`install -m 0755 kaynak hedef` ile kurulmalı veya `sh betik.sh` / `bash betik.sh` biçiminde çalıştırılmalıdır.

| Dosya | Bölüm | Açıklama |
|---|---|---|
| `01-kabuk/sensor-oku` | 1 | Yocto kitabındaki `sensor-oku` C programının POSIX sh benzetimi; PATH ve hash örnekleri |
| `01-kabuk/bashrc-ekleri.sh` | 1 | `~/.bashrc` için geçmiş, PATH ve takma ad ayarları |
| `02-dosya-sistemi/ornek-rootfs-olustur.sh` | 2 | Kasıtlı hatalar içeren küçük bir örnek kök dosya sistemi oluşturur |
| `02-dosya-sistemi/rootfs-denetle.sh` | 2 | setuid/setgid, herkesin yazabildiği dosya, yapışkan bit ve kırık bağlantı denetimi |
| `03-metin-isleme/veri/sensor.log` | 3, 4, 6 | Ağ geçidi günlük kesiti (örnek veri) |
| `03-metin-isleme/veri/sensor.conf` | 3 | Yorum satırları içeren örnek yapılandırma |
| `03-metin-isleme/veri/bitbake-cikti.txt` | 3, 8 | Temsili BitBake konsol çıktısı (uyarılar ve bir başarısız görev) |
| `03-metin-isleme/sensor-ozet.awk` | 3 | Sensör başına istatistik (POSIX awk; gawk, mawk, BusyBox awk) |
| `03-metin-isleme/bitbake-ozet.sh` | 3, 8 | BitBake çıktısından QA türleri, başarısız görevler ve günlük yolları |
| `04-yonlendirme/fd-goster.sh` | 4 | Sürecin 0–9 numaralı dosya tanımlayıcılarını `/proc` üzerinden yazar |
| `04-yonlendirme/boru-durum.sh` | 4 | `PIPESTATUS` ile boru hattındaki her komutun durumu |
| `04-yonlendirme/sinyal-yakala.sh` | 4 | HUP, USR1, TERM ve INT sinyallerini yakalayan servis benzetimi |
| `05-betik-temelleri/argv-goster.sh` | 5, 6 | Argümanları `<…>` içinde yazar; tırnaklama ve genişletme deneyleri |
| `05-betik-temelleri/yol-islemleri.sh` | 5 | Parametre genişletmesiyle yol ve uzantı işlemleri |
| `05-betik-temelleri/ortam-ayarla.sh` | 5 | Kaynaklanmak üzere yazılmış ortam betiği (`oe-init-build-env` ilkesi) |
| `06-kosul-dongu/sensor-rapor.sh` | 6 | `while read`, `[[ =~ ]]`, ilişkisel diziler ve fonksiyonlarla rapor |
| `06-kosul-dongu/kapsam-deneme.sh` | 6 | Dinamik kapsam, `local` ve dönüş değeri |
| `07-saglam-betikler/saglam-sablon.sh` | 7 | `set -Eeuo pipefail`, trap EXIT/ERR, mktemp, getopts içeren şablon |
| `07-saglam-betikler/yedekle.sh` | 7 | getopts, flock kilidi, mktemp ve atomik `mv` ile yedekleme |
| `07-saglam-betikler/set-e-tuzaklari.sh` | 7 | `set -e`'nin uygulanmadığı dokuz durumun gösterimi |
| `07-saglam-betikler/hatali-betik.sh` | 7 | ShellCheck gösterimi için **kasıtlı olarak hatalı** betik |
| `07-saglam-betikler/duzeltilmis-betik.sh` | 7 | Aynı betiğin uyarıları giderilmiş hali |
| `07-saglam-betikler/bashizm-ornek.sh` | 7 | `#!/bin/sh` betiğinde **kasıtlı** bash'e özgü yapılar |
| `07-saglam-betikler/posix-karsilik.sh` | 7 | Aynı işin POSIX sh karşılığı |
| `07-saglam-betikler/gunluk-dondur.sh` | 7 | Alıştırma çözümü: POSIX sh günlük döndürme betiği |
| `08-gomulu/busybox-uyum.sh` | 8 | Çalıştıran kabuğun bash'e özgü yapıları destekleyip desteklemediğini sınar |
| `08-gomulu/meta-ornek/recipes-ornek/sensor-izle/` | 8 | Tarif, POSIX sh servis betiği, SysV init betiği, systemd birimi ve ayar dosyası |
| `08-gomulu/run-benzetim/run.do_install.ornek` | 8 | BitBake'in `run.do_install` yapısını izleyen, kısaltılmış görev betiği |
| `08-gomulu/run-benzetim/benzetim-hazirla.sh` | 8 | Görev betiğini çalıştırmak için WORKDIR düzenini hazırlar |
| `08-gomulu/ci/ci-derle.sh` | 8 | Yocto derlemesi için CI betiği: durum koruma, günlük toplama |
| `08-gomulu/ci/sahte-kurulum-olustur.sh` | 8 | `ci-derle.sh`'yi Yocto olmadan denemek için sahte kurulum |
| `08-gomulu/ilk-acilis/` | 8 | Alıştırma çözümü: ilk açılışta cihaz kimliği üreten betik ve systemd birimi |

## Doğrulama notları

- `sensor-izle_1.0.bb` tarifi BitBake ile derlenmemiştir; tarifin `do_install` gövdesi
  `run-benzetim` düzeninde dash ile çalıştırılarak, `sensor-izle.init` ise hem Debian hem BusyBox
  `start-stop-daemon` ile denenmiştir. Tarif, Yocto kitabındaki `meta-ornek` katmanına eklenmek üzere
  yazılmıştır.
- `ci-derle.sh` gerçek bir Yocto derlemesinde değil, `sahte-kurulum-olustur.sh` ile oluşturulan sahte
  `bitbake` ve `init-build-env` ile denenmiştir.
- `run.do_install.ornek` dosyasındaki kabuk tuzağı kodu BitBake'in `lib/bb/build.py` dosyasından
  alınmıştır ve bu nedenle ShellCheck'in bilgi düzeyindeki (SC2086, SC2329) iletilerini içerir.
- BusyBox'a ilişkin sonuçlar Ubuntu'nun BusyBox 1.36.1 yapılandırmasına aittir; Yocto'nun `busybox`
  tarifinin yapılandırması farklı olabilir.

Tüm betikleri yeniden denetlemek için (kasıtlı hatalı iki betik uyarı verir):

```bash
git ls-files -z '*.sh' '*.init' 01-kabuk/sensor-oku | xargs -0 shellcheck -S warning
```
