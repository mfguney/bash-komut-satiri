# Linux Komut Satırı ve Bash

**Kabuk, metin işleme araçları ve sağlam Bash betikleri üzerine, gömülü Linux ve Yocto bağlamında
açık kaynak Türkçe kitap.**

Kitap, terminal ve kabuğun işleyişinden başlayarak dosya sistemi ve izinleri, metin işleme araçlarını
(grep, sed, awk, find, xargs), yönlendirme ve süreçleri, Bash betik dilini ve sağlam betik yazma
tekniklerini ele alır; son bölüm BusyBox, init betikleri, BitBake kabuk görevleri ve CI betikleriyle
konuyu Yocto'ya bağlar. Örnekler, ekransız bir endüstriyel sensör ağ geçidi için tanımlanan
**ÖrnekOS** dağıtımı üzerinden ilerler. Gömülü Linux Kitaplığı'nın bir parçasıdır.

- **Çevrimiçi sürüm:** https://mfguney.github.io/bash-komut-satiri/
- **Depo:** https://github.com/mfguney/bash-komut-satiri
- **Etkileşimli öğeler:** 16 animasyonlu şema (boru hattında veri akışı, yönlendirme sırasında fd
  tablosu, genişletme sırası, fork/exec/wait, sed desen alanı, trap EXIT akışı, BitBake `run.do_install`
  …), komutların gerçekten çalıştırılmasıyla kaydedilmiş 30 terminal oturumu ve 40 değerlendirme sorusu
- **Örnekler:** [`examples/`](examples) dizininde 30'u aşkın betik, awk programı, Yocto tarifi, init
  betiği ve systemd birimi; hepsi ShellCheck'ten geçirilip bash, dash ve BusyBox ile denenmiştir
  (ayrıntı: [`examples/README.md`](examples/README.md))

## İçindekiler

| Bölüm | Konu |
|---|---|
| 1 | Kabuk, terminal ve komutların yapısı |
| 2 | Dosya sistemi, izinler ve kullanıcılar |
| 3 | Metin işleme: grep, sed, awk, find, xargs |
| 4 | Yönlendirme, borular, süreçler ve sinyaller |
| 5 | Bash betiklerine giriş: değişkenler, tırnaklar, genişletmeler |
| 6 | Koşullar, döngüler, diziler ve fonksiyonlar |
| 7 | Sağlam betikler: hata yönetimi, trap, getopts, ShellCheck |
| 8 | Gömülü sistemlerde ve Yocto'da kabuk betikleri |
| Ekler | Terimler sözlüğü, komut özeti, kaynakça |

## Yerel önizleme

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
mkdocs serve          # http://127.0.0.1:8000
```

## GitHub Pages'te yayınlama

1. GitHub'da `mfguney/bash-komut-satiri` adlı boş bir depo oluşturun ve bu klasörü `main` dalına gönderin.
2. Depo ayarlarında **Settings → Pages → Source: GitHub Actions** seçeneğini etkinleştirin.
3. `main` dalına yapılan her gönderimde `.github/workflows/yayinla.yml` siteyi derler ve
   https://mfguney.github.io/bash-komut-satiri/ adresinde yayınlar.

## Lisans

- Kitap metni ve görseller: [CC BY-SA 4.0](LICENSE)
- `examples/` altındaki kodlar ve sitedeki JavaScript dosyaları: [MIT](examples/COPYING.MIT)

Linux, Linus Torvalds'ın; Yocto Project, Linux Foundation'ın tescilli markasıdır. Bu kitap bağımsız bir
topluluk çalışmasıdır ve adı geçen projeler tarafından yayımlanmamış veya onaylanmamıştır.
