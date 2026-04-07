Cara penggunaan Questions App

## 1. Admin — Membuat Course

1. Login sebagai admin
2. Buka menu **Courses** di sidebar
3. Klik tombol **New Course**
4. Isi form:
   - **Title** — nama course (wajib)
   - **Description** — deskripsi singkat (opsional)
   - **Duration** — batas waktu pengerjaan dalam menit, kosongkan jika tidak ada batas waktu
   - **Question Limit** — jumlah soal yang ditampilkan per attempt, kosongkan untuk tampilkan semua soal
5. Klik **Save**

> Course baru otomatis berstatus **Draft** dan belum bisa dikerjakan user.

---

## 2. Admin — Menambahkan Soal

1. Buka course yang baru dibuat
2. Di tab **Questions**, klik **Add Question**
3. Pilih tipe soal:
   - **Multiple Choice** — isi minimal 2 pilihan jawaban, pilih jawaban yang benar
   - **True / False** — pilih jawaban yang benar (True atau False)
   - **Essay** — tidak ada jawaban benar, dinilai manual
4. Isi kolom lainnya:
   - **Points** — bobot nilai soal
   - **Explanation** — penjelasan yang ditampilkan ke user setelah selesai (opsional)
5. Klik **Save Question**
6. Ulangi untuk soal berikutnya

### Mengatur Required vs Random Pool

Setiap soal bisa diset sebagai:
- **Required** — selalu muncul di setiap attempt
- **In Pool** — masuk ke pool random, dipilih acak untuk memenuhi sisa slot

Klik tombol **Set required** atau **Set random** di samping setiap soal untuk mengubahnya.

> Jika Question Limit diset ke 10 dan ada 3 soal Required, maka 7 soal sisanya dipilih acak dari pool.

---

## 3. Admin — Mempublish Course

1. Pastikan course sudah memiliki minimal **1 soal**
2. Pastikan **Question Limit** tidak melebihi jumlah soal yang ada
3. Di halaman detail course, aktifkan toggle **Published** di pojok kanan atas
4. Status course berubah dari **Draft** menjadi **Published**

> Course yang masih Draft tidak bisa dikerjakan oleh user meskipun sudah di-assign.

---

## 4. Admin — Assign User ke Course

1. Buka course yang sudah dipublish
2. Buka tab **Participants**
3. Klik tombol **Assign Participant**
4. Cari user berdasarkan nama atau email di kolom pencarian
5. Klik nama user untuk langsung assign
6. User yang sudah di-assign akan muncul di daftar peserta beserta tanggal enrollment

Untuk melepas user dari course, klik tombol **×** di samping nama user.

---

## 5. User — Mengerjakan Exam

### Memulai Exam

1. Login sebagai user
2. Di **Dashboard** atau menu **My Courses**, cari course yang ingin dikerjakan
3. Klik **View** untuk membuka halaman detail course
4. Periksa informasi exam:
   - Jumlah soal yang akan ditampilkan
   - Batas waktu pengerjaan
   - Keterangan bahwa exam hanya bisa dikerjakan **1 kali**
5. Klik **Start Exam** jika sudah siap

> Setelah klik Start Exam, timer langsung berjalan dan soal sudah dikunci. Pastikan koneksi internet stabil sebelum memulai.

### Mengerjakan Soal

- Gunakan **navigator nomor soal** di atas untuk berpindah antar soal
- Nomor soal berwarna **hijau** = sudah dijawab
- Nomor soal berwarna **abu** = belum dijawab
- Jawaban tersimpan otomatis setiap kali memilih opsi
- Untuk soal essay, jawaban tersimpan otomatis setelah berhenti mengetik

### Timer

- Timer ditampilkan di pojok kanan atas
- Timer berubah **merah dan berkedip** saat sisa waktu kurang dari 5 menit
- Jika waktu habis, exam **otomatis disubmit** dengan jawaban yang sudah diisi

### Submit Exam

1. Setelah menjawab semua soal, klik **Submit Exam**
2. Dialog konfirmasi akan muncul — menampilkan jumlah soal yang sudah dan belum dijawab
3. Klik **Yes, Submit** untuk mengumpulkan jawaban

> Exam yang sudah disubmit tidak bisa diulang atau diubah jawabannya.

---

## 6. User — Melihat Hasil

Setelah submit, user langsung diarahkan ke halaman hasil yang menampilkan:

- **Skor** dalam persentase
- **Poin** yang didapat dari total poin maksimal
- **Durasi** pengerjaan
- **Status** Passed (≥ 70%) atau Failed (< 70%)
- **Review jawaban** per soal:
  - Jawaban benar ditandai hijau
  - Jawaban salah user dicoret merah
  - Penjelasan ditampilkan di bawah tiap soal jika tersedia

Untuk mengakses kembali hasil exam, buka **My Courses** → pilih course → klik **View Result**.

---

## 7. Admin — Melihat Hasil Exam

1. Buka course di menu **Courses**
2. Buka tab **Results**
3. Lihat daftar semua user yang sudah mengumpulkan beserta skor dan status Pass/Fail
4. Klik tombol **›** di samping nama user untuk melihat detail jawaban per soal

Ringkasan statistik ditampilkan di atas daftar:
- Jumlah yang sudah submit
- Jumlah yang belum submit
- Jumlah yang passed dan failed
