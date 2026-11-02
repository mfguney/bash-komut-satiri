#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 6: sensor.log günlüğünden sensör başına rapor üretir (yalnızca bash yerleşikleriyle).
# Koşullar, döngüler, ilişkisel diziler, fonksiyonlar ve [[ =~ ]] kullanımını gösterir.
# Kullanım: ./sensor-rapor.sh [-e eşik] [günlük-dosyası]
#   -e eşik   Uyarı eşiği, santigrat (varsayılan 26.0)

esik=26.0
if [[ $1 == -e ]]; then
    esik=$2
    shift 2
fi
gunluk=${1:-/var/log/sensor.log}

# "21.8" -> 218: bash yalnızca tam sayı aritmetiği yapar; değerler onda bir derece olarak tutulur.
ondaya_cevir() {
    local tam=${1%.*} kesir=${1#*.}
    [[ $1 == *.* ]] || kesir=0
    echo $(( 10#$tam * 10 + 10#${kesir:0:1} ))
}

# 218 -> "21.8"
ondalik_yaz() {
    printf '%d.%d' $(( $1 / 10 )) $(( $1 % 10 ))
}

# Satırı çözümler; sensör ve değeri çağıranın değişkenlerine yazar (dinamik kapsam).
# Dönüş değeri: 0 ölçüm satırı, 1 hata satırı, 2 tanınmayan satır
satir_coz() {
    local kalip_olcum='(sensor[0-9]+) sicaklik=([0-9]+\.[0-9])'
    local kalip_hata='HATA (sensor[0-9]+):'
    if [[ $1 =~ $kalip_olcum ]]; then
        sensor=${BASH_REMATCH[1]}
        deger=${BASH_REMATCH[2]}
        return 0
    elif [[ $1 =~ $kalip_hata ]]; then
        sensor=${BASH_REMATCH[1]}
        return 1
    fi
    return 2
}

if [[ ! -r $gunluk ]]; then
    echo "Günlük okunamıyor: $gunluk" >&2
    exit 1
fi

declare -A adet=() toplam=() enyuksek=() hata=()
esik_onda=$(ondaya_cevir "$esik")
tanimsiz=0
esik_asimi=()

while IFS= read -r satir; do
    sensor='' deger=''
    satir_coz "$satir"
    case $? in
        0)
            v=$(ondaya_cevir "$deger")
            (( adet[$sensor]++ , toplam[$sensor] += v ))
            if (( v > ${enyuksek[$sensor]:-0} )); then
                enyuksek[$sensor]=$v
            fi
            if (( v >= esik_onda )); then
                esik_asimi+=("${satir%% *} $sensor $deger")
            fi
            ;;
        1) (( hata[$sensor]++ )) ;;
        *) (( tanimsiz++ )) ;;
    esac
done < "$gunluk"

printf '%-8s %5s %6s %6s %5s\n' sensor adet ort max hata
# İlişkisel dizinin anahtarları sırasızdır; sıralı liste için sort kullanılır.
mapfile -t sensorler < <(printf '%s\n' "${!adet[@]}" "${!hata[@]}" | sort -u)
for s in "${sensorler[@]}"; do
    n=${adet[$s]:-0}
    if (( n > 0 )); then
        ort=$(ondalik_yaz $(( (toplam[$s] + n / 2) / n )))
        max=$(ondalik_yaz "${enyuksek[$s]}")
    else
        ort=- max=-
    fi
    printf '%-8s %5d %6s %6s %5d\n' "$s" "$n" "$ort" "$max" "${hata[$s]:-0}"
done

echo "Eşik ($esik) aşımı: ${#esik_asimi[@]}"
for kayit in "${esik_asimi[@]}"; do
    echo "  $kayit"
done
(( tanimsiz == 0 )) || echo "Tanınmayan satır: $tanimsiz"
