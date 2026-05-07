# 🌟 Wedora — Premium Workspace & SaaS for Wedding Organizers

**Wedora** adalah platform *workspace* premium dan SaaS (*Software-as-a-Service*) yang dirancang khusus untuk membantu **Wedding Organizer (WO)** mengelola seluruh persiapan pernikahan calon pengantin secara anggun, terstruktur, dan presisi. 

Selamat tinggal tumpukan berkas fisik dan lembar kerja (*spreadsheet*) yang membingungkan. Wedora menghadirkan ruang kerja modern untuk mengoordinasikan tim lapangan, melacak anggaran, mengorganisir dokumen, menyusun rundown hari-H, dan mempercepat penagihan klien dalam satu sistem terintegrasi yang sangat mewah.

---

## 🎨 Estetika Desain & Tema Premium
Wedora dirancang dengan pendekatan visual kelas atas untuk memberikan impresi premium bagi agensi WO maupun klien pengantin:
*   **Harmoni Palet Warna**: Kombinasi elegan krem lembut (`#FAF7F2` - latar belakang), hitam arang solid (`#1E1E1E` - teks & tombol utama), emas hangat (`#D4AF37` - aksen ikon & brand), dan rose muda (`#EFD6D2` - pill & badge aktif).
*   **Tipografi Modern**: Menggunakan font sans-serif geometris yang bersih dipadukan dengan aksen serif klasik untuk menghadirkan kesan mewah bin kontemporer.
*   **Interaktivitas Hidup**: Animasi transisi halus menggunakan `framer-motion` dan efek *hover* dinamis yang membuat antarmuka terasa hidup dan responsif.

---

## 🚀 Fitur Unggulan

### 1. 📊 Dasbor Kolaboratif (`/dashboard`)
*   **Metrik Ringkasan Real-Time**: Lacak total omset pendapatan, jumlah proyek aktif, penagihan pending, serta tugas tim hari ini secara instan.
*   **WhatsApp Billing Nudge (Fitur Pintar)**: Sistem mendeteksi otomatis tagihan pelunasan yang mendekati jatuh tempo. Staf WO cukup menekan tombol untuk langsung membuka WhatsApp dengan draf pesan penagihan yang ramah, profesional, lengkap dengan rincian nominal dan link portal pengantin.
*   **Aliran Aktivitas Tim**: Log riwayat aktivitas tim lapangan secara *real-time* untuk memudahkan pemilik WO mengontrol kinerja staf.

### 2. 📂 Manajemen Proyek Pernikahan (`/projects`)
*   **Penyaringan Status Persiapan**: Kelompokkan proyek pernikahan berdasarkan fase perkembangannya (*Inquiry, Perencanaan, DP Paid, Berlangsung, Selesai*).
*   **Bar Pencarian Cepat**: Cari data klien berdasarkan nama calon pengantin atau nama gedung/venue dalam sekejap.
*   **Visualizer Anggaran (Progress Bar)**: Indikator bar kemajuan visual yang membandingkan dana yang terpakai dengan total anggaran kontrak (*budget used* vs *budget total*).

### 3. 🎯 Checklist & Manajemen Tugas (`/tasks`)
*   **Toggle Penyelesaian Instan**: Coret tugas operasional secara langsung dengan klik tombol centang interaktif (didukung pembaruan status dinamis).
*   **Prioritas Berwarna (Visual Cues)**: Penanda tugas kritis dengan badge prioritas (`High`, `Medium`, `Low`) berwarna kontras.
*   **Penugasan PIC & Batas Waktu**: Transparansi pembagian tugas untuk setiap koordinator lapangan.

### 4. 📅 Kalender & Rundown Hari-H (`/calendar`)
*   **Timeline Vertikal Presisi**: Susunan jadwal acara (Rundown) menit-demi-menit yang intuitif untuk hari pernikahan.
*   **Pembagian Penanggung Jawab**: Pembagian PIC dan penentuan lokasi spesifik di setiap sesi acara (misal: Akad, Resepsi, Makeup) untuk menghindari miskomunikasi.

