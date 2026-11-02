# Komut özeti

Kitapta ele alınan komut ve yapıların hızlı başvuru listesi. Ayrıntılar ve tuzaklar için ilgili bölüme
bakılmalıdır. "bash" işaretli yapılar POSIX sh'de (dash, çoğu BusyBox yapılandırması) bulunmaz.

## Komut türleri ve yardım (Bölüm 1)

```bash
type -a ad              # tüm karşılıklar: takma ad, anahtar sözcük, fonksiyon, yerleşik, dosya
command -v ad           # betiklerde varlık sınaması (POSIX)
hash; hash -r           # PATH önbelleğini göster / boşalt
help yerleşik           # bash yerleşiklerinin yardımı
man 5 crontab; man -k sözcük
history 20; !!; !$; !n; ^eski^yeni
compgen -c ön; complete -W "a b" komut
```

## Dosyalar ve izinler (Bölüm 2)

```bash
ls -li; stat -c '%i %h %A %a %U:%G %n' dosya
ln hedef ad; ln -s hedef ad; readlink -f ad
chmod 640 f; chmod u+x,go-w f; chmod -R u=rwX,go=rX dizin
umask; umask 077
install -d -m 0755 dizin; install -m 0644 -o root -g sensor kaynak hedef
chown kullanıcı:grup f; id; groups
find / -xdev -perm -4000 -type f            # setuid dosyalar
echo 'x' | sudo tee /etc/dosya >/dev/null   # sudo ile yazma
```

## Metin işleme (Bölüm 3)

```bash
grep -nE 'HATA|UYARI' f; grep -c; grep -v; grep -o; grep -q; grep -rn --include='*.bb' kalıp dizin
sed -n '5,10p' f; sed 's/a/b/g' f; sed -i.yedek '/^#/d' f; sed -E 's/(x+)/[\1]/' f
awk -F: '{ print $1, $NF }' /etc/passwd
awk -v e="$ESIK" '$2 > e { n++ } END { print n }' f
find . -name '*.c' -newer ref -size -100c -print
find . -path ./build -prune -o -name '*.bb' -print
find . -name '*.log' -print0 | xargs -0 -r -n 50 gzip
find . -name '*.sh' -exec shellcheck {} +
sort | uniq -c | sort -rn; cut -d: -f1; tr -d '\r'; LC_ALL=C sort
```

## Yönlendirme, borular, süreçler (Bölüm 4)

```bash
komut > f 2>&1          # her iki akış dosyaya (sıra önemli)
komut 2>&1 >/dev/null | grep x   # yalnızca standart hata boruya
komut &> f              # bash kısaltması
exec 3> kayit.txt; echo x >&3; exec 3>&-
cat <<'SON' > ayar.conf ... SON     # here-doc (tırnaklı: genişletme yok)
tr a-z A-Z <<< "metin"; diff <(sort a) <(sort b)        # bash
echo "${PIPESTATUS[@]}"; set -o pipefail
(cd dizin && make); { komut1; komut2; } > f
komut & pid=$!; wait "$pid"; echo $?
jobs -l; fg %1; bg %1; disown %1; kill %1
kill -TERM pid; kill -l; pkill ad
nohup komut > f 2>&1 &; setsid komut; timeout 30m komut
grep --line-buffered; stdbuf -oL komut
```

## Değişkenler ve genişletmeler (Bölüm 5)

```bash
ad=değer; export AD=değer; AD=değer komut; env -i komut; . ./ortam.sh
"$@" "$#" "$?" "$$" "$!" "$0"
'tek tırnak'  "çift $tırnak"  $'sekme\t'  \karakter
${x:-v} ${x:=v} ${x:?ileti} ${x:+v} ${#x}
${x#k} ${x##k} ${x%k} ${x%%k}               # POSIX
${x/a/b} ${x//a/b} ${x:i:n} ${x^^} ${x,,}   # bash
$(komut)  $((a + b * 2))  $((10#$saat))
shopt -s nullglob dotglob globstar; set -f; set -x
```

## Koşullar, döngüler, diziler, fonksiyonlar (Bölüm 6)

```bash
if komut; then …; elif …; else …; fi
[ -f "$f" ] && [ "$a" = b ]; [ "$n" -lt 5 ]
[[ $s == ön* ]]; [[ $s =~ ^([0-9]+)$ ]] && echo "${BASH_REMATCH[1]}"   # bash
(( n > 5 ))                                                           # bash
case $x in a|b) … ;; *.log) … ;; *) … ;; esac
for f in *.conf; do …; done; for ((i = 0; i < n; i++)); do …; done
while IFS= read -r satir; do …; done < dosya
while IFS= read -r -d '' f; do …; done < <(find . -print0)
a=(x 'y z'); a+=(w); "${a[@]}"; ${#a[@]}; "${!a[@]}"                   # bash
declare -A m=([k]=v); m[k2]=v2; "${!m[@]}"                             # bash 4+
mapfile -t satirlar < dosya                                            # bash 4+
f() { local x=$1; …; return 0; }; sonuc=$(f arg)
```

## Sağlam betikler (Bölüm 7)

```bash
set -Eeuo pipefail; shopt -s inherit_errexit
trap 'temizle' EXIT; trap 'hata_yakala $?' ERR; trap 'exit 143' TERM
gecici=$(mktemp); dizin=$(mktemp -d); yeni=$(mktemp "$hedef.XXXXXX")
mv -- "$yeni" "$hedef"                       # atomik değiştirme
while getopts ':vo:h' s; do case $s in …; esac; done; shift $((OPTIND - 1))
exec 9> kilit; flock -n 9 || exit 1
mkdir "$kilit" 2>/dev/null || exit 1          # flock yoksa
cd -- "$d" || exit 1; komut || true
shellcheck -f gcc betik.sh; shellcheck -s sh betik.sh
printf '%s\n' "$x"                           # echo yerine
```

## Gömülü sistem ve Yocto (Bölüm 8)

```bash
busybox --list; busybox sh betik.sh; readlink -f /bin/sh
bitbake -c menuconfig busybox; bitbake -c diffconfig busybox
/etc/init.d/servis start|stop|restart|reload|status
start-stop-daemon -S -b -m -p /run/x.pid -x /usr/bin/x
start-stop-daemon -K -p /run/x.pid -s TERM
systemctl status servis; journalctl -u servis
cat ${WORKDIR}/temp/run.do_install; less ${WORKDIR}/temp/log.do_install
sh -x ${WORKDIR}/temp/run.do_install
bitbake -c install -f tarif; bitbake -c devshell tarif
bitbake-getvar -r tarif --value WORKDIR
bitbake -k imaj 2>&1 | tee derleme.log; durum=${PIPESTATUS[0]}
```

```bitbake
inherit update-rc.d systemd useradd
INITSCRIPT_NAME = "servis"
INITSCRIPT_PARAMS = "defaults 90 10"
SYSTEMD_SERVICE:${PN} = "servis.service"
pkg_postinst:${PN}() {
    if [ -n "$D" ]; then …; else …; fi      # $D ayraçsız; exit kullanılmaz
}
```
