# Arabic Detective — المُحَقِّقُ اللُّغَوِيُّ

> **Pahami petunjuk. Hubungkan bukti. Pecahkan kasus dengan bahasa Arab.**

Game edukasi bahasa Arab untuk siswa SMK pemula. Pemain menjadi detektif bahasa yang memecahkan 5 kasus bertema pelabuhan (*السَّفَرُ عَبْرَ الْمِينَاءِ*): membaca petunjuk Arab, mengamati adegan, mengumpulkan bukti, memakai relasi tempat (أَمَامَ، خَلْفَ، بِجَانِبِ، بَيْنَ، فِي، قُرْبَ), lalu menarik kesimpulan.

Proyek ini dibuat sebagai **produk edukasi untuk lomba/demo**, bukan sistem penilaian resmi sekolah.

## Mengapa layak untuk kelas dan juri

- **Berjalan tanpa internet.** Seluruh gameplay, Dalil, dan font (self-host) bekerja offline setelah halaman dimuat. Cloud hanya tambahan untuk analytics dan dashboard guru.
- **Dalil bukan AI.** Dalil adalah *sistem scaffolding berbasis petunjuk bertingkat yang dirancang sebelumnya dan berjalan sepenuhnya offline.* Tidak ada model, API key, atau server. Jawabannya konsisten (input sama → keluaran sama), tidak acak, dan dikontrol secara pedagogis.
- **Tidak membocorkan jawaban akhir.** Tiga tingkat: (1) petunjuk umum, (2) petunjuk spesifik ke kata/kalimat, (3) bantuan bahasa (arti kata/pola). `npm run verify` menolak hint yang menuliskan urutan jawaban.
- **Feedback belajar konsisten.** Kesalahan menjelaskan *kata Arab mana* yang keliru, bukan sekadar "salah".
- **Hasil tidak mudah hilang.** Nilai disimpan lokal dulu; antrean cloud tidak pernah membuang nilai diam-diam.

## Pedagogi: tiap mekanik punya tujuan belajar

| Mekanik | Melatih |
|---|---|
| Hotspot (Case 1) | pengenalan kosakata dari perintah Arab |
| Pilih gambar & Penempatan (Case 2) | relasi tempat / ظرف المكان → posisi nyata di peta |
| Saksi & penempatan tokoh (Case 3) | pemahaman bacaan: pola رَأَيْتُ + tokoh + tempat |
| Papan Bukti & Eliminasi (Case 4) | menghubungkan informasi; inferensi dari kalimat penyangkal لَيْسَ / لَيْسَتْ |
| Inspeksi, kronologi, laporan akhir (Case 5) | integrasi seluruh kemampuan |
| Dalil | scaffolding bertingkat saat siswa kesulitan |

Progresi: **Case 1** mengenal mekanik → **Case 2** posisi/spasial → **Case 3** menghubungkan tokoh dan saksi → **Case 4** analisis bukti → **Case 5** integrasi + laporan akhir.

## Fitur

- 5 kasus berjenjang, 10 tipe tugas, semuanya punya alternatif tap/keyboard untuk drag-and-drop.
- XP, bintang, peringkat, 4 pencapaian. Halaman Hasil memberi **rekomendasi belajar deterministik** (mis. "Perlu latihan lagi: بِجَانِبِ dan خَلْفَ.") dan daftar kosakata dikuasai.
- **Mode Presentasi** (Pengaturan): membuka semua kasus untuk demo tanpa mengubah progres utama.
- **Dashboard Guru** (`/teacher`, butuh Supabase): kartu di HP / tabel di laptop, filter nama-kelas-kasus, detail kosakata sulit, ekspor CSV.
- Sinkronisasi cloud yang jujur: status per hasil, antrean persisten, auto-flush saat aplikasi dibuka dan saat internet kembali.
- Responsif ≥ 360px, ARIA, fokus terlihat, target sentuh ≥ 44px, `prefers-reduced-motion`.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build → dist/
npm test           # Vitest
npm run verify     # verifikasi konten
```

`npm run verify` memeriksa: ID ganda, urutan kasus, referensi clue/evidence/kosakata yang tidak ada, placement yang tidak mungkin diselesaikan, tugas tanpa 3 tingkat hint, hint yang membocorkan urutan, bukti yang dipakai sebelum dikumpulkan (dead end), clue yang tidak pernah dipakai, dan kata Arab yang tidak ada di leksikon Dalil.

## Deploy (Vercel, SPA statis)

Tidak ada serverless function. `vercel.json` hanya me-rewrite route SPA ke `index.html` (refresh `/case/case-2` aman) dan men-cache `/assets`.

Environment variables (opsional, hanya untuk cloud):

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_PUBLIC_KEY
```

