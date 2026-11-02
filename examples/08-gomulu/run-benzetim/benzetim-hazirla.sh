#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 8: run.do_install.ornek dosyasını çalıştırabilmek için, sensor-izle tarifinin
# WORKDIR dizinini (sources/ ve temp/) BitBake'in oluşturacağı yollarla hazırlar.
# BitBake gerektirmez; yalnızca kabuk görevinin nasıl çalıştığını göstermek içindir.
# Kullanım: ./benzetim-hazirla.sh <examples-dizini>
set -eu
ornek=${1:?Kullanım: benzetim-hazirla.sh <examples-dizini>}
W=$HOME/bitbake-builds/ornek/build/tmp/work/x86-64-v3-poky-linux/sensor-izle/1.0
dosyalar=$ornek/08-gomulu/meta-ornek/recipes-ornek/sensor-izle/files

H=$HOME/bitbake-builds/ornek/build/tmp/hosttools

rm -rf "$W" "$H"
mkdir -p "$W/sources" "$W/temp" "$W/recipe-sysroot-native/usr/bin" "$H"
# BitBake görevlerin PATH'ini kısıtlar: derleme makinesinden yalnızca HOSTTOOLS listesindeki
# araçlar tmp/hosttools altına bağlanır. Benzetimde birkaç temel araç bağlanır.
for arac in install cp mkdir rm ln cat sed grep seq; do
    ln -s "$(command -v "$arac")" "$H/$arac"
done
# do_unpack'in yaptığı gibi SRC_URI dosyaları UNPACKDIR'e (sources/) kopyalanır
cp "$dosyalar"/sensor-izle.sh "$dosyalar"/sensor-izle.init \
   "$dosyalar"/sensor-izle.service "$dosyalar"/sensor-izle.default "$W/sources/"
# Görev betiği: BitBake her çalıştırmada run.do_<görev>.<pid> yazar ve kısa adı ona bağlar
sed "s|/home/gelistirici|$HOME|g" "$ornek/08-gomulu/run-benzetim/run.do_install.ornek" \
    > "$W/temp/run.do_install.4242"
chmod 0775 "$W/temp/run.do_install.4242"
ln -sfn run.do_install.4242 "$W/temp/run.do_install"
echo "$W"
