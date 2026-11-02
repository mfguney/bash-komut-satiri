#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 5: Parametre genişletmesiyle dosya yolunun parçalarına ayrılması.
# Dış komut (basename, dirname, sed) çağırmadan çalışır; döngülerde bu nedenle hızlıdır.
# Kullanım: ./yol-islemleri.sh [yol]
yol=${1:-tmp/deploy/images/qemux86-64/ornek-image-qemux86-64.rootfs.wic.bz2}

echo "yol            : $yol"
echo "dizin (%/*)    : ${yol%/*}"          # sondan en kısa '/...' kaldırılır
echo "ad (##*/)      : ${yol##*/}"         # baştan en uzun '.../' kaldırılır
ad=${yol##*/}
echo "son uzantı     : ${ad##*.}"          # en uzun '*.' kaldırılır -> bz2
echo "uzantısız (%.*): ${ad%.*}"           # sondan en kısa '.*' -> ...rootfs.wic
echo "kök ad (%%.*)  : ${ad%%.*}"          # sondan en uzun '.*' -> ornek-image-qemux86-64
makine=${ad#ornek-image-}                  # baştan sabit önek kaldırılır
echo "makine (# ve %%): ${makine%%.*}"
echo "değiştir (/)   : ${ad/.wic.bz2/.wic}"
echo "uzunluk (#)    : ${#ad}"
