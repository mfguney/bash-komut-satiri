#!/bin/bash
# SPDX-License-Identifier: MIT
# shellcheck disable=SC2016  # kod parçaları bilerek tek tırnakla bash -c'ye verilir
# Bölüm 7: set -e'nin beklenmedik biçimde ÇALIŞMADIĞI durumları gösterir.
# Her örnek ayrı bir alt kabukta çalıştırılır; böylece betik sonuna kadar ilerler.
# Kullanım: ./set-e-tuzaklari.sh

ornek() {
    printf '\n== %s\n' "$1"
    bash -c "set -e; $2; echo '  -> betik devam etti'" 2>&1 | sed 's/^/  /'
    echo "  (durum: ${PIPESTATUS[0]})"
}

ornek "1. Basit hata: betik durur" \
      'false'
ornek "2. Koşul içindeki komut: set -e uygulanmaz" \
      'if false; then :; fi'
ornek "3. && listesinin son öğesi dışındakiler muaftır" \
      'false && echo hiç yazılmaz'
ornek "4. Koşulda çağrılan fonksiyonun İÇİ de muaftır" \
      'f() { false; echo "  f: false sonrası çalıştı"; }; if f; then :; fi'
ornek "5. local, komut ikamesinin durumunu maskeler" \
      'f() { local x=$(false); echo "  f: local sonrası"; }; f'
ornek "6. Ayrı bildirim ve atama: hata yakalanır" \
      'f() { local x; x=$(false); echo "  hiç yazılmaz"; }; f'
ornek "7. Boru hattı: yalnızca son komutun durumu sayılır" \
      'false | true'
ornek "8. pipefail ile boru hattındaki hata yakalanır" \
      'set -o pipefail; false | true'
ornek "9. (( )) sonucu 0 olunca durum 1 olur: sayaç artırımı betiği durdurur" \
      'n=0; (( n++ )); echo "  n=$n"'