Gunakan anon key saja. **Jangan pernah** memasukkan `service_role` key ke variabel `VITE_*`. Panduan database dan akun guru: [`supabase/README.md`](supabase/README.md). Tanpa variabel ini game tetap berjalan penuh; hanya dashboard guru yang nonaktif.

## Arsitektur

```
src/
  app/            router, guards, ErrorBoundary
  components/     common/ · game/ (+ tasks/) · evidence/ · dalil/DalilPanel
  data/           vocabulary, lexicon (glossing Arab), achievements, cases/case1..5
  engine/         spatial, scoring, analytics, recommendation, teacherView, verifyContent
  services/
    dalil/        types · provider (deterministik) · index (askDalil, tangga hint)
    cloud/        supabase (antrean, auto-sync, refresh token guru)
    persistence/  storage (localStorage + fallback memori) · schema (sanitizer)
  stores/         playerStore (persisten) · gameStore (sesi kasus) · uiStore · syncStore
  pages/          Landing, Setup, Tutorial, CaseSelect, CasePage, Results, Achievements, Teacher, Settings
```

Stack: React, TypeScript, Vite, Zustand, Tailwind, Framer Motion, Supabase REST, Vitest.

### Dalil: aturan tangga petunjuk

- Aksi: petunjuk, jelaskan kalimat, jelaskan kata, kenapa salah, bantu analisis bukti. Semuanya fungsi murni di `services/dalil/provider.ts`.
- Level hint naik 1→2→3 hanya lewat tombol "Beri petunjuk". Setelah 3 kesalahan, tangga mulai dari level 2. Setelah level 3, permintaan berikutnya mengulang level 3 (gratis).
- Petunjuk baru dan penjelasan kata/kalimat sedikit mengurangi bintang; "kenapa salah" dan analisis bukti gratis.
- `DalilContext` sengaja tidak memuat kunci jawaban.

### Penyimpanan & pemulihan

`localStorage` (`arabic-detective:v1:*`) dengan fallback memori. Data dibaca lewat sanitizer: JSON korup diperbaiki/dibuang, tidak pernah membuat aplikasi mati. Sesi kasus yang berjalan dipulihkan saat reload. Render error ditangkap `ErrorBoundary` (layar pemulihan, bukan halaman kosong).

### Sinkronisasi cloud

Hasil lokal = sumber utama; cloud = backup. Alur: simpan lokal → masukkan antrean persisten → kirim via RPC `submit_attempt` (idempoten lewat `clientAttemptId`). Gagal → tetap di antrean; dicoba lagi saat startup, `online`, tab aktif, dan backoff berkala. Penolakan permanen server (4xx validasi) ditandai "gagal" dan bisa dicoba manual, tidak diulang tanpa henti.

## Skema skor

Tiap tugas benar +100 XP (+30 bila tanpa petunjuk); selesai kasus +150; +50 per bintang. Akurasi = tugas benar / (benar + salah). ⭐⭐⭐ bila akurasi ≥ 85% dan petunjuk ≤ 3; ⭐⭐ bila ≥ 60%; selain itu ⭐. XP total = XP terbaik per kasus (replay tidak menurunkan skor terbaik dan tidak bisa digrinding). Peringkat: 0 / 1.500 / 3.500 XP.

## Keterbatasan yang diketahui

- Tidak ada service worker: halaman harus dimuat sekali dengan internet; setelah itu gameplay tidak membutuhkan internet. Karena tidak ada service worker, memuat ulang halaman saat benar-benar offline tidak didukung.
- Tidak ada anti-cheat (sengaja, aplikasi lomba).
- Teks Arab sebaiknya ditinjau guru bahasa Arab sebelum dipakai di kelas.
