#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 2: Bir kök dosya sistemi dizininde (ör. Yocto'nun IMAGE_ROOTFS dizini veya
# açılmış bir imaj) güvenlik açısından dikkat gerektiren dosyaları listeler.
# Kullanım: rootfs-denetle.sh <rootfs-dizini>
set -eu
kok=${1:?Kullanım: rootfs-denetle.sh <rootfs-dizini>}
[ -d "$kok" ] || { echo "Dizin değil: $kok" >&2; exit 1; }
cd "$kok"

echo "== setuid/setgid dosyalar"
find . -xdev -type f \( -perm -4000 -o -perm -2000 \) -exec ls -l {} + | sed 's/^/  /'

echo "== herkesin yazabildiği dosyalar"
find . -xdev -type f -perm -0002 -print | sed 's/^/  /'

echo "== yapışkan biti olmayan, herkesin yazabildiği dizinler"
find . -xdev -type d -perm -0002 ! -perm -1000 -print | sed 's/^/  /'

echo "== kırık sembolik bağlantılar"
# -xtype l: bağlantı izlendiğinde hâlâ bağlantı görünüyorsa hedef yoktur (GNU find)
find . -xdev -xtype l -exec sh -c 'for b; do printf "  %s -> %s\n" "$b" "$(readlink "$b")"; done' sh {} +
