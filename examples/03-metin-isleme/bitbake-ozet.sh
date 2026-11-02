#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 3: Bir BitBake konsol çıktısını (ör. bitbake ... 2>&1 | tee derleme.log) özetler.
# Kullanım: bitbake-ozet.sh <derleme-günlüğü>
set -eu
gunluk=${1:?Kullanım: bitbake-ozet.sh <derleme-günlüğü>}

echo "== QA uyarı türleri"
# QA etiketleri satır sonunda köşeli parantez içinde yer alır: [ldflags]
grep -oE '\[[a-z][a-z0-9-]*\]$' "$gunluk" | sort | uniq -c | sort -rn

echo "== Uyarı veren tarif ve görevler"
sed -n 's/^WARNING: \([^ ]*\) \(do_[a-z_]*\): .*/  \1 \2/p' "$gunluk"

echo "== Başarısız görevler"
sed -n 's/^ERROR: Task (\(.*\)) failed.*/\1/p' "$gunluk" | awk -F/ '{ print "  " $NF }'

echo "== Hata günlükleri"
sed -n 's/^ERROR: Logfile of failure stored in: /  /p' "$gunluk"

echo "== İlk derleyici hatası"
# Boru hattında grep'in başarısızlığı görünmez (çıkış durumu son komutundur); bu nedenle
# sonuç önce bir değişkene alınır, ardından sınanır.
ilk=$(grep -m 1 -E '^\| .*error:' "$gunluk" || true)
if [ -n "$ilk" ]; then
    printf '  %s\n' "${ilk#| }"
else
    echo "  (bulunamadı)"
fi
