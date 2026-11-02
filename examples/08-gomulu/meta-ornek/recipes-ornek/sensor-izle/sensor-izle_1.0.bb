# SPDX-License-Identifier: MIT
SUMMARY = "Sıcaklık sensörü izleme servisi (POSIX sh)"
DESCRIPTION = "Sensörü belirli aralıklarla okuyan ve eşik aşımlarını günlüğe yazan kabuk betiği; \
SysV init betiği ve systemd birimiyle birlikte gelir."
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://sensor-izle.sh \
           file://sensor-izle.init \
           file://sensor-izle.service \
           file://sensor-izle.default \
          "
S = "${UNPACKDIR}"

inherit update-rc.d systemd

INITSCRIPT_NAME = "sensor-izle"
INITSCRIPT_PARAMS = "defaults 90 10"
SYSTEMD_SERVICE:${PN} = "sensor-izle.service"

# Betik derlenmez; do_configure ve do_compile boş bırakılır
do_configure[noexec] = "1"
do_compile[noexec] = "1"

# Kabuk görevi: BitBake ${...} başvurularını önceden genişletir, kalan kod /bin/sh ile
# set -e altında çalışır. Bu nedenle yalnızca POSIX sh yapıları kullanılır.
do_install() {
    install -d ${D}${bindir} ${D}${sysconfdir}/default
    install -m 0755 ${S}/sensor-izle.sh ${D}${bindir}/sensor-izle
    install -m 0644 ${S}/sensor-izle.default ${D}${sysconfdir}/default/sensor-izle

    if ${@bb.utils.contains('DISTRO_FEATURES', 'sysvinit', 'true', 'false', d)}; then
        install -d ${D}${sysconfdir}/init.d
        install -m 0755 ${S}/sensor-izle.init ${D}${sysconfdir}/init.d/sensor-izle
    fi
    if ${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'true', 'false', d)}; then
        install -d ${D}${systemd_system_unitdir}
        install -m 0644 ${S}/sensor-izle.service ${D}${systemd_system_unitdir}/
    fi
}

CONFFILES:${PN} = "${sysconfdir}/default/sensor-izle"

# Kurulum sonrası betik. İmaj oluşturulurken derleme makinesinde çalışır ve D kök dosya
# sisteminin yoludur; paket çalışan bir cihaza kurulursa cihazda çalışır ve D boştur.
# $D, BitBake'in genişletmemesi için kıvrık ayraçsız yazılır. Sınıflar bu fonksiyona kendi
# kodlarını ekleyebildiğinden 'exit' kullanılmaz.
pkg_postinst:${PN}() {
    if [ -n "$D" ]; then
        echo "sensor-izle: kök dosya sistemine kuruldu: $D"
    elif [ -x ${sysconfdir}/init.d/sensor-izle ]; then
        # Cihazda paket güncellemesi: çalışan servis yeni sürümle yeniden başlatılır
        if ${sysconfdir}/init.d/sensor-izle status >/dev/null 2>&1; then
            ${sysconfdir}/init.d/sensor-izle restart
        fi
    fi
}

# Betik çalışırken /bin/sh, date, cat ve sleep gerekir (BusyBox bunları sağlar)
RDEPENDS:${PN} = "busybox"
