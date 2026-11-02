#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 7: hatali-betik.sh dosyasının ShellCheck uyarıları giderilmiş hali.
# Kullanım: ./duzeltilmis-betik.sh <günlük-dizini>
set -euo pipefail
hedef=${1:?Kullanım: duzeltilmis-betik.sh <günlük-dizini>}
cd -- "$hedef" || exit 1                # SC2164: cd başarısız olursa devam etme
shopt -s nullglob
for f in ./*.log; do                    # SC2045: ls çıktısı yerine glob
    boyut=$(stat -c %s -- "$f")         # SC2086: değişkenler tırnaklanır
    if (( boyut > 1000 )); then
        echo "büyük: $f"
    fi
done
rm -rf -- ./eski/*                       # göreli yol: hedef boş olsa bile /eski/* silinmez
if grep -q HATA ./*.log; then           # SC2181: $? yerine komut doğrudan sınanır
    echo "hata var"
fi
