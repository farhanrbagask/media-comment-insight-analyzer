#  Media Comment Insight Analyzer

> Aplikasi web untuk menganalisis komentar media sosial (Instagram & TikTok) dari file CSV hasil ekspor tools scraping (seperti **IG Lead Scrapper**), secara otomatis menggunakan AI — mencakup analisis sentimen berbahasa Indonesia, pengelompokan topik, ekstraksi kata kunci, hingga ringkasan insight dan dashboard analitik.

---

## 🧠 Apa yang Dilakukan Aplikasi Ini?

Menganalisis ratusan hingga ribuan komentar media sosial secara manual tentu memakan waktu. Aplikasi ini menyediakan alur berbasis CSV:

1. **Upload CSV**: Pengguna mengunggah file CSV hasil ekspor komentar (mendukung kolom `commentText`, `userName`, `commentId`, `date`, `userId`, `profileUrl`).
2. **Validasi & Data Cleaning**: Sistem otomatis mendeteksi baris kosong, komentar whitespace, duplikasi komentar, dan menormalisasi format tanggal.
3. **Preview & Ringkasan**: Pengguna melihat ringkasan baris valid, kosong, duplikat, dan data yang dilewati sebelum analisis dijalankan.
4. **Analisis AI**: Komentar valid dikirim ke ML Service (FastAPI) untuk:
   - **Analisis Sentimen**: IndoBERT untuk klasifikasi positif, netral, atau negatif.
   - **Topic Modeling**: BERTopic untuk mengelompokkan topik-topik utama pembicaraan.
   - **Keyword Extraction**: TF-IDF untuk menemukan kata kunci yang paling dominan.
5. **Dashboard & Visualisasi**: Hasil ditampilkan pada detail postingan serta dashboard analitik agregat (distribusi sentimen, tren, topik teratas, dsb).
6. **Re-analisis**: Analisis ulang kapan saja langsung dari data komentar yang telah tersimpan di database tanpa perlu mengunggah ulang file CSV.

---

