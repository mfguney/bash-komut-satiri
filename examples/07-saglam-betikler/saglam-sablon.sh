#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 7: Sağlam bir bash betiği için başlangıç şablonu.
# Kullanım: ./saglam-sablon.sh [-v] [-o çıktı-dizini] <girdi>...
set -Eeuo pipefail         # E: ERR tuzağı fonksiyonlara da geçer; e: hata olunca dur;
                           # u: tanımsız değişken hatadır; pipefail: boru hattındaki hatayı yakala
shopt -s inherit_errexit   # bash 4.4+: komut ikamesi de set -e davranışını devralır

readonly BETIK=${0##*/}
ayrintili=0
cikti=.

kullanim() {
    cat <<KULLANIM
Kullanım: $BETIK [-v] [-o çıktı-dizini] <girdi>...
  -v            ayrıntılı çıktı
  -o DİZİN      sonuçların yazılacağı dizin (varsayılan: .)
  -h            bu yardım
KULLANIM
}

gunluk() { (( ayrintili )) && printf '%s: %s\n' "$BETIK" "$*" >&2; return 0; }
olumcul() { printf '%s: HATA: %s\n' "$BETIK" "$*" >&2; exit 1; }

gecici=''
temizle() {
    local durum=$?
    [[ -n $gecici ]] && rm -rf -- "$gecici"
    exit "$durum"
}
hata_yakala() {
    printf '%s: satır %s: komut başarısız (durum %s): %s\n' \
        "$BETIK" "${BASH_LINENO[0]}" "$1" "$BASH_COMMAND" >&2
}
trap temizle EXIT
trap 'hata_yakala $?' ERR

while getopts ':vo:h' secenek; do
    case $secenek in
        v) ayrintili=1 ;;
        o) cikti=$OPTARG ;;
        h) kullanim; exit 0 ;;
        :) olumcul "-$OPTARG seçeneği bir değer gerektirir" ;;
        ?) olumcul "bilinmeyen seçenek: -$OPTARG (yardım için -h)" ;;
    esac
done
shift $((OPTIND - 1))
(( $# > 0 )) || { kullanim >&2; exit 2; }
[[ -d $cikti ]] || olumcul "çıktı dizini yok: $cikti"

gecici=$(mktemp -d)
gunluk "geçici dizin: $gecici"

for girdi in "$@"; do
    gunluk "işleniyor: $girdi"
    [[ -r $girdi ]] || olumcul "okunamıyor: $girdi"
    # Asıl iş burada yapılır; sonuç önce geçici dizine yazılır, sonra taşınır
    sort -- "$girdi" > "$gecici/sonuc"
    mv -- "$gecici/sonuc" "$cikti/${girdi##*/}.sirali"
done
gunluk "tamamlandı"
