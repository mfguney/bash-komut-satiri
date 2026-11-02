#!/usr/bin/awk -f
# SPDX-License-Identifier: MIT
# Bölüm 3: sensor.log günlüğünden sensör başına istatistik üretir.
# Satır biçimi: <zaman> <makine> <süreç>[pid]: sensorN sicaklik=<değer> durum=<durum>
#               <zaman> <makine> <süreç>[pid]: HATA sensorN: <açıklama>
# Kullanım: awk -f sensor-ozet.awk sensor.log
# Yalnızca POSIX awk özellikleri kullanılır (gawk, mawk ve BusyBox awk ile çalışır).

$4 ~ /^sensor[0-9]+$/ {
    split($5, parca, "=")            # "sicaklik=21.8" -> parca[1]="sicaklik", parca[2]="21.8"
    s = $4
    v = parca[2] + 0                 # sayıya dönüştür
    adet[s]++
    toplam[s] += v
    if (!(s in enaz) || v < enaz[s]) enaz[s] = v
    if (!(s in encok) || v > encok[s]) encok[s] = v
    if ($6 == "durum=ESIK") esik[s]++
    next
}

$4 == "HATA" {
    s = $5
    sub(/:$/, "", s)                 # "sensor2:" -> "sensor2"
    hata[s]++
    if (!(s in adet)) adet[s] = 0
}

END {
    printf "%-8s %5s %6s %6s %6s %5s %5s\n", "sensor", "adet", "min", "max", "ort", "esik", "hata"
    fflush()
    siralama = "sort"
    for (s in adet) {
        ort = adet[s] ? toplam[s] / adet[s] : 0
        printf "%-8s %5d %6.1f %6.1f %6.2f %5d %5d\n", s, adet[s], enaz[s], encok[s], ort, esik[s], hata[s] | siralama
    }
    close(siralama)
}
