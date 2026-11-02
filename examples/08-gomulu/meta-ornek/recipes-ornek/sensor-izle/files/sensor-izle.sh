#!/bin/sh
# SPDX-License-Identifier: MIT
# sensor-izle: Sıcaklık sensörünü belirli aralıklarla okur ve eşik aşımlarını günlüğe yazar.
# Hedef cihazda BusyBox ash ile çalışacak biçimde yalnızca POSIX sh özellikleri kullanır.
# Ayarlar /etc/default/sensor-izle dosyasından okunur (SENSOR_IZLE_AYAR ile değiştirilebilir).
# İletiler standart çıktıya yazılır; dosyaya veya journal'a yönlendirme servis yöneticisinin işidir.
# Sinyaller: SIGHUP ayarları yeniden okur; SIGTERM/SIGINT temiz biçimde sonlandırır.

AYAR_DOSYASI=${SENSOR_IZLE_AYAR:-/etc/default/sensor-izle}

ayar_oku() {
    # Varsayılanlar; ayar dosyası bunları geçersiz kılabilir
    ARALIK=5
    ESIK=26000                                   # mili-santigrat (hwmon biçimi)
    GIRDI=/sys/class/hwmon/hwmon0/temp1_input
    if [ -r "$AYAR_DOSYASI" ]; then
        # shellcheck source=/dev/null
        . "$AYAR_DOSYASI"
    fi
}

yaz() {
    printf '%s sensor-izle[%s]: %s\n' "$(date '+%Y-%m-%dT%H:%M:%S')" "$$" "$*"
}

bitir() {
    yaz "sonlandırılıyor ($1)"
    exit 0
}

trap 'ayar_oku; yaz "ayarlar yeniden okundu: aralik=$ARALIK esik=$ESIK"' HUP
trap 'bitir SIGTERM' TERM
trap 'bitir SIGINT' INT

ayar_oku
yaz "başladı: girdi=$GIRDI aralik=$ARALIK esik=$ESIK"
while :; do
    if deger=$(cat "$GIRDI" 2>/dev/null) && [ -n "$deger" ]; then
        case $deger in
            *[!0-9]*) yaz "HATA geçersiz okuma: $deger" ;;
            *)
                if [ "$deger" -ge "$ESIK" ]; then
                    yaz "UYARI eşik aşıldı: $((deger / 1000)).$((deger % 1000 / 100)) C"
                fi
                ;;
        esac
    else
        yaz "HATA sensör okunamadı: $GIRDI"
    fi
    # sleep arka planda çalıştırılıp beklenir; böylece sinyal işleyicileri gecikmeden çalışır
    sleep "$ARALIK" &
    wait $!
done
