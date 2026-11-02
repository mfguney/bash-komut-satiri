# shellcheck shell=bash
# SPDX-License-Identifier: MIT
# ~/.bashrc dosyasının sonuna eklenebilecek örnek ayarlar (Bölüm 1).
# Yalnızca etkileşimli kabuklarda etkilidir; betiklerde kullanılmamalıdır.

# Geçmiş: tekrar eden ve boşlukla başlayan komutları kaydetme, daha fazla satır tut
HISTCONTROL=ignoreboth
HISTSIZE=10000
HISTFILESIZE=20000
HISTTIMEFORMAT='%F %T  '
shopt -s histappend        # oturum kapanırken geçmiş dosyasının üzerine yazma, ekle

# Kişisel komut dizini PATH başına eklenir (yalnızca yoksa)
case ":$PATH:" in
    *":$HOME/bin:"*) ;;
    *) PATH="$HOME/bin:$PATH" ;;
esac

# Takma adlar: yalnızca etkileşimli kullanım için kısaltmalar
alias ll='ls -l'
alias la='ls -A'
alias grep='grep --color=auto'

# Bir BitBake görev günlüğünü hızlıca açan fonksiyon (Bölüm 8)
# Kullanım: gunluk <tarif> <görev>, örnek: gunluk sensor-oku compile
gunluk() {
    local wd
    wd=$(bitbake-getvar -r "$1" --value WORKDIR) || return
    less "$wd/temp/log.do_$2"
}
