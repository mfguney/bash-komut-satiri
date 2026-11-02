#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 7: Cihazdaki yapılandırma dizininin sıkıştırılmış yedeğini alır ve eski yedekleri döndürür.
# getopts, trap, mktemp, flock ile kilit ve atomik yeniden adlandırmayı birlikte gösterir.
# Kullanım: ./yedekle.sh [-n saklanacak-adet] [-k kaynak-dizin] <hedef-dizin>
set -euo pipefail

kaynak=/etc
saklanacak=5

kullanim() { echo "Kullanım: ${0##*/} [-n adet] [-k kaynak-dizin] <hedef-dizin>" >&2; exit 2; }

while getopts 'n:k:' s; do
    case $s in
        n) saklanacak=$OPTARG ;;
        k) kaynak=$OPTARG ;;
        *) kullanim ;;
    esac
done
shift $((OPTIND - 1))
[[ $# -eq 1 ]] || kullanim
hedef=$1
[[ $saklanacak =~ ^[1-9][0-9]*$ ]] || { echo "geçersiz adet: $saklanacak" >&2; exit 2; }
mkdir -p -- "$hedef"

# Aynı anda iki yedeğin çalışmasını engelle: kilit, fd 9 üzerinde açık tutulan dosyadır.
# Süreç hangi nedenle sonlanırsa sonlansın çekirdek fd'yi kapatır ve kilit kendiliğinden kalkar.
exec 9> "$hedef/.yedekle.kilit"
if ! flock -n 9; then
    echo "başka bir yedekleme sürüyor" >&2
    exit 1
fi

gecici=$(mktemp "$hedef/.yedek.XXXXXX")
trap 'rm -f -- "$gecici"' EXIT          # yarım kalan arşiv geride bırakılmaz

ad="yedek-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -C "$(dirname -- "$kaynak")" -czf "$gecici" "$(basename -- "$kaynak")"
mv -- "$gecici" "$hedef/$ad"            # aynı dosya sisteminde mv atomiktir
echo "yedek alındı: $hedef/$ad"

# En yeni $saklanacak yedek dışındakileri sil (adlar tarih içerdiğinden sıralama yeterlidir)
mapfile -t eskiler < <(find "$hedef" -maxdepth 1 -name 'yedek-*.tar.gz' | sort -r | tail -n +$((saklanacak + 1)))
for f in "${eskiler[@]}"; do
    rm -f -- "$f"
    echo "silindi: $f"
done
