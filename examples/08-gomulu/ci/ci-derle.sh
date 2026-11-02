#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 8: Bir Yocto imajını CI ortamında derleyen ve hata durumunda görev günlüklerini
# toplayan betik. bitbake-setup ile oluşturulmuş bir kurulum dizini bekler.
# Kullanım: ci-derle.sh [-k] [-i imaj] [-o çıktı-dizini] <kurulum-dizini>
#   -k   bir görev başarısız olsa da bağımsız görevlere devam et (bitbake -k)
#   -i   derlenecek hedef (varsayılan: ornek-image)
#   -o   günlük ve raporların yazılacağı dizin (varsayılan: ./ci-cikti)
set -euo pipefail

imaj=ornek-image
cikti=$PWD/ci-cikti
devam=()
betik_dizini=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

while getopts 'ki:o:' s; do
    case $s in
        k) devam=(-k) ;;
        i) imaj=$OPTARG ;;
        o) cikti=$OPTARG ;;
        *) echo "Kullanım: ${0##*/} [-k] [-i imaj] [-o çıktı-dizini] <kurulum-dizini>" >&2; exit 2 ;;
    esac
done
shift $((OPTIND - 1))
kurulum=${1:?kurulum dizini verilmedi}
[[ -f $kurulum/build/init-build-env ]] || { echo "init-build-env bulunamadı: $kurulum/build" >&2; exit 2; }
mkdir -p -- "$cikti"
cikti=$(cd -- "$cikti" && pwd)
gunluk=$cikti/bitbake.log

# shellcheck disable=SC2329  # trap ile çağrılır
topla() {
    local durum=$?
    # Başarısız görevlerin günlüklerini CI yapıtı olarak kopyala ("    log: <yol>" satırları)
    if [[ -f $gunluk ]]; then
        sed -n 's/^    log: //p' "$gunluk" | while IFS= read -r f; do
            [[ -f $f ]] && cp -- "$f" "$cikti/"
        done
        # Özet betiği (Bölüm 3) bu betiğin yanında veya OZET_BETIGI ile verilen yolda aranır
        local ozet=${OZET_BETIGI:-$betik_dizini/bitbake-ozet.sh}
        if [[ -x $ozet ]]; then
            "$ozet" "$gunluk" > "$cikti/ozet.txt" || true
        fi
    fi
    echo "ci-derle: durum $durum, çıktılar: $cikti"
    exit "$durum"
}
trap 'topla' EXIT

# Ortam betikleri tanımsız değişkenlere başvurabilir ve dizin değiştirir:
# kaynaklama süresince -u kapatılır, sonra yeniden açılır.
set +u
# shellcheck source=/dev/null
source "$kurulum/build/init-build-env" > /dev/null
set -u

echo "ci-derle: $imaj derleniyor ($(pwd))"
# tee, bitbake'in çıktısını hem ekrana hem günlüğe yazar; pipefail bitbake'in durumunu korur
set +e
bitbake "${devam[@]}" "$imaj" 2>&1 | tee "$gunluk"
durum=${PIPESTATUS[0]}
set -e
exit "$durum"
