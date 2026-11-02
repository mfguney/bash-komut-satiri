#!/bin/sh
# SPDX-License-Identifier: MIT
# shellcheck disable=SC2016  # denenecek kod parçaları bilerek tek tırnak içindedir
# Bölüm 8: Betiği çalıştıran kabuğun bash'e özgü yapıları destekleyip desteklemediğini sınar.
# Her deneme ayrı bir alt kabukta eval ile çalıştırılır; sözdizimi hatası betiği durdurmaz.
# Kullanım: sh busybox-uyum.sh [-b]   (bash, dash, busybox sh ile de çalıştırılabilir)
#           -b: yalnızca sonuç sütununu yaz (paste ile karşılaştırma için)

yalniz_sonuc=0
[ "${1:-}" = "-b" ] && yalniz_sonuc=1

dene() {
    # $1: açıklama, $2: denenecek kod, $3: beklenen çıktı
    sonuc=$( (eval "$2") 2>/dev/null )
    if [ "$sonuc" = "$3" ]; then d=var; else d=YOK; fi
    if [ "$yalniz_sonuc" -eq 1 ]; then echo "$d"; else printf '%-4s %s\n' "$d" "$1"; fi
}

sekme=$(printf 'a\tb')
dene 'local'                'f() { local x=1; echo $x; }; f'          1
dene '$((...)) aritmetik'   'echo $((7 % 4))'                          3
dene '${x#} ${x%}'          'x=a.b.c; echo ${x#*.}-${x%.*}'            'b.c-a.b'
dene '[[ ]]'                '[[ abc == a* ]] && echo e'                e
dene '== ile [ ]'           '[ a == a ] && echo e'                     e
dene 'dizi'                 'a=(x y); echo ${a[1]}'                    y
dene '${x/a/b}'             'x=aXa; echo ${x/a/b}'                     bXa
dene '${x:1:2}'             'x=abcd; echo ${x:1:2}'                    bc
dene "\$'...' alıntı"       "x=\$'\\x41'; echo \"\$x\""               A
dene 'echo -e'              'echo -e "a\tb"'                           "$sekme"
dene '{1..3}'               'echo {1..3}'                              '1 2 3'
dene '** üs'                'echo $((2 ** 3))'                         8
dene 'function sözcüğü'     'function f { echo f; }; f'                f
dene '<<< here-string'      'cat <<< z'                                z
dene '<(...) süreç ikamesi' 'cat <(echo z)'                            z
dene 'set -o pipefail'      'set -o pipefail; false | true; echo $?'   1
dene 'read -a'              'read -a a <<< "x y"; echo ${a[1]}'        y
