#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 4: Bir boru hattındaki her komutun çıkış durumunu PIPESTATUS ile raporlar.
# Kullanım: ./boru-durum.sh <günlük-dosyası>
gunluk=${1:-/var/log/sensor.log}

grep HATA "$gunluk" | sort | uniq -c
durumlar=("${PIPESTATUS[@]}")      # PIPESTATUS bir sonraki komutta değişir; hemen kopyalanır
echo "grep=${durumlar[0]} sort=${durumlar[1]} uniq=${durumlar[2]}"

case ${durumlar[0]} in
    0) echo "hata satırı bulundu" ;;
    1) echo "hata satırı yok" ;;
    *) echo "grep başarısız (dosya okunamadı?)" >&2; exit 2 ;;
esac
