#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 8 alıştırmasının örnek çözümü. KIMLIK_DOSYASI ile hedef yol değiştirilebilir (deneme için).
# ilk-acilis.sh: cihaza özgü kimlik dosyasını bir kez oluşturur
set -eu
hedef=${KIMLIK_DOSYASI:-/data/kimlik}
[ -e "$hedef" ] && exit 0
mac=
for f in /sys/class/net/*/address; do
    [ -e "$f" ] || continue
    ad=${f%/address}; ad=${ad##*/}
    [ "$ad" = lo ] && continue
    mac=$(tr -d ':\n' < "$f")
    break
done
[ -n "$mac" ] || { echo "ilk-acilis: ağ arabirimi bulunamadı" >&2; exit 1; }
gecici=$(mktemp "$hedef.XXXXXX")
trap 'rm -f -- "$gecici"' EXIT
printf 'agecidi-%s\n' "$mac" > "$gecici"
chmod 0644 "$gecici"
mv -- "$gecici" "$hedef"
