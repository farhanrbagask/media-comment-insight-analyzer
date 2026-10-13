# 📊 Media Comment Insight Analyzer

> Aplikasi web yang mengambil komentar dari postingan Instagram/TikTok, lalu menganalisisnya secara otomatis menggunakan AI — mulai dari sentimen, topik, hingga kata kunci yang sering muncul.

---

## 🧠 Apa yang Dilakukan Aplikasi Ini?

Bayangkan kamu memiliki sebuah postingan media sosial dengan ratusan komentar. Membacanya satu per satu tentu melelahkan. Aplikasi ini hadir untuk membantu:

1. **Mengambil komentar** dari URL postingan Instagram atau TikTok secara otomatis.
2. **Menganalisis sentimen** — apakah komentar tersebut positif, negatif, atau netral?
3. **Mengelompokkan topik** — apa saja hal yang paling banyak dibicarakan?
4. **Mengekstrak kata kunci** — kata apa yang paling sering muncul?
5. **Menampilkan hasil** dalam bentuk grafik dan visualisasi yang mudah dipahami.

---

## 🏗️ Arsitektur Sistem

Aplikasi ini terdiri dari **4 komponen utama** yang berjalan secara bersamaan:

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│              React Frontend  (port 5173)                    │
│         Tampilan UI, form input URL, grafik hasil           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Request (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                │
│           Node.js + Express  (port 3001)                    │
│    Menerima request, cek login, simpan ke database,         │
│          teruskan ke ML Service                             │
└───────────┬─────────────────────────┬───────────────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────┐   ┌───────────────────────────────────┐
│     DATABASE        │   │          ML SERVICE               │
│    PostgreSQL       │   │    Python + FastAPI  (port 8000)   │
│  Menyimpan semua    │   │  Menjalankan model AI untuk        │
│  data hasil analisis│   │  sentimen, topik, & kata kunci     │
└─────────────────────┘   └───────────────────────────────────┘
```

| Komponen | Teknologi | Port |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | `5173` |
| Backend | Node.js + Express.js | `3001` |
| ML Service | Python + FastAPI + Uvicorn | `8000` |
| Database | PostgreSQL | `5432` |

---

## ✅ Prasyarat (Yang Harus Disiapkan Dulu)

Sebelum mulai, pastikan kamu sudah menginstall semua ini di komputer:

| Tools | Versi Minimum | Cara Cek |
|---|---|---|
| **Node.js** | 18+ | `node --version` |
| **npm** | 8+ | `npm --version` |
| **Python** | 3.10+ | `python --version` |
| **PostgreSQL** | 14+ | `psql --version` |
| **Git** | terbaru | `git --version` |

> 💡 **Belum punya?** Download di: [Node.js](https://nodejs.org) · [Python](https://python.org) · [PostgreSQL](https://postgresql.org)

---

## 🚀 Panduan Setup Lengkap (Step-by-Step)

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/username/media-comment-insight-analyzer.git
cd media-comment-insight-analyzer
```

Setelah ini, struktur folder kamu akan terlihat seperti ini:

```
media-comment-insight-analyzer/
├── frontend/        ← Kode tampilan (React)
├── backend/         ← Kode server (Node.js + Express)
├── ml-service/      ← Kode AI/analisis (Python + FastAPI)
└── database/        ← File SQL untuk membuat tabel
```

---

### Langkah 2 — Buat Database PostgreSQL

> **Apa itu database?** Tempat penyimpanan permanen untuk semua data aplikasi (hasil analisis, postingan, dll).

**Buka terminal** dan jalankan perintah berikut:

```bash
# Masuk ke PostgreSQL sebagai user postgres
psql -U postgres

# Di dalam psql, buat database baru
CREATE DATABASE insight_analyzer;

# Keluar dari psql
\q
```

Verifikasi database sudah terbuat:

```bash
psql -U postgres -l
# Pastikan "insight_analyzer" ada di daftar
```

---

### Langkah 3 — Setup Backend (Node.js + Express)

Backend adalah "otak" server — menerima request dari frontend, memvalidasi data, dan menghubungkan semua komponen.

#### 3a. Install dependensi backend

```bash
cd backend
npm install
```

#### 3b. Buat file konfigurasi `.env`

File `.env` berisi informasi rahasia (password, secret key) yang **tidak boleh** diupload ke GitHub.

```bash
# Salin file contoh
cp .env.example .env
```

Kemudian **buka file `.env`** dan sesuaikan isinya:

```env
# ─── Server ──────────────────────────────────────────────
PORT=3001
FRONTEND_URL=http://localhost:5173

# ─── Database ────────────────────────────────────────────
# Ganti "yourpassword" dengan password PostgreSQL kamu
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/insight_analyzer
DATABASE_SSL=false

# ─── Auth ────────────────────────────────────────────────
# Ganti dengan string acak yang panjang (min 32 karakter)
JWT_SECRET=ganti_dengan_string_rahasia_yang_sangat_panjang_min32
# Ini adalah password untuk login ke aplikasi
ADMIN_PASSWORD=passwordAdminKamu

# ─── ML Service ──────────────────────────────────────────
ML_SERVICE_URL=http://localhost:8000

# ─── Mode Development (tanpa API asli) ───────────────────
USE_MOCK_SERVICE=true   # ← Biarkan "true" dulu saat belajar

# ─── Instagram & TikTok API (opsional dulu) ──────────────
IG_ACCESS_TOKEN=
IG_USER_ID=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```

> ⚠️ **Penting:** Jangan pernah mengisi `IG_ACCESS_TOKEN` dsb. jika kamu belum punya token resmi. Biarkan kosong dan gunakan `USE_MOCK_SERVICE=true`.

#### 3c. Jalankan migrasi database

Migrasi = membuat tabel-tabel yang dibutuhkan di dalam database.

```bash
# Masih di folder backend/
npm run migrate
```

Jika berhasil, output-nya akan menampilkan:
```
✓ Migration 001_create_posts.sql applied
✓ Migration 002_create_analyses.sql applied
✓ Migration 003_create_comments.sql applied
✓ Migration 004_create_keywords.sql applied
✓ Migration 005_create_topics.sql applied
All migrations applied successfully.
```

Tabel yang dibuat:
- `posts` — menyimpan URL postingan yang dianalisis
- `analyses` — menyimpan hasil analisis (sentimen, topik, dll)
- `comments` — menyimpan komentar yang diambil
- `keywords` — menyimpan kata kunci yang ditemukan
- `topics` — menyimpan hasil pengelompokan topik

#### 3d. Jalankan server backend

```bash
npm run dev
```

✅ Backend berjalan di **http://localhost:3001**

---

### Langkah 4 — Setup ML Service (Python + FastAPI)

ML Service adalah komponen yang menjalankan model AI untuk menganalisis teks komentar.

#### 4a. Buat Virtual Environment Python

> **Apa itu virtual environment?** Ruang terisolasi agar instalasi library Python untuk proyek ini tidak bentrok dengan proyek lain.

```bash
# Pindah ke folder ml-service
cd ../ml-service

# Buat virtual environment
python -m venv venv
```

#### 4b. Aktifkan virtual environment

```bash
# Windows (Command Prompt / PowerShell)
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

Setelah aktif, kamu akan melihat `(venv)` di awal baris terminal.

#### 4c. Install dependensi Python

```bash
pip install -r requirements.txt
```

> ⏳ Proses ini bisa memakan waktu 5–15 menit tergantung kecepatan internet karena ada banyak library AI yang diinstall.

#### 4d. Jalankan ML Service

```bash
uvicorn app.main:app --reload --port 8000
```

> ⚠️ **Peringatan:** Saat pertama kali dijalankan, ML Service akan **mendownload model NLP (~500 MB)**. Pastikan koneksi internet stabil dan tunggu hingga selesai sebelum mencoba analisis.

✅ ML Service berjalan di **http://localhost:8000**

Cek apakah ML Service berjalan dengan membuka: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Langkah 5 — Setup Frontend (React + Vite)

Frontend adalah tampilan yang dilihat pengguna di browser.

```bash
# Pindah ke folder frontend
cd ../frontend

# Install dependensi
npm install

# Jalankan development server
npm run dev
```

✅ Frontend berjalan di **http://localhost:5173**

---

### Langkah 6 — Akses Aplikasi

Buka browser dan akses: **http://localhost:5173**

1. Akan muncul halaman **Login** — masukkan password yang kamu set di `ADMIN_PASSWORD`
2. Setelah login, kamu bisa memasukkan URL postingan Instagram/TikTok
3. Klik **Analisis** dan tunggu hasilnya

> 💡 Saat `USE_MOCK_SERVICE=true`, data yang ditampilkan adalah data tiruan (simulasi), bukan data nyata dari Instagram/TikTok. Ini berguna untuk belajar dan testing tanpa perlu token API.

---

## 🔄 Alur Kerja Sistem (Bagaimana Data Mengalir)

Berikut perjalanan data dari input URL hingga muncul di layar:

```
1. [User] Memasukkan URL postingan di form
         ↓
2. [Frontend] Mengirim request: POST /api/posts/analyze
         ↓
3. [Backend] Memeriksa token login (JWT)
         ↓
4. [Backend] Menyimpan URL ke tabel `posts`
         ↓
5. [Backend → ML Service] Mengirim request analisis
         ↓
6. [ML Service] Mengambil komentar (real/mock)
         ↓
7. [ML Service] Menjalankan 3 model AI:
   ├── IndoBERT  → Analisis Sentimen (positif/negatif/netral)
   ├── BERTopic  → Pengelompokan Topik
   └── TF-IDF    → Ekstraksi Kata Kunci
         ↓
8. [ML Service → Backend] Mengembalikan hasil JSON
         ↓
9. [Backend] Menyimpan hasil ke tabel `analyses`
         ↓
10. [Backend → Frontend] Mengirim response JSON
         ↓
11. [Frontend] Menampilkan grafik & visualisasi hasil
```

---

## 🛠️ Menjalankan Semua Service Sekaligus

Kamu perlu membuka **3 terminal** secara bersamaan:

| Terminal | Folder | Perintah |
|---|---|---|
| Terminal 1 | `backend/` | `npm run dev` |
| Terminal 2 | `ml-service/` | `uvicorn app.main:app --reload --port 8000` |
| Terminal 3 | `frontend/` | `npm run dev` |

---

## 🧪 Mode Development (Tanpa API Asli)

Untuk belajar dan testing **tanpa** perlu token Instagram/TikTok, gunakan mode mock:

```env
# Di file backend/.env
USE_MOCK_SERVICE=true
```

Dengan mode ini:
- ✅ Komentar diganti dengan data tiruan yang realistis
- ✅ Analisis tetap berjalan normal
- ✅ Tidak perlu daftar ke Instagram/TikTok API
- ❌ Data tidak mencerminkan postingan nyata

---

## 🔑 Mendapatkan API Token (Opsional)

Jika kamu sudah siap menggunakan data nyata dari media sosial:

### Instagram Graph API
1. Daftar di [developers.facebook.com](https://developers.facebook.com/)
2. Buat aplikasi baru → tambahkan produk **Instagram**
3. Dapatkan **Long-lived User Access Token**
4. Isi di `backend/.env`:
   ```env
   IG_ACCESS_TOKEN=token_kamu_di_sini
   IG_USER_ID=id_akun_instagram_kamu
   ```

### TikTok Research API
1. Daftar di [developers.tiktok.com](https://developers.tiktok.com/)
2. Ajukan permohonan **Research API** (butuh persetujuan)
3. Setelah disetujui, isi di `backend/.env`:
   ```env
   TIKTOK_CLIENT_KEY=client_key_kamu
   TIKTOK_CLIENT_SECRET=client_secret_kamu
   ```

> ⚠️ Setelah mengisi token nyata, ubah `USE_MOCK_SERVICE=false`

---

## 📁 Struktur File Proyek

```
media-comment-insight-analyzer/
│
├── frontend/                    ← Kode React (tampilan)
│   └── src/
│       ├── pages/               ← Halaman-halaman aplikasi
│       ├── components/          ← Komponen UI reusable
│       ├── api/                 ← Fungsi pemanggilan API
│       └── stores/              ← State management (Zustand)
│
├── backend/                     ← Kode Node.js (server)
│   └── src/
│       ├── app.js               ← Entry point Express
│       ├── routes/              ← Definisi endpoint API
│       │   ├── auth.routes.js
│       │   ├── posts.routes.js
│       │   ├── analyses.routes.js
│       │   └── dashboard.routes.js
│       ├── controllers/         ← Logika request/response
│       ├── services/            ← Logika bisnis
│       ├── middleware/          ← Auth JWT, error handler
│       └── config/              ← Konfigurasi env, database
│
├── ml-service/                  ← Kode Python (AI/analisis)
│   └── app/
│       ├── main.py              ← Entry point FastAPI
│       ├── routers/             ← Endpoint ML (analisis)
│       ├── models/              ← Load model NLP
│       └── services/            ← Logika fetch komentar
│
└── database/                    ← File SQL
    ├── run_migrations.sql        ← Script jalankan semua migrasi
    └── migrations/              ← File migrasi per tabel
        ├── 001_create_posts.sql
        ├── 002_create_analyses.sql
        ├── 003_create_comments.sql
        ├── 004_create_keywords.sql
        └── 005_create_topics.sql
```

---

## 🧰 Tech Stack Lengkap

| Layer | Teknologi | Fungsi |
|---|---|---|
| **Frontend UI** | React 19, Vite, TypeScript | Tampilan antarmuka pengguna |
| **Styling** | Vanilla CSS + CSS Variables | Desain dan layout |
| **State Management** | Zustand + React Query | Mengelola data dan cache di frontend |
| **Grafik** | Recharts | Visualisasi hasil analisis |
| **Backend** | Node.js, Express.js | Server, REST API, routing |
| **Database** | PostgreSQL (raw SQL) | Penyimpanan data permanen |
| **ML Service** | Python, FastAPI, Uvicorn | API untuk model AI |
| **Analisis Sentimen** | IndoBERT | Klasifikasi positif/negatif/netral |
| **Topic Modeling** | BERTopic | Pengelompokan topik komentar |
| **Keyword Extraction** | TF-IDF | Menemukan kata kunci penting |
| **Autentikasi** | JWT (JSON Web Token) | Login admin single-user |

---

## ❗ Troubleshooting (Solusi Masalah Umum)

### ❌ `ECONNREFUSED 5432` — Database tidak bisa diakses
```
Penyebab: PostgreSQL belum berjalan atau password salah
Solusi:
  1. Pastikan PostgreSQL sudah distart
  2. Periksa kembali DATABASE_URL di backend/.env
  3. Pastikan database "insight_analyzer" sudah dibuat
```

### ❌ `MODULE_NOT_FOUND` — Modul Node.js tidak ditemukan
```
Penyebab: npm install belum dijalankan
Solusi: Jalankan "npm install" di folder backend/ dan frontend/
```

### ❌ ML Service error saat pertama dijalankan
```
Penyebab: Model AI (~500 MB) masih didownload
Solusi: Tunggu hingga download selesai, jangan matikan terminal
```

### ❌ Login gagal terus
```
Penyebab: ADMIN_PASSWORD di .env tidak sesuai
Solusi: Periksa kembali nilai ADMIN_PASSWORD di backend/.env
```

### ❌ Analisis tidak muncul hasilnya
```
Penyebab: ML Service belum berjalan
Solusi: Pastikan terminal ML Service aktif di port 8000
         Cek: http://localhost:8000/docs
```

---

## 📜 Endpoint API Backend

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/auth/login` | Login admin |
| `POST` | `/api/posts/analyze` | Analisis postingan baru |
| `GET` | `/api/posts` | Daftar semua postingan |
| `GET` | `/api/analyses/:id` | Detail hasil analisis |
| `GET` | `/api/dashboard` | Data ringkasan dashboard |

---

*Dibuat untuk keperluan analisis komentar media sosial berbahasa Indonesia.*
