#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 6: bash fonksiyonlarında değişken kapsamı (dinamik kapsam) ve dönüş değeri.
# Kullanım: ./kapsam-deneme.sh
seviye=genel

goster() {
    # 'seviye' burada tanımlanmamıştır; çağıran fonksiyonun yerel değişkeni görülür
    echo "  goster(): seviye=$seviye (çağıran: ${FUNCNAME[1]})"
}

yerel_kullanan() {
    local seviye=yerel
    goster
}

genel_degistiren() {
    seviye=degisti          # local yok: genel değişkenin üzerine yazar
    goster
}

hesapla() {
    # Sonuç standart çıktıya yazılır; dönüş değeri yalnızca başarı/başarısızlık bildirir
    local a=$1 b=$2
    (( b != 0 )) || return 1
    echo $(( a / b ))
}

echo "başlangıç: seviye=$seviye"
yerel_kullanan
echo "yerel_kullanan sonrası: seviye=$seviye"
genel_degistiren
echo "genel_degistiren sonrası: seviye=$seviye"

if sonuc=$(hesapla 84 4); then echo "84/4 = $sonuc"; fi
# Dikkat: 'if ! komut; then echo $?' her zaman 0 yazar, çünkü $? artık '!' işlecinin sonucudur.
sonuc=$(hesapla 1 0) || echo "1/0: hesaplanamadı (dönüş değeri $?)"
