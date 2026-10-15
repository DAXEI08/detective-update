# Supabase setup — Arabic Detective

Fitur ini membuat nilai siswa tersimpan lintas perangkat dan menyediakan dashboard guru dengan login email/password.

## 1. Buat project Supabase

Buat project di Supabase, lalu buka **SQL Editor** dan jalankan seluruh isi `supabase/schema.sql`.

Skema membuat:

- `students`: identitas siswa (ID lokal, nama, kelas).
- `attempts`: setiap pengerjaan kasus, termasuk nilai, akurasi, benar/salah, hint, XP, bintang, bukti, durasi, waktu, dan detail JSON.
- `teacher_accounts`: allowlist akun Auth yang boleh membaca data siswa.
- RPC `submit_attempt`: endpoint aman yang dipakai siswa untuk mengirim hasil.
- RLS: siswa/anon tidak dapat membaca daftar nilai; hanya akun guru yang terdaftar.

## 2. Buat akun guru

Di Supabase buka **Authentication → Users → Add user**, masukkan email dan password guru.

Salin UUID user tersebut, lalu jalankan di SQL Editor:

```sql
insert into public.teacher_accounts(user_id)
values ('UUID-AKUN-GURU');
```

Untuk guru tambahan, buat Auth user baru dan tambahkan UUID-nya ke tabel yang sama.

## 3. Tambahkan environment variables di Vercel

Dari **Supabase → Project Settings → API**, ambil Project URL dan anon/public key.

Di Vercel buka **Project → Settings → Environment Variables** dan tambahkan:

```text
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Gunakan anon/public key saja. Jangan pernah memasukkan `service_role` key ke variabel `VITE_*` karena nilai Vite tersedia di browser.

Setelah itu lakukan **Redeploy**.

## 4. Alur penggunaan

Siswa:

1. Membuka aplikasi, mengisi nama dan kelas.
2. Menyelesaikan kasus. Hasil **selalu** disimpan di perangkat lebih dulu (sumber utama).
3. Hasil dimasukkan ke antrean lokal, lalu dikirim ke Supabase. Antrean tidak pernah memotong/membuang nilai: sebuah nilai hanya dihapus dari antrean setelah server mengonfirmasi.
4. Jika koneksi buruk: antrean dicoba lagi otomatis saat aplikasi dibuka, saat internet kembali (`online`), saat tab aktif lagi, dan berkala dengan jeda yang makin panjang (maks. 5 menit).
5. Halaman Hasil menampilkan status jujur: *Tersimpan di perangkat*, *Tersinkron ke cloud*, *Menunggu koneksi*, *Gagal sinkron, akan dicoba lagi*.
6. `client_attempt_id` membuat pengiriman idempoten: kirim ulang tidak menggandakan nilai.

Guru:

1. Buka `/teacher` dan login dengan akun yang terdaftar di `teacher_accounts`.
2. Sesi memakai access token + refresh token: token kedaluwarsa diperbarui otomatis; logout hanya jika refresh benar-benar ditolak.
3. Cari/filter (nama, kelas, kasus), lihat kartu (HP) atau tabel (laptop), buka detail (kosakata sulit, tugas yang butuh bantuan), ekspor CSV.
4. Dashboard menampilkan maks. 1000 pengerjaan terbaru; gunakan filter untuk mempersempit.

## Keterbatasan yang disengaja (aplikasi lomba)

- Tidak ada anti-cheat: siapa pun yang membuka aplikasi dapat mengirim hasil. Nilai resmi sekolah sebaiknya tidak bergantung pada sistem ini.
- Nama siswa pada `students` diperbarui oleh kiriman terakhir untuk `client_id` yang sama.
