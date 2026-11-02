#!/bin/bash
# SPDX-License-Identifier: MIT
# Bölüm 4: Sinyallerin yakalanmasını gösteren uzun süreli bir "servis" benzetimi.
# SIGHUP: yapılandırmayı yeniden okur; SIGTERM/SIGINT: temizleyip çıkar; SIGUSR1: durum yazar.
# Kullanım: ./sinyal-yakala.sh &   ardından kill -HUP/-USR1/-TERM <pid>
sayac=0
yapilandirma_oku() { echo "[$$] yapılandırma okundu"; }
temizle_ve_cik() {
    echo "[$$] $1 alındı, temizleniyor"
    exit "$2"
}
trap 'yapilandirma_oku' HUP
trap 'echo "[$$] durum: $sayac okuma"' USR1
trap 'temizle_ve_cik SIGTERM 143' TERM
trap 'temizle_ve_cik SIGINT 130' INT

yapilandirma_oku
while :; do
    sayac=$((sayac + 1))
    # sleep ön planda çalışırken bash sinyal işleyicisini sleep bitene kadar erteler;
    # arka planda başlatıp wait ile beklemek, işleyicinin hemen çalışmasını sağlar.
    sleep 1 &
    wait $!
done
