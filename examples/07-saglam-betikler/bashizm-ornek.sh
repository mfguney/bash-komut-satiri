#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 7: /bin/sh betiğinde KASITLI OLARAK kullanılmış bash'e özgü yapılar (bashism).
# bash ile çalışır; dash veya BusyBox ash ile hata verir ya da farklı davranır.
# Taşınabilir karşılıkları için posix-karsilik.sh dosyasına bakılabilir.
dosyalar=(a.log b.log)
if [[ ${#dosyalar[@]} == 2 ]]; then
    echo -e "iki dosya:\t${dosyalar[*]}"
fi
for i in {1..3}; do
    sayi=$((i ** 2))
    echo "kare: $sayi"
done
function selam { echo "merhaba $1"; }
selam "${USER,,}"
