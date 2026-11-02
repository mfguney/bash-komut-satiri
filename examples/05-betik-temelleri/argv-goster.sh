#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 5: Kendisine verilen argümanların sayısını ve her birini <...> içinde yazar.
# Tırnaklama, sözcük bölme ve glob genişletmesinin sonucunu görmek için kullanılır.
# Kullanım: ./argv-goster.sh [argümanlar...]
printf 'argüman sayısı: %d\n' "$#"
for arg in "$@"; do
    printf '  <%s>\n' "$arg"
done
