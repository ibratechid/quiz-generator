# Quiz Shorts Renderer (GitHub Actions)

Render video kuis YouTube Shorts **1080×1920, H.264 MP4 + AAC** dari file JSON. Suara dibuat di server dengan
[edge-tts](https://github.com/rany2/edge-tts) (default pria Indonesia `id-ID-ArdiNeural`), durasinya diukur dari
audio asli, lalu video dan audio disusun dari jadwal yang sama, jadi timing presisi.

## Struktur
```
.github/workflows/render.yml   # workflow (YAML)
assets/                        # musik latar (opsional): assets/music.mp3
configs/                       # file JSON kuis (satu file boleh berisi banyak kuis)
js/                            # render.js, timeline.js, tts.js, mix.js, seo.js, scene.js/html
```

## Cara pakai
1. Buat kuis di web app → tombol **{ } Simpan config JSON** → taruh di `configs/`.
2. Push ke GitHub. Workflow jalan otomatis, atau manual: **Actions → Render Quiz Shorts → Run workflow**
   (pilih file config / `all`, filter `only` id, dan opsi `release`).
3. Hasil di **Artifacts** (atau Release): `*.mp4`, `*.seo.txt/.json` (judul, deskripsi, tags), `*.timeline.json`.

## Format config
Satu file bisa berupa objek, array, atau `{ "defaults": {...}, "quizzes": [...] }` (lihat `configs/sains.json`).

| Field | Keterangan | Default |
|---|---|---|
| `id` | nama file output | `<file>-<urutan>` |
| `question`, `options{A,B,C}`, `answer`, `reason` | isi kuis (wajib) | — |
| `duration` | 15–60 detik | 30 |
| `topic`, `channel`, `cta` | teks tampilan & SEO | — |
| `voice`, `pitch` | suara edge-tts (`edge-tts --list-voices`) | `id-ID-ArdiNeural`, `-3Hz` |
| `music`, `musicVolume` | musik latar, otomatis mengecil saat narator bicara | kosong, 0.12 |
| `fps`, `width`, `height` | kualitas (720×1280 lebih cepat) | 30, 1080, 1920 |

## Jalankan lokal
```bash
sudo apt install ffmpeg fonts-comic-neue fonts-noto-color-emoji
pip install edge-tts && npm install
CHROME_PATH=/usr/bin/google-chrome node js/render.js configs/sains.json
# uji tanpa internet/Chrome:  MOCK_TTS=1 node js/render.js configs/sains.json --no-frames
```

## Catatan
- Jika teks terlalu panjang untuk durasi (butuh kecepatan >×1,8), video diperpanjang otomatis dan ada peringatan di log. Lebih dari 60 detik akan gagal.
- Audio TTS di-cache (`.cache/tts`), jadi render ulang jauh lebih cepat.
- Render 30 detik @1080p sekitar 2–4 menit per video di runner GitHub.
