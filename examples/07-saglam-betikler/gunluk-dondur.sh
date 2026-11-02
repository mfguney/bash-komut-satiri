#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 7 alıştırmasının örnek çözümü.
# gunluk-dondur.sh: boyutu aşan günlüğü döndürür (POSIX sh)
set -eu
adet=3 boyut=512
kullanim() { echo "Kullanım: ${0##*/} [-n adet] [-b boyut_kb] <günlük>" >&2; exit 2; }
while getopts 'n:b:' s; do
    case $s in
        n) adet=$OPTARG ;;
        b) boyut=$OPTARG ;;
        *) kullanim ;;
    esac
done
shift $((OPTIND - 1))
[ $# -eq 1 ] || kullanim
case $adet$boyut in ''|*[!0-9]*) kullanim ;; esac
dosya=$1
[ -f "$dosya" ] || { echo "dosya yok: $dosya" >&2; exit 1; }

kilit=${TMPDIR:-/run}/gunluk-dondur.kilit
mkdir "$kilit" 2>/dev/null || { echo "başka bir örnek çalışıyor" >&2; exit 1; }
trap 'rmdir "$kilit"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

kb=$(( $(wc -c < "$dosya") / 1024 ))
[ "$kb" -ge "$boyut" ] || exit 0

rm -f -- "$dosya.$adet"
i=$adet
while [ "$i" -gt 1 ]; do
    onceki=$((i - 1))
    [ ! -e "$dosya.$onceki" ] || mv -- "$dosya.$onceki" "$dosya.$i"
    i=$onceki
done
mv -- "$dosya" "$dosya.1"
: > "$dosya"
chmod "$(stat -c %a "$dosya.1")" "$dosya"   # GNU ve BusyBox stat -c destekler
