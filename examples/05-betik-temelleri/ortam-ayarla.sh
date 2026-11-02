# shellcheck shell=bash
# SPDX-License-Identifier: MIT
# Bölüm 5: Kaynaklanmak (source) üzere yazılmış bir ortam betiği; oe-init-build-env
# ile aynı ilkeye dayanır. Çalıştırılırsa (./ortam-ayarla.sh) değişiklikler çağıran
# kabuğa yansımaz, çünkü ayrı bir süreçte yapılır.
# Kullanım: . ./ortam-ayarla.sh [derleme-dizini]
BUILDDIR=$(realpath -m "${1:-derleme}")
export BUILDDIR
mkdir -p "$BUILDDIR/conf"
case ":$PATH:" in
    *":$BUILDDIR/araclar:"*) ;;
    *) PATH="$BUILDDIR/araclar:$PATH" ;;
esac
cd "$BUILDDIR" || return 1
echo "Derleme dizini: $BUILDDIR"