##  Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│              React Frontend  (port 5173)                    │
│   Upload CSV, Data Preview, Cleaning Summary, Visualisasi   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Request (multipart/form-data & JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                │
│           Node.js + Express 5  (port 3001)                  │
│  - CsvImportService (parse, clean, dedup, validasi)         │
│  - In-memory Import Store dengan UUID Token & auto-expire   │
│  - PostgreSQL persistence & orkestrasi pipeline ML          │
└───────────┬─────────────────────────┬───────────────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────┐   ┌───────────────────────────────────┐
│     DATABASE        │   │          ML SERVICE               │
│  PostgreSQL (5432)  │   │    Python + FastAPI  (port 8000)   │
│  posts, comments,   │   │  Model IndoBERT, BERTopic, TF-IDF │
│  analyses, keywords,│   │  untuk pemrosesan teks Indonesia  │
│  topics             │   └───────────────────────────────────┘
└─────────────────────┘
```

| Komponen | Teknologi | Port |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Zustand + React Query + Recharts | `5173` |
| Backend | Node.js + Express 5 + PostgreSQL (pg) + Multer | `3001` |
| ML Service | Python 3.10+ + FastAPI + Uvicorn + PyTorch + Transformers | `8000` |
| Database | PostgreSQL 14+ | `5432` |

---

## 📄 Format CSV yang Didukung

Aplikasi dioptimalkan untuk file CSV hasil ekspor **IG Lead Scrapper** atau scraper serupa dengan kolom-kolom berikut (tidak sensitif huruf besar/kecil):

| Kolom CSV | Wajib? | Keterangan |
|---|---|---|
| `commentText` (atau `text`, `comment`) | **Ya** | Teks komentar (baris kosong akan otomatis dilewati) |
| `userName` (atau `user`) | Opsional | Username akun yang berkomentar |
| `commentId` (atau `id`) | Opsional | ID unik komentar (digunakan untuk mendeteksi duplikat) |
| `Date` (atau `date`, `timestamp`, `createdat`) | Opsional | Tanggal komentar (dinormalisasi ke ISO-8601) |
| `userId` | Opsional | ID pengguna |
| `profileUrl` | Opsional | URL profil pengguna |

---

##  Prasyarat

Pastikan software berikut sudah terinstall di komputer:

| Tools | Versi Minimum | Cara Cek |
|---|---|---|
| **Node.js** | 18+ | `node --version` |
| **npm** | 8+ | `npm --version` |
| **Python** | 3.10+ | `python --version` |
| **PostgreSQL** | 14+ | `psql --version` |
| **Git** | terbaru | `git --version` |

---

##  Panduan Setup Lengkap

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/username/media-comment-insight-analyzer.git
cd media-comment-insight-analyzer
```

Struktur folder:
```
media-comment-insight-analyzer/
├── frontend/        ← Aplikasi React + TypeScript
├── backend/         ← REST API Express + CsvImportService
├── ml-service/      ← Service AI FastAPI (IndoBERT, BERTopic, TF-IDF)
└── database/        ← File migrasi SQL (001 - 007)
```

---

### Langkah 2 — Setup Database PostgreSQL

Buka terminal dan buat database baru:

```bash
psql -U postgres
CREATE DATABASE insight_analyzer;
\q
```

---

### Langkah 3 — Setup Backend (Node.js)

#### 3a. Install dependensi backend
```bash
cd backend
npm install
```

#### 3b. Konfigurasi file `.env`
Salin file `.env.example`:
```bash
cp .env.example .env
```

Sesuaikan konfigurasi pada file `backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173

# Ganti dengan password PostgreSQL Anda
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/insight_analyzer
DATABASE_SSL=false

# Keamanan auth
JWT_SECRET=rahasia_jwt_anda_yang_panjang_minimal_32_karakter
ADMIN_PASSWORD=passwordAdminKamu

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

#### 3c. Jalankan Migrasi Database
Migrasi akan membuat seluruh tabel yang dibutuhkan (termasuk migrasi 006 & 007 untuk metadata import CSV dan tracking data yang dilewati):
```bash
npm run migrate
```

Output:
```
✓ 001_create_posts.sql applied
✓ 002_create_analyses.sql applied
✓ 003_create_comments.sql applied
✓ 004_create_keywords.sql applied
✓ 005_create_topics.sql applied
✓ 006_add_posts_import_meta.sql applied
✓ 007_add_comments_skip_meta.sql applied
All migrations applied successfully.
```

#### 3d. Jalankan Backend
```bash
npm run dev
```
Backend berjalan di: **http://localhost:3001**

---

### Langkah 4 — Setup ML Service (Python + FastAPI)

#### 4a. Buat & Aktifkan Virtual Environment
```bash
cd ../ml-service
python -m venv venv

# Windows (Command Prompt / PowerShell):
venv\Scripts\activate

# Linux / macOS:
source venv/bin/activate
```

#### 4b. Install Dependensi Python
```bash
pip install -r requirements.txt
```

#### 4c. Jalankan ML Service
```bash
uvicorn app.main:app --reload --port 8000
```
ML Service berjalan di: **http://localhost:8000** (Dokumentasi Swagger API di: http://localhost:8000/docs)

>  *Pada kali pertama dijalankan, library NLP akan mengunduh bobot model pretrained. Pastikan koneksi internet aktif.*

---

### Langkah 5 — Setup Frontend (React + Vite)

Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di: **http://localhost:5173**

---

### Langkah 6 — Penggunaan Aplikasi

1. Buka browser di **http://localhost:5173**.
2. Masuk menggunakan password admin yang ditentukan pada `ADMIN_PASSWORD`.
3. Buka menu **Import CSV** pada sidebar:
   - Pilih platform (Instagram atau TikTok).
   - Masukkan URL postingan sumber.
   - Drag & drop atau pilih file `.csv` dari komputer.
   - Klik **Preview CSV**.
4. Sistem akan menampilkan statistik:
   - Total baris yang dibaca.
   - Jumlah baris valid.
   - Jumlah baris dilewati (beserta tabel detail alasan: teks kosong atau duplikat ID).
   - Preview tabel baris komentar yang siap diproses.
5. Klik **Konfirmasi & Analisis** untuk memulai proses analisis AI.
6. Pantau progres secara real-time hingga selesai, lalu klik **Lihat Hasil Analisis** untuk melihat grafik sentimen, topik, kata kunci, dan penjelajah komentar.

---

## 🛠️ Menjalankan Semua Service Sekaligus

Buka **3 terminal** terpisah:

| Terminal | Folder | Perintah | Fungsi |
|---|---|---|---|
| Terminal 1 | `backend/` | `npm run dev` | REST API Server |
| Terminal 2 | `ml-service/` | `uvicorn app.main:app --reload --port 8000` | ML Analysis Engine |
| Terminal 3 | `frontend/` | `npm run dev` | Web Interface |

---

##  Ringkasan Endpoint API Backend

### Autentikasi
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/login` | Login admin (mengembalikan token JWT) |
| `GET` | `/api/auth/me` | Memeriksa status sesi login |

### CSV Import
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/imports/preview` | Upload file CSV (max 10MB), parsing, validasi, cleaning, dan menghasilkan token import |
| `POST` | `/api/imports/confirm` | Konfirmasi token import dan menjalankan pipeline analisis AI secara asinkron |

### Analisis & Hasil
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/analyses` | Daftar riwayat analisis dengan pagination, pencarian, dan filter |
| `GET` | `/api/analyses/:id` | Detail lengkap analisis (postingan, sentimen, topik, kata kunci, insight) |
| `GET` | `/api/analyses/:id/comments` | Penjelajah komentar per analisis dengan pencarian & filter sentimen |
| `POST` | `/api/analyses/:id/reanalyze` | Menjalankan ulang analisis ML dari komentar yang tersimpan di database |
| `DELETE` | `/api/analyses/:id` | Menghapus data analisis |

### Dashboard Agregat
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/dashboard/summary` | KPI total postingan, komentar, dan distribusi sentimen agregat |
| `GET` | `/api/dashboard/sentiment` | Agregasi persentase sentimen |
| `GET` | `/api/dashboard/trends` | Tren sentimen harian |
| `GET` | `/api/dashboard/topics` | Top topik lintas postingan |
| `GET` | `/api/dashboard/keywords` | Top kata kunci lintas postingan |
| `GET` | `/api/dashboard/platform` | Distribusi postingan & komentar per platform |
| `GET` | `/api/dashboard/recent` | Daftar analisis terbaru |

---

## 📁 Struktur File Proyek

```
media-comment-insight-analyzer/
├── frontend/
│   ├── src/
│   │   ├── api/                 # Klien API terpusat (axios)
│   │   ├── components/layout/   # Sidebar, layout
│   │   ├── pages/               # Dashboard, ImportCsv, AnalysisHistory, AnalysisDetail, Login
│   │   ├── store/               # Zustand authStore
│   │   ├── types/               # TypeScript interface terpusat
│   │   ├── App.tsx              # React router configuration
│   │   └── index.css            # Desain sistem & utilitas global
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── app.js               # Inisialisasi Express & routing
│   │   ├── controllers/         # Handler route (imports, analyses, posts, auth, dashboard)
│   │   ├── services/            # CsvImportService, AnalysisService, PostService, CommentService
│   │   ├── routes/              # Definisi route express (imports.routes.js, analyses.routes.js, dsb.)
│   │   ├── middleware/          # JWT auth middleware, error handling
│   │   └── scripts/migrate.js   # Script runner migrasi database
│   └── package.json
│
├── ml-service/
│   ├── app/
│   │   ├── main.py              # Inisialisasi FastAPI
│   │   ├── routers/analyze.py   # Endpoint /analyze
│   │   ├── models/loader.py     # Loader model IndoBERT, BERTopic, TF-IDF
│   │   └── services/            # Preprocessing teks, ekstraksi insight
│   └── requirements.txt
│
└── database/
    └── migrations/              # Script migrasi SQL 001 s.d. 007
```

---

*Dibuat untuk analisis komentar media sosial berbahasa Indonesia berbasis data ekspor CSV.*
