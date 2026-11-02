#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 7: bashizm-ornek.sh betiğinin POSIX sh karşılığı (dash, BusyBox ash, bash ile aynı çıktı).
set -- a.log b.log                      # dizi yerine konumsal parametreler
if [ "$#" -eq 2 ]; then
    printf 'iki dosya:\t%s\n' "$*"      # echo -e yerine printf
fi
i=1
while [ "$i" -le 3 ]; do                # {1..3} yerine sayaçlı döngü
    sayi=$((i * i))                     # ** POSIX değildir
    echo "kare: $sayi"
    i=$((i + 1))
done
selam() { echo "merhaba $1"; }          # 'function' anahtar sözcüğü POSIX değildir
selam "$(printf '%s' "${USER:-kullanici}" | tr '[:upper:]' '[:lower:]')"
