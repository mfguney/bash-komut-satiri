#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 2: Gömülü bir kök dosya sisteminin (rootfs) küçük bir benzerini oluşturur.
# Gerçek bir imajın yerine, rootfs-denetle.sh betiğini denemek için kullanılır.
# Kullanım: ornek-rootfs-olustur.sh <hedef-dizin>
set -eu
hedef=${1:?Kullanım: ornek-rootfs-olustur.sh <hedef-dizin>}

mkdir -p "$hedef"
cd "$hedef"
mkdir -p bin sbin etc/init.d usr/bin usr/sbin usr/lib var/volatile/log var/volatile/tmp \
         run tmp proc sys dev home/root data
# Yocto'daki gibi /var/log ve /var/tmp, geçici bellekteki /var/volatile altına bağlantıdır
ln -sfn volatile/log var/log
ln -sfn volatile/tmp var/tmp

printf '#!/bin/sh\necho busybox benzetimi\n' > bin/busybox
chmod 0755 bin/busybox
# BusyBox uygulamaları (applet) tek ikili dosyaya sembolik bağlantıdır
for uygulama in sh ls cat mount; do
    ln -sfn busybox "bin/$uygulama"
done
printf '#!/bin/sh\necho sensor-oku\n' > usr/bin/sensor-oku
chmod 0755 usr/bin/sensor-oku
printf '#!/bin/sh\necho su\n' > bin/su
chmod 4755 bin/su                          # setuid: kasıtlı olarak eklendi
printf 'aralik=5\n' > etc/sensor.conf
chmod 0644 etc/sensor.conf
printf 'gecici\n' > data/kalibrasyon.csv
chmod 0666 data/kalibrasyon.csv            # herkes yazabilir: kasıtlı hata
chmod 1777 tmp var/volatile/tmp            # yapışkan bit
chmod 0700 home/root
ln -sfn ../usr/bin/yok etc/kirik-baglanti  # kırık sembolik bağlantı: kasıtlı hata
