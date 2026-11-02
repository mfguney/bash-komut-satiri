# Kaynakça ve ileri okuma

## Resmî belgeler ve standartlar

- **GNU Bash Reference Manual** — bash'in başvuru kılavuzu; genişletme sırası, yerleşikler, kabuk
  seçenekleri. <https://www.gnu.org/software/bash/manual/>
- **Bash ana sayfası (Chet Ramey)** — sürüm notları, değişiklik listeleri ve SSS.
  <https://tiswww.case.edu/php/chet/bash/bashtop.html>
- **POSIX.1-2024, The Open Group Base Specifications Issue 8** — "Shell & Utilities" cildi, POSIX sh
  dilini ve standart araçları (grep, sed, awk, find, xargs) tanımlar.
  <https://pubs.opengroup.org/onlinepubs/9799919799/>
- **POSIX.1-2017, Issue 7** — önceki sürüm; birçok sistemin hâlâ esas aldığı tanımlar.
  <https://pubs.opengroup.org/onlinepubs/9699919799/>
- **Linux man-pages projesi** — sistem çağrıları ve kavram sayfaları: `signal(7)`, `pipe(7)`,
  `credentials(7)`, `path_resolution(7)`, `execve(2)`. <https://man7.org/linux/man-pages/>
- **GNU Coreutils, Grep, Sed, Gawk ve Findutils kılavuzları** — derleme makinesindeki GNU araçlarının
  ayrıntılı belgeleri. <https://www.gnu.org/software/coreutils/manual/>,
  <https://www.gnu.org/software/grep/manual/>, <https://www.gnu.org/software/sed/manual/>,
  <https://www.gnu.org/software/gawk/manual/>, <https://www.gnu.org/software/findutils/manual/>
- **Filesystem Hierarchy Standard 3.0** — Linux dizin hiyerarşisi.
  <https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html>
- **BusyBox** — proje sayfası ve applet başvurusu. <https://busybox.net/>,
  <https://busybox.net/downloads/BusyBox.html>
- **systemd birim belgeleri** — `systemd.service(5)` ve `systemd.exec(5)`.
  <https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html>,
  <https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html>
- **ShellCheck** — çevrimiçi denetleyici ve her uyarı için açıklamalı viki.
  <https://www.shellcheck.net/>, <https://github.com/koalaman/shellcheck/wiki>

## Yocto Project belgeleri

- **BitBake User Manual** — kabuk ve Python fonksiyonları, görevler, değişken genişletme.
  <https://docs.yoctoproject.org/bitbake/>
- **Yocto Project Reference Manual** — görevler, sınıflar (`update-rc.d`, `systemd`, `useradd`),
  değişkenler. <https://docs.yoctoproject.org/ref-manual/>, görevler için
  <https://docs.yoctoproject.org/ref-manual/tasks.html>
- **Yocto Project Development Tasks Manual** — kurulum sonrası betikler, salt okunur kök dosya
  sistemi, hata ayıklama. <https://docs.yoctoproject.org/dev-manual/>
- **BitBake kaynak kodu** — görev betiklerinin üretildiği `lib/bb/build.py` (`shell_trap_code`,
  `exec_func_shell`) ve `lib/bb/data.py` (`emit_var`, `emit_func`).
  <https://git.openembedded.org/bitbake/>

## Kitaplar

- William Shotts, *The Linux Command Line*, 2. baskı, No Starch Press, 2019. Yazarın sitesinde ücretsiz
  olarak da yayımlanmaktadır: <https://linuxcommand.org/tlcl.php>
- Arnold Robbins, Nelson H. F. Beebe, *Classic Shell Scripting*, O'Reilly, 2005.
- Alfred V. Aho, Brian W. Kernighan, Peter J. Weinberger, *The AWK Programming Language*, 2. baskı,
  Addison-Wesley, 2023.
- Michael Kerrisk, *The Linux Programming Interface*, No Starch Press, 2010 — süreçler, sinyaller,
  borular ve dosya tanımlayıcıları için sistem programlama başvurusu.
- Cameron Newham, *Learning the bash Shell*, 3. baskı, O'Reilly, 2005.

## Çevrimiçi eğitim ve başvuru

- **Greg's Wiki: BashGuide ve BashPitfalls** — bash'in doğru kullanımı ve yaygın hatalar üzerine
  topluluk belgeleri. <https://mywiki.wooledge.org/BashGuide>, <https://mywiki.wooledge.org/BashPitfalls>

## Kitaplıktaki diğer kitaplar

- <a href="../../yocto-gomulu-linux/index.html">Yocto Project ile Gömülü Linux</a>
- <a href="../../git-surum-kontrolu/index.html">Git ile Sürüm Kontrolü</a>
- <a href="../../c-derleme/index.html">C, Make ve CMake ile Derleme</a>
- <a href="../../python-gomulu/index.html">Gömülü Geliştirici için Python</a>
- <a href="../../cekirdek-onyukleme/index.html">Linux Çekirdeği ve Önyükleme</a>
- <a href="../../aygit-surucusu/index.html">Linux Aygıt Sürücüsü Geliştirme</a>