### 5. 🗂️ Dokumen & Moodboard (`/documents`)
*   **Kategorisasi Berkas**: Folder pintar untuk memisahkan Kontrak Kerja (PDF), Inspirasi Moodboard (Gambar/Foto), dan Rincian Konsumsi (Excel).
*   **Aksi Cepat Unduh**: Buka atau unduh dokumen penting secara instan langsung dari masing-masing kartu dokumen.

### 6. ⚙️ Pengaturan & Kontrol Akses (`/settings`)
*   **Profil Pengguna**: Manajemen informasi pribadi staf pengguna aktif.
*   **Informasi WO & Langganan**: Akses info paket langganan aktif (*Plan Starter, Professional, atau Agency*).
*   **Anggota Tim**: Kontrol hak akses anggota tim WO (Pemilik, Admin, Koordinator Lapangan).

### 7. ⚡ Global Command Palette (`Ctrl + K` / `Cmd + K`)
*   Cari apa pun di dalam sistem dalam satu dialog pintas super cepat.
*   Ketik navigasi halaman (*Dashboard, Projects, Tasks, Budget*), luncurkan aksi cepat (*Tambah Tugas*, *Proyek Baru*), atau temukan nama klien pernikahan secara langsung.
*   Mendukung navigasi penuh menggunakan keyboard (`Panah Atas/Bawah`, `Enter` untuk memilih, `Esc` untuk menutup) dengan animasi overlay mewah.

---

## 🛠️ Teknologi yang Digunakan
*   **Framework**: Next.js 15 (App Router) & React 19
*   **Bahasa Pemrograman**: TypeScript
*   **Styling**: Tailwind CSS
*   **Ikonografi**: Lucide React
*   **Animasi**: Framer Motion
*   **Backend & Database**: Supabase (Siap diintegrasikan)
*   **Utility & Helpers**: Tailwind Merge, Clsx

---

## 📂 Struktur Folder Proyek
```text
wedora/
├── public/               # Asset statis, gambar, dan logo
├── src/
│   ├── app/              # Next.js App Router (Routing halaman)
│   │   ├── (app)/        # Rute terproteksi aplikasi (dashboard, budget, projects, dll)
│   │   ├── (auth)/       # Rute autentikasi (login, register, onboarding)
│   │   ├── globals.css   # Konfigurasi CSS & variabel tema utama
│   │   └── layout.tsx    # Root layout aplikasi
│   ├── components/       # Komponen UI Reusable
│   │   ├── layout/       # AppLayout, Sidebar, TopBar, Command Palette, MobileNav
│   │   └── projects/     # Komponen spesifik modul proyek pernikahan
│   ├── lib/              # Fungsi pembantu (utils.ts, mock-data.ts, supabase.ts)
│   └── types/            # Definisi tipe data TypeScript (index.ts)
├── tailwind.config.ts    # Kustomisasi tema & palet warna premium
└── tsconfig.json         # Konfigurasi TypeScript compiler
```

---

## 🚦 Memulai Pengembangan Lokal

### 1. Prasyarat
Pastikan komputer Anda sudah terpasang **Node.js** (versi v18.x atau lebih baru).

### 2. Kloning Proyek & Install Dependensi
Masuk ke direktori proyek dan jalankan perintah instalasi paket:
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin file `.env.example` menjadi `.env.local` dan lengkapi kredensial database Supabase Anda:
```bash
cp .env.example .env.local
```

### 4. Jalankan Server Pengembangan
Mulai server lokal Next.js:
```bash
npm run dev
```
Buka browser Anda dan akses halaman [http://localhost:3000](http://localhost:3000).

---

## 📝 Catatan Kontribusi & Alur Kerja Pengembang
*   **Konsistensi Desain**: Saat menambahkan komponen baru, pastikan menggunakan token warna premium yang didefinisikan dalam `tailwind.config.ts` untuk menjaga konsistensi gaya visual *modern luxury*.
*   **Penyuntingan File**: Gunakan pintasan `Ctrl + K` secara rutin untuk menguji alur perpindahan navigasi halaman demi memastikan fungsionalitas pencarian global berjalan sempurna.

---

<p align="center">
  Dibuat dengan penuh ❤️ untuk menyukseskan hari paling bahagia klien Anda. <br />
  <b>Wedora — Elegance in Wedding Planning.</b>
</p>
