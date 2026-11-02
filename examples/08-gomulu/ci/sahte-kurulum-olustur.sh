#!/bin/sh
# SPDX-License-Identifier: MIT
# Bölüm 8: ci-derle.sh betiğini Yocto kurmadan denemek için sahte bir kurulum dizini oluşturur.
# Sahte 'bitbake' komutu, verilen örnek çıktıyı yazar ve 1 durumuyla çıkar; çıktıdaki
# günlük dosyasını da oluşturur. Gerçek bir derleme YAPMAZ.
# Kullanım: sahte-kurulum-olustur.sh <hedef-dizin> <bitbake-çıktı-örneği>
set -eu
hedef=${1:?hedef dizin}
ornek_cikti=${2:?örnek bitbake çıktısı}
mkdir -p "$hedef/build/sahte-bin"
cp "$ornek_cikti" "$hedef/build/sahte-cikti.txt"
cat > "$hedef/build/init-build-env" <<'ORTAM'
# Sahte ortam betiği: gerçek init-build-env gibi build dizinine geçer ve PATH'i günceller
cd "$(dirname "${BASH_SOURCE[0]:-$0}")" || return 1
export BUILDDIR=$PWD
PATH="$BUILDDIR/sahte-bin:$PATH"
ORTAM
cat > "$hedef/build/sahte-bin/bitbake" <<'BITBAKE'
#!/bin/sh
# Sahte bitbake: örnek çıktıyı yazar, içindeki günlük yolunu oluşturur, 1 ile çıkar
cikti=$BUILDDIR/sahte-cikti.txt
sed -n 's/^    log: //p' "$cikti" | while IFS= read -r f; do
    mkdir -p "$(dirname "$f")"
    printf 'DEBUG: Executing shell function do_compile\n(örnek görev günlüğü)\n' > "$f"
done
cat "$cikti"
exit 1
BITBAKE
chmod 0755 "$hedef/build/sahte-bin/bitbake"
echo "sahte kurulum: $hedef"
