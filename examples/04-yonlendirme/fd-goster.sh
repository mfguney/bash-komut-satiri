#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 4: Bu betiği çalıştıran sürecin 0-9 arasındaki açık dosya tanımlayıcılarını
# ve her birinin neye bağlı olduğunu /proc üzerinden yazar (Linux'a özgüdür).
# Kullanım: ./fd-goster.sh [yönlendirmeler]   ör. ./fd-goster.sh 2>&1 >cikti.txt
for n in 0 1 2 3 4 5 6 7 8 9; do
    if [ -e "/proc/$$/fd/$n" ]; then
        # Çıktı fd 1'e yazılır; fd 1 bir dosyaya yönlendirilmişse tablo da oraya gider
        printf '%s -> %s\n' "$n" "$(readlink "/proc/$$/fd/$n")"
    fi
done
