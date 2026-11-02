#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 7: ShellCheck uyarılarını göstermek için KASITLI OLARAK HATALI yazılmış betik.
# Düzeltilmiş hali: duzeltilmis-betik.sh
hedef=$1
cd $hedef
for f in `ls *.log`; do
    boyut=$(stat -c %s $f)
    if [ $boyut -gt 1000 ]; then
        echo "büyük: $f"
    fi
done
local_kopya=yedek
rm -rf $hedef/eski/*
grep HATA *.log > /dev/null
if [ $? -eq 0 ]; then echo "hata var"; fi
