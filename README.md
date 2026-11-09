# Media Comment Insight Analyzer

> Platform analisis sentimen dan ekstraksi *insight* berbasis kecerdasan buatan (*AI*) untuk data komentar media sosial (Instagram dan TikTok) hasil ekspor CSV, dilengkapi arsitektur *microservices* terpisah antara Frontend, Backend REST API, dan ML Service berbasis IndoBERT & BERTopic.

---

## Daftar Isi

1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Latar Belakang & Rumusan Masalah](#latar-belakang--rumusan-masalah)
3. [Tujuan Proyek](#tujuan-proyek)
4. [Fitur Utama](#fitur-utama)
5. [Tumpukan Teknologi](#tumpukan-teknologi)
6. [Arsitektur Sistem](#arsitektur-sistem)
7. [Alur Kerja Aplikasi](#alur-kerja-aplikasi)
8. [Struktur Direktori Proyek](#struktur-direktori-proyek)
9. [Prasyarat Sistem](#prasyarat-sistem)
10. [Panduan Instalasi & Menjalankan Aplikasi](#panduan-instalasi--menjalankan-aplikasi)
11. [Konfigurasi Environment](#konfigurasi-environment)
12. [Panduan Penggunaan](#panduan-penggunaan)
13. [Dokumentasi API](#dokumentasi-api)
14. [Dokumentasi Database](#dokumentasi-database)
15. [Dokumentasi Machine Learning & NLP](#dokumentasi-machine-learning--nlp)
16. [Kinerja & Evaluasi Model](#kinerja--evaluasi-model)
17. [Batasan Sistem](#batasan-sistem)
18. [Rencana Pengembangan Mendatang](#rencana-pengembangan-mendatang)
19. [Panduan Kontribusi](#panduan-kontribusi)
20. [Lisensi](#lisensi)
21. [Penulis & Pengelola](#penulis--pengelola)

---

## Ringkasan Proyek

**Media Comment Insight Analyzer** adalah aplikasi web *end-to-end* yang dirancang untuk mengolah, membersihkan, dan menganalisis ribuan komentar audiens pada platform media sosial (khususnya Instagram dan TikTok). Aplikasi ini menerima berkas ekspor data berbentuk CSV (seperti yang dihasilkan oleh *tools scraping* IG Lead Scrapper atau alat serupa), melakukan validasi dan pembersihan data otomatis, lalu memproses teks komentar menggunakan rangkaian model pemrosesan bahasa alami (*Natural Language Processing* / NLP) berbahasa Indonesia.

Melalui antarmuka visual yang interaktif, pengguna dapat memperoleh:
- Klasifikasi sentimen setiap komentar (Positif, Netral, Negatif).
- Distribusi agregat sentimen dan tren waktu.
- Ekstraksi topik pembicaraan utama (*Topic Modeling*).
- Kata kunci dominan (*Keyword Extraction*) berupa unigram dan bigram.
- Ringkasan naratif otomatis serta rekomendasi tindakan (*Actionable Insights*) berbasis data tanpa risiko halusinasi.

---

## Latar Belakang & Rumusan Masalah

### Latar Belakang
Interaksi publik pada media sosial instansi pemerintah, korporasi, maupun figur publik menghasilkan ribuan komentar setiap harinya. Komentar-komentar ini memuat opini publik, aduan pelayanan, pertanyaan, apresiasi, maupun kritik tajam. Mengetahui dinamika suara audiens secara cepat merupakan kunci pengambilan keputusan strategis dan peningkatan mutu layanan.

### Masalah yang Dihadapi
1. **Beban Analisis Manual**: Membaca dan mengklasifikasikan ribuan komentar secara manual memerlukan waktu lama, tenaga ekstra, dan memiliki subjektivitas tinggi antar penilai.
2. **Kualitas Data Ekspor yang Tidak Seragam**: Hasil ekstraksi data mentah dari alat *scraping* kerap memuat baris kosong, spasi berlebih, karakter rusak, tanggal tidak berformat standar, serta duplikasi data komentar.
3. **Keterbatasan Alat Analisis Konvensional**: Sebagian besar *tools* analitik global tidak optimal memproses Bahasa Indonesia non-formal (bahasa gaul/slang, pengulangan karakter ekspresif, singkatan, serta partikel percakapan).
4. **Ketiadaan *Insight* Terstruktur**: Sekadar mengetahui jumlah sentimen positif atau negatif belum cukup; pemangku kepentingan membutuhkan kluster topik aduan (misalnya isu pelayanan, harga, fasilitas) dan kata kunci spesifik untuk merumuskan aksi perbaikan.

---

## Tujuan Proyek

1. Menyediakan jalur pemrosesan data (*data pipeline*) yang andal dari berkas CSV mentah hingga menjadi data terstruktur di basis data.
2. Mengintegrasikan model *Deep Learning* IndoBERT lokal guna menghasilkan inferensi sentimen teks Bahasa Indonesia yang akurat dan sensitif konteks.
3. Mengelompokkan isu publik ke dalam kategori tematik menggunakan BERTopic dan pencocokan semantik leksikal.
4. Menyediakan sistem dasbor analitik visual yang memudahkan pemantauan metrik secara terpusat serta penelusuran komentar individual.
5. Memungkinkan re-analisis data yang sudah tersimpan di basis data tanpa perlu mengunggah ulang berkas CSV sumber.

---

## Fitur Utama

| Fitur | Deskripsi Teknis | Manfaat |
|---|---|---|
| **Pembersihan & Validasi CSV Otomatis** | Mengurai berkas CSV (*multipart/form-data* hingga 10 MB), mendeteksi *header* fleksibel (`commentText`, `userName`, `commentId`, `date`), memfilter baris kosong, menormalisasi tanggal ke format ISO-8601, serta mendeteksi duplikat `commentId`. | Memastikan hanya data valid dan bersih yang masuk ke dalam *pipeline* analisis. |
| **Pratinjau & Ringkasan Impor (*Preview & Summary*)** | Menyimpan hasil *parsing* sementara di memori backend dengan token UUID unik (masa kedaluwarsa 10 menit), menampilkan jumlah baris valid, baris kosong, dan daftar detail baris yang dilewati (*skipped rows*). | Memberikan kontrol dan transparansi penuh kepada pengguna sebelum mengeksekusi analisis AI. |
| **Analisis Sentimen IndoBERT** | Melakukan inferensi teks terklasifikasi ke 3 kelas (`positif`, `netral`, `negatif`) menggunakan model lokal berbasis *transformer* IndoBERT dengan mekanisme *batching* (32 item/batch) dan *fallback* otomatis ke model multibahasa. | Akurasi tinggi dalam memahami nuansa bahasa percakapan informal Indonesia. |
| **Pemodelan Topik (BERTopic & Rule-Based)** | Mengklasifikasikan komentar ke topik tematik (*Pelayanan, Harga, Kualitas, Pengiriman, Kemasan, Informasi, Fasilitas, Konten, Umum*) menggunakan *sentence embeddings* (`paraphrase-multilingual-MiniLM-L12-v2`) atau pemetaan kata kunci terdistribusi. | Membantu identifikasi bidang masalah operasional secara instan. |
| **Ekstraksi Kata Kunci (*TF-IDF & N-Gram*)** | Mengekstraksi unigram dan bigram dominan setelah proses *tokenizing* dan pemfilteran *stopword* Bahasa Indonesia. | Mengidentifikasi frasa spesifik yang sering diucapkan warganet. |
| **Pembangkit Insight & Rekomendasi Naratif** | Mesin berbasis *rule* dan templat statistik yang menyusun laporan naratif: ringkasan sentimen, aspek apresiasi, isu keluhan dominan, serta rekomendasi penanganan berbasis keparahan (*severity*). | Menghasilkan ringkasan siap lapor tanpa risiko halusinasi teks LLM. |
| **Dasbor Analitik Agregat** | Visualisasi grafik berbasis Recharts: kartu metrik KPI, diagram donat sentimen, grafik batang kata kunci & topik, grafik tren harian, serta distribusi platform. | Memantau performa konten dan sentimen publik lintas postingan. |
| **Penjelajah Komentar (*Comment Explorer*)** | Tabel interaktif dilengkapi pagination, pencarian teks bebas (*ILIKE*), dan penyaringan berdasarkan kelas sentimen. | Memudahkan audit keabsahan analisis per baris komentar. |
| **Re-analisis Data Tersimpan** | Menjalankan ulang analisis ML langsung dari tabel komentar di basis data tanpa perlu unggah ulang berkas CSV. | Menghemat waktu saat ingin memperbarui hasil analisis. |
| **Keamanan Autentikasi Admin** | Proteksi rute backend menggunakan token JSON Web Token (JWT) dengan algoritma HMAC-SHA256 dan masa berlaku 7 hari. | Mengamankan dasbor dan data analitik dari akses tanpa izin. |

---

## Tumpukan Teknologi

### Frontend
- **React 19**: Pustaka antarmuka pengguna berbasis komponen deklaratif.
- **Vite 8**: *Build tool* dan *development server* modern berbasis ESM.
- **TypeScript 6**: Pengecekan tipe data statis demi keandalan kode.
- **Zustand 5**: Manajemen *state* autentikasi ringan dengan *middleware* persistensi ke `localStorage`.
- **TanStack React Query 5**: Manajemen pengambilan data (*data fetching*), *caching*, dan sinkronisasi *state* server.
- **Recharts 3**: Pustaka visualisasi grafik berbasis SVG (PieChart, BarChart, LineChart).
- **React Router 7**: Manajemen rute navigasi aplikasi SPA (*Single Page Application*).
- **Lucide React**: Kumpulan ikon SVG konsisten untuk navigasi dan aksi pengguna.
- **Axios**: Klien HTTP untuk komunikasi dengan backend REST API dilengkapi *request/response interceptors*.

### Backend
- **Node.js (v18+)**: Lingkungan eksekusi JavaScript sisi server.
- **Express 5**: *Framework* web minimalis untuk penyediaan REST API.
- **pg (node-postgres)**: Pustaka klien koneksi basis data PostgreSQL berbasis *Connection Pool*.
- **Multer**: *Middleware* penanganan berkas unggahan CSV ke dalam *memory buffer*.
- **JSONWebToken (jsonwebtoken)**: Pembuatan dan validasi token otentikasi JWT.
- **Helmet**: Pengamanan *header* HTTP Express.
- **CORS**: Pengaturan izin akses sumber daya lintas domain (*Cross-Origin Resource Sharing*).
- **Morgan**: *Logger* pencatat riwayat permintaan HTTP.
- **Express-Validator**: Validasi parameter rute dan muatan (*payload*) permintaan.

### Basis Data
- **PostgreSQL 14+**: Basis data relasional ACID untuk penyimpanan data postingan, analisis, komentar, topik, dan kata kunci.

### Machine Learning & NLP Service
- **Python 3.10+**: Bahasa pemrograman utama untuk ekosistem AI/ML.
- **FastAPI 0.115**: *Framework* web asinkron berkinerja tinggi untuk melayani API inferensi model.
- **Uvicorn**: Server ASGI berkemampuan *asynchronous*.
- **PyTorch 2.4**: *Framework deep learning* komputasi tensor untuk inferensi model.
- **Hugging Face Transformers 4.44**: Antarmuka pemuatan bobot model IndoBERT (`BertForSequenceClassification`).
- **Sentence-Transformers 3.1**: Model pembangun *embedding* kalimat multibahasa (`paraphrase-multilingual-MiniLM-L12-v2`).
- **BERTopic 0.16**: Pustaka *topic modeling* modular berbasis *transformer embeddings* dan *c-TF-IDF*.
- **Scikit-Learn 1.5**: Pustaka penunjang *CountVectorizer* dan komputasi matriks frekuensi.
- **Pydantic 2.8**: Validasi skema permintaan dan respons API inferensi.

---

## Arsitektur Sistem

Sistem dibangun menggunakan pola *microservices* modular, di mana Frontend, Backend, dan ML Service berkomunikasi melalui antarmuka HTTP RESTful:

```mermaid
flowchart TD
    User["Aktor / Pengguna"] -->|Akses Browser| FE["Frontend (React 19 + Vite)<br/>Port: 5173"]
    
    subgraph Client Layer
        FE
    end
    
    subgraph Application Layer
        BE["Backend API (Express 5 + Node.js)<br/>Port: 3001"]
        MemStore[("In-Memory Import Store<br/>UUID Token, TTL 10m")]
    end
    
    subgraph Data Layer
        DB[("PostgreSQL 14+<br/>Port: 5432<br/>Tabel: posts, analyses, comments,<br/>keywords, topics")]
    end
    
    subgraph AI / ML Engine
        ML["ML Service (FastAPI + PyTorch)<br/>Port: 8000"]
        IndoBERT["IndoBERT Sentiment Classifier<br/>(my-indobert-sentiment)"]
        BERTopic["BERTopic Engine + MiniLM-L12"]
        TFIDF["TF-IDF / N-Gram Extractor"]
        InsightGen["Deterministic Insight Generator"]
    end

    FE -->|Upload CSV multipart/form-data| BE
    FE -->|Konfirmasi Impor & Query Analitik| BE
    
    BE <-->|Simpan Sementara Hasil Parse| MemStore
    BE <-->|Query & Transaksi SQL (pg Pool)| DB
    
    BE -->|POST /analyze (Batch Komentar Mentah)| ML
    ML --> IndoBERT
    ML --> BERTopic
    ML --> TFIDF
    ML --> InsightGen
    ML -.->|Hasil Prediksi Sentimen, Topik, Kata Kunci, Insight| BE
```

---

## Alur Kerja Aplikasi

Berikut adalah diagram alur proses dari berkas CSV mentah hingga penyajian hasil analitik di antarmuka web:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Pengguna (Admin)
    participant FE as React Frontend
    participant BE as Express Backend
    participant DB as PostgreSQL
    participant ML as FastAPI ML Service

    Admin->>FE: Masukkan Password Admin
    FE->>BE: POST /api/auth/login
    BE-->>FE: Kembalikan JWT Token (7 hari)
    
    Admin->>FE: Unggah File CSV + Pilih Platform + Masukkan URL Postingan
    FE->>BE: POST /api/imports/preview (multipart/form-data)
    Note over BE: CsvImportService melakukan pembersihan:<br/>1. Header mapping<br/>2. Deteksi teks kosong & duplikat ID<br/>3. Normalisasi tanggal ke ISO-8601
    BE->>BE: Simpan data valid di Memory Store (TTL 10m)
    BE-->>FE: Kembalikan preview baris, skipped summary, & importToken
    
    Admin->>FE: Periksa Statistik & Klik 'Konfirmasi & Analisis'
    FE->>BE: POST /api/imports/confirm (importToken)
    BE->>DB: Buat/Cari data Postingan & Buat record Analisis (Status: pending)
    BE-->>FE: Kembalikan 202 Accepted (postId, analysisId)
    
    rect rgb(240, 248, 255)
        Note over BE,ML: Pipeline Asinkron di Latar Belakang
        BE->>DB: Update status analisis -> 'processing'
        BE->>ML: POST /analyze { comments: [raw_text, ...] }
        Note over ML: 1. Text Preprocessing (pembersihan mention, url, emoji, dll)<br/>2. Batch Sentiment Inference (IndoBERT)<br/>3. Topic Extraction (BERTopic / Fallback)<br/>4. Keyword Extraction (TF-IDF & N-Gram)<br/>5. Insight Generation
        ML-->>BE: Kembalikan struktur hasil lengkap
        BE->>DB: Transaksi Simpan Komentar, Kata Kunci, Topik
        BE->>DB: Update status analisis -> 'completed' + agregasi persentase
    end

    loop Polling Status Analisis
        FE->>BE: GET /api/analyses/:id
        BE-->>FE: Status Analisis (pending / processing / completed)
    end

    FE->>Admin: Tampilkan Grafik Sentimen, Topik, Kata Kunci, Komentar, & Insight Naratif
```

---

## Struktur Direktori Proyek

```
media-comment-insight-analyzer/
├── README.md                      # Dokumentasi utama proyek
├── .gitignore                     # Aturan pengabaian berkas Git
│
├── database/                      # Modul basis data
│   └── migrations/                # Berkas migrasi DDL SQL berurutan
│       ├── 001_create_posts.sql
│       ├── 002_create_analyses.sql
│       ├── 003_create_comments.sql
│       ├── 004_create_keywords.sql
│       ├── 005_create_topics.sql
│       ├── 006_add_posts_import_meta.sql
│       └── 007_add_comments_skip_meta.sql
│
├── backend/                       # Server REST API (Node.js + Express)
│   ├── .env.example               # Contoh konfigurasi variabel lingkungan backend
│   ├── package.json               # Manifest dependensi dan skrip backend
│   └── src/
│       ├── app.js                 # Inisialisasi Express, middleware keamanan, dan rute
│       ├── config/
│       │   ├── db.js              # Inisialisasi PostgreSQL pool & fungsi query
│       │   └── env.js             # Validasi variabel lingkungan saat startup
│       ├── controllers/
│       │   ├── analyses.controller.js  # Handler riwayat, detail, re-analisis, & hapus
│       │   ├── auth.controller.js      # Handler autentikasi login & verifikasi token
│       │   ├── dashboard.controller.js # Handler agregasi metrik, tren, topik, & kata kunci
│       │   ├── imports.controller.js   # Handler preview CSV & konfirmasi impor
│       │   └── posts.controller.js     # Handler data postingan sosial media
│       ├── middleware/
│       │   ├── auth.middleware.js      # Middleware verifikasi otentikasi JWT Bearer
│       │   └── error.middleware.js     # Global central error handler
│       ├── routes/
│       │   ├── analyses.routes.js      # Definisi rute /api/analyses
│       │   ├── auth.routes.js          # Definisi rute /api/auth
│       │   ├── dashboard.routes.js     # Definisi rute /api/dashboard
│       │   ├── imports.routes.js       # Definisi rute /api/imports
│       │   └── posts.routes.js         # Definisi rute /api/posts
│       ├── scripts/
│       │   └── migrate.js              # Runner migrasi SQL otomatis ke PostgreSQL
│       ├── services/
│       │   ├── AnalysisService.js      # Orkestrator pipeline analisis & pemanggilan ML
│       │   ├── CommentService.js       # Operasi batch insert dan penelusuran komentar
│       │   ├── CsvImportService.js     # Parser CSV, pembersihan data, & store in-memory
│       │   ├── DashboardService.js     # Agregasi kueri analitik SQL lintas postingan
│       │   ├── PostService.js          # CRUD entitas postingan media sosial
│       │   └── social-media/           # Layanan adapter sosial media (legacy/mock)
│       └── utils/
│           ├── apiResponse.js          # Pembungkus standar format respons API JSON
│           └── urlValidator.js         # Validasi URL Instagram dan TikTok
│
├── frontend/                      # Antarmuka Pengguna (React + TypeScript + Vite)
│   ├── package.json               # Manifest dependensi dan skrip frontend
│   ├── vite.config.ts             # Konfigurasi bundler Vite dan API reverse proxy
│   ├── tsconfig.json              # Konfigurasi TypeScript compiler
│   └── src/
│       ├── main.tsx               # Titik masuk utama aplikasi React DOM
│       ├── App.tsx                # Komponen akar & deklarasi rute halaman
│       ├── index.css              # Sistem desain global CSS (tema warna, tombol, kartu)
│       ├── api/
│       │   ├── client.ts          # Axios instance, interceptor token JWT & logout otomatis
│       │   └── index.ts           # Definisi fungsi pemanggilan API terpusat
│       ├── components/layout/
│       │   ├── Sidebar.tsx        # Navigasi samping (menu Dashboard, Impor, Riwayat)
│       │   └── Topbar.tsx         # Bilah atas dengan informasi sesi dan tombol logout
│       ├── pages/
│       │   ├── AnalysisDetail.tsx # Halaman visualisasi detail hasil analisis postingan
│       │   ├── AnalysisHistory.tsx# Halaman daftar riwayat seluruh analisis dengan filter
│       │   ├── Dashboard.tsx      # Dasbor agregat metrik KPI, tren sentimen, topik utama
│       │   ├── ImportCsv.tsx      # Formulir upload berkas CSV, wizard pratinjau & proses
│       │   └── Login.tsx          # Halaman masuk dengan kata sandi admin
│       ├── store/
│       │   └── authStore.ts       # Zustand store untuk status token & autentikasi
│       └── types/
│           └── index.ts           # Deklarasi antarmuka TypeScript terpusat
│
└── ml-service/                    # Layanan NLP / AI (Python + FastAPI)
    ├── requirements.txt           # Dependensi pustaka Python (PyTorch, Transformers, dll.)
    ├── start.bat                  # Skrip instan untuk mengaktifkan venv dan menjalankan server
    ├── .env                       # Konfigurasi host dan port ML Service
    ├── my-indobert-sentiment/     # Bobot model lokal fine-tuned IndoBERT
    │   ├── config.json            # Konfigurasi arsitektur BERT (768 hidden, 3 label)
    │   ├── model.safetensors      # Bobot tensor model IndoBERT
    │   ├── tokenizer.json         # Kosakata tokenizer BERT
    │   ├── tokenizer_config.json  # Konfigurasi parameter tokenizer
    │   └── training_args.bin      # Argumen penunjang checkpoint pelatihan
    └── app/
        ├── main.py                # Konfigurasi FastAPI, CORS, dan event startup lifespan
        ├── models/
        │   └── loader.py          # Singleton loader untuk pipeline IndoBERT & SentenceTransformer
        ├── routers/
        │   └── analyze.py         # Endpoint POST /analyze (orkestrasi inferensi NLP)
        └── services/
            ├── insight.py         # Pembangkit ringkasan wawasan naratif deterministik
            ├── keywords.py        # Ekstraktor kata kunci berbasis unigram & bigram TF-IDF
            ├── preprocessor.py    # Pembersih teks teks sosial media (URL, mention, emoji)
            ├── sentiment.py       # Pemetaan kelas prediksi sentimen & eksekusi batch
            └── topics.py          # Pemodelan topik BERTopic & aturan berbasis kata kunci
```

---

## Prasyarat Sistem

Sebelum melakukan instalasi, pastikan lingkungan komputer telah terpasang perangkat lunak berikut:

| Perangkat Lunak | Versi Minimum | Keterangan | Cara Verifikasi |
|---|---|---|---|
| **Node.js** | `v18.0.0` atau lebih baru | Diperlukan untuk Backend Express dan *build* Frontend | `node --version` |
| **npm** | `v8.0.0` atau lebih baru | Manajer paket Node.js | `npm --version` |
| **Python** | `3.10.x` s.d. `3.11.x` | Diperlukan untuk ML Service (disarankan 64-bit) | `python --version` |
| **PostgreSQL** | `v14.0` atau lebih baru | Sistem manajemen basis data relasional | `psql --version` |
| **Git** | Versi terbaru | Sistem kontrol versi | `git --version` |

> [!NOTE]
> Layanan ML Service memerlukan memori RAM minimal 4 GB (disarankan 8 GB atau lebih) untuk memuat model IndoBERT dan *multilingual sentence transformer*. Jika tersedia GPU NVIDIA dengan CUDA, PyTorch akan secara otomatis memanfaatkan akselerasi GPU.

---

## Panduan Instalasi & Menjalankan Aplikasi

Ikuti urutan langkah berikut secara runtut dari direktori akar proyek:

### Langkah 1: Kloning Repositori

Buka terminal (PowerShell atau Bash) lalu jalankan:

```bash
git clone https://github.com/farhanrbagask/media-comment-insight-analyzer.git
cd media-comment-insight-analyzer
```

---

### Langkah 2: Persiapan Basis Data PostgreSQL

1. Pastikan servis PostgreSQL sedang berjalan di komputer lokal.
2. Buat basis data baru bernama `insight_analyzer` melalui terminal `psql`:

```sql
psql -U postgres
CREATE DATABASE insight_analyzer;
\q
```

---

### Langkah 3: Konfigurasi dan Eksekusi Backend

1. Buka folder `backend`:
   ```bash
   cd backend
   ```
2. Pasang paket dependensi:
   ```bash
   npm install
   ```
3. Buat berkas konfigurasi `.env` dari contoh yang disediakan:
   ```bash
   # Di Windows Command Prompt / PowerShell:
   copy .env.example .env

   # Di Linux / macOS:
   cp .env.example .env
   ```
4. Buka berkas `backend/.env` menggunakan editor teks, lalu sesuaikan kata sandi database dan kata sandi admin Anda (lihat [Konfigurasi Environment](#konfigurasi-environment)).
5. Jalankan migrasi basis data untuk membangun seluruh tabel dan relasi secara otomatis:
   ```bash
   npm run migrate
   ```
   *Output yang diharapkan:*
   ```text
     ▶  Applying 001_create_posts.sql...
     ✅  001_create_posts.sql applied.
     ...
     ✅  007_add_comments_skip_meta.sql applied.

   🎉  All migrations applied successfully.
   ```
6. Jalankan server Backend:
   ```bash
   npm run dev
   ```
   Server backend berjalan di alamat: **`http://localhost:3001`**.

---

### Langkah 4: Konfigurasi dan Eksekusi ML Service

Buka jendela terminal baru:

1. Masuk ke direktori `ml-service`:
   ```bash
   cd ml-service
   ```
2. Buat *virtual environment* Python:
   ```bash
   python -m venv venv
   ```
3. Aktifkan *virtual environment*:
   - **Windows (PowerShell / Command Prompt)**:
     ```bash
     venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
4. Pasang seluruh dependensi pustaka Python:
   ```bash
   pip install -r requirements.txt
   ```
5. Jalankan server ML Service:
   - Menggunakan skrip cepat (khusus Windows):
     ```cmd
     start.bat
     ```
   - Atau langsung menggunakan Uvicorn:
     ```bash
     uvicorn app.main:app --reload --port 8000
     ```
   ML Service berjalan di: **`http://localhost:8000`**.  
   Dokumentasi interaktif Swagger API dapat diakses di: **`http://localhost:8000/docs`**.

> [!NOTE]
> Pada saat pertama kali dijalankan, sistem akan memuat model sentimen lokal di folder `my-indobert-sentiment` dan mengunduh model *sentence embedding* (`paraphrase-multilingual-MiniLM-L12-v2`). Pastikan komputer terhubung ke internet pada *startup* pertama.

---

### Langkah 5: Konfigurasi dan Eksekusi Frontend

Buka jendela terminal baru:

1. Masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Pasang dependensi frontend:
   ```bash
   npm install
   ```
3. Jalankan server pengembang (*development server*):
   ```bash
   npm run dev
   ```
   Antarmuka web dapat diakses melalui browser di alamat: **`http://localhost:5173`**.

---

## Konfigurasi Environment

### Backend (`backend/.env`)

| Variabel | Tipe Data | Wajib? | Nilai Bawaan / Contoh | Deskripsi |
|---|---|---|---|---|
| `PORT` | Integer | Tidak | `3001` | Port jaringan lokal tempat server Express berjalan. |
| `FRONTEND_URL` | String | Tidak | `http://localhost:5173` | Alamat URL Frontend untuk izin CORS. |
| `DATABASE_URL` | String | **Ya** | `postgresql://postgres:password@localhost:5432/insight_analyzer` | String koneksi basis data PostgreSQL. |
| `DATABASE_SSL` | Boolean | Tidak | `false` | Penggunaan koneksi SSL basis data (`true` untuk layanan cloud). |
| `JWT_SECRET` | String | **Ya** | `change_this_to_a_long_random_secret_string_min_32_chars` | Kunci rahasia untuk menandatangani dan memverifikasi token JWT (minimal 32 karakter). |
| `ADMIN_PASSWORD` | String | **Ya** | `change_this_to_your_admin_password` | Kata sandi tunggal untuk proses masuk ke aplikasi web. |
| `ML_SERVICE_URL` | String | Tidak | `http://localhost:8000` | Alamat basis URL layanan ML Service FastAPI. |

### ML Service (`ml-service/.env`)

| Variabel | Tipe Data | Wajib? | Nilai Bawaan | Deskripsi |
|---|---|---|---|---|
| `ML_SERVICE_HOST` | String | Tidak | `0.0.0.0` | Alamat *bind host* server FastAPI. |
| `ML_SERVICE_PORT` | Integer | Tidak | `8000` | Port tempat FastAPI beroperasi. |

---

## Panduan Penggunaan

### 1. Masuk ke Aplikasi (*Login*)
1. Buka browser dan arahkan ke alamat `http://localhost:5173`.
2. Halaman secara otomatis mengarahkan ke `/login` jika belum memiliki sesi aktif.
3. Masukkan kata sandi yang telah Anda atur pada variabel `ADMIN_PASSWORD` di berkas `backend/.env`.
4. Klik **Login**. Sesi akan disimpan di *local storage* browser selama 7 hari.

### 2. Format Berkas CSV yang Didukung
Aplikasi dioptimalkan membaca berkas CSV hasil ekspor *tools* *scraping* (seperti IG Lead Scrapper). Pengenalan nama kolom bersifat *case-insensitive* dan mendukung padanan nama kolom berikut:

| Nama Kolom CSV yang Dikenali | Field Internal | Sifat | Deskripsi |
|---|---|---|---|
| `commentText`, `comment`, `text` | `commentText` | **Wajib** | Isi teks komentar. Baris dengan teks kosong otomatis diabaikan. |
| `commentId`, `id` | `commentId` | Opsional | ID unik komentar. Digunakan untuk menyaring baris duplikat. |
| `userName`, `user` | `userName` | Opsional | Nama akun/username pengirim komentar. |
| `Date`, `date`, `timestamp`, `createdat` | `date` | Opsional | Tanggal pengiriman (format teks bebas, dinormalisasi ke ISO-8601). |
| `userId` | `userId` | Opsional | Identitas unik akun pembuat komentar. |
| `profileUrl` | `profileUrl` | Opsional | Tautan URL profil sosial media pengguna. |

### 3. Mengimpor dan Menganalisis Berkas CSV
1. Pada menu navigasi sebelah kiri, klik menu **Import CSV**.
2. **Pilih Platform**: Klik salah satu tombol platform sumber data (**Instagram** atau **TikTok**).
3. **URL Postingan**: Masukkan tautan URL postingan asli (misal: `https://www.instagram.com/p/C_abc123/`).
4. **Pilih Berkas**: Tarik dan lepas (*drag & drop*) berkas `.csv` ke area unggah atau klik untuk memilih berkas dari komputer (maksimal 10 MB atau 10.000 baris).
5. Klik **Preview CSV**. Sistem akan mengirim berkas ke server, melakukan pembersihan data, dan menampilkan panel ringkasan:
   - Jumlah baris yang berhasil divalidasi.
   - Jumlah baris kosong yang dilewati.
   - Jumlah duplikasi `commentId` yang disaring.
   - Tabel pratinjau data komentar valid.
   - Tabel detail alasan baris yang dilewati (*Empty Text* atau *Duplicate ID*).
6. Klik tombol **Konfirmasi & Analisis**.
7. Sistem akan mengeksekusi pipeline NLP di latar belakang sambil memperbarui status progres visual (Menyimpan data $\rightarrow$ Analisis Sentimen $\rightarrow$ Ekstraksi Topik $\rightarrow$ Ekstraksi Kata Kunci $\rightarrow$ Pembangkitan Insight).
8. Setelah selesai, klik **Lihat Hasil Analisis** untuk membuka halaman detail.

### 4. Menjelajahi Dasbor & Riwayat
- **Dashboard**: Menampilkan ringkasan metrik performa seluruh postingan yang pernah dianalisis, rasio sentimen total, grafik tren waktu, serta sepuluh topik dan kata kunci yang paling sering dibicarakan audiens.
- **Riwayat Analisis**: Menampilkan daftar tabel seluruh postingan yang tersimpan. Pengguna dapat melakukan pencarian berdasarkan URL/caption, memfilter berdasarkan platform atau rentang tanggal, menghapus analisis lama, atau memilih tindakan **Re-Analyze** untuk mengulang analisis AI dari data komentar di database.

---

## Dokumentasi API

Seluruh endpoint backend yang memerlukan autentikasi mewajibkan *header* HTTP:  
`Authorization: Bearer <token_jwt>`

### 1. Autentikasi (`/api/auth`)

#### `POST /api/auth/login`
Melakukan verifikasi kata sandi admin dan menghasilkan token akses.
- **Request Body**:
  ```json
  {
    "password": "kata_sandi_admin"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "expiresIn": "7d"
    }
  }
  ```
- **Response Error (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Incorrect password.",
    "errorCode": "INVALID_CREDENTIALS"
  }
  ```

#### `POST /api/auth/verify`
Memverifikasi keabsahan token JWT yang sedang digunakan.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: `{"success": true, "data": {"valid": true}}`

---

### 2. Impor Berkas CSV (`/api/imports`)

#### `POST /api/imports/preview`
Mengunggah berkas CSV mentah, melakukan pembersihan dan validasi, menyimpan data sementara di memori, dan mengembalikan ringkasan.
- **Headers**: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
- **Form Data**:
  - `file`: Berkas biner CSV (maksimal 10 MB)
  - `platform`: String (`"instagram"` atau `"tiktok"`)
  - `post_url`: String URL postingan sumber yang valid
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "CSV parsed successfully...",
    "data": {
      "importToken": "550e8400-e29b-41d4-a716-446655440000",
      "summary": {
        "totalRows": 250,
        "valid": 240,
        "skipped": 8,
        "duplicates": 2,
        "filename": "comments_export.csv",
        "platform": "instagram",
        "postUrl": "https://www.instagram.com/p/example"
      },
      "preview": [
        {
          "platformCommentId": "1790123456",
          "username": "warganet_01",
          "rawText": "Pelayanannya sangat cepat dan memuaskan!",
          "normalizedText": "Pelayanannya sangat cepat dan memuaskan!",
          "publishedAt": "2026-09-20T10:15:00.000Z"
        }
      ],
      "skipped": [
        { "rowNum": 12, "rawText": "   ", "skipReason": "empty_text" },
        { "rowNum": 45, "rawText": "Bagus", "skipReason": "duplicate_id", "commentId": "1790123456" }
      ]
    }
  }
  ```

#### `POST /api/imports/confirm`
Mengonfirmasi data impor berdasarkan token sementara dan memulai antrean pemrosesan AI asinkron.
- **Request Body**:
  ```json
  {
    "importToken": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```
- **Response (202 Accepted)**:
  ```json
  {
    "success": true,
    "message": "Analysis started...",
    "data": {
      "postId": 1,
      "analysisId": 1
    }
  }
  ```

---

### 3. Analisis & Postingan (`/api/analyses`)

#### `GET /api/analyses`
Mendapatkan daftar seluruh analisis dengan fitur pagination, pencarian, dan penyaringan.
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20, max: 100)
  - `platform` (`"instagram"` | `"tiktok"`)
  - `status` (`"pending"` | `"processing"` | `"completed"` | `"failed"`)
  - `search` (pencarian teks pada URL, caption, atau author)
  - `sortBy` (`"created_at"` | `"total_comments"` | `"positive_percentage"`)
  - `sortOrder` (`"asc"` | `"desc"`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "post_id": 1,
        "status": "completed",
        "total_comments": 240,
        "positive_percentage": "65.50",
        "neutral_percentage": "20.00",
        "negative_percentage": "14.50",
        "platform": "instagram",
        "url": "https://www.instagram.com/p/example",
        "created_at": "2026-10-15T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

#### `GET /api/analyses/:id`
Mendapatkan informasi detail analisis tunggal termasuk statistik lengkap, daftar kata kunci, topik, dan *generated insight*.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "status": "completed",
      "total_comments": 240,
      "positive_count": 157,
      "neutral_count": 48,
      "negative_count": 35,
      "positive_percentage": "65.42",
      "neutral_percentage": "20.00",
      "negative_percentage": "14.58",
      "generated_insight": {
        "overall": "Dari total 240 komentar yang dianalisis, sentimen positif mendominasi...",
        "positive": "Sebanyak 157 komentar bersifat positif...",
        "negative": "Sebanyak 35 komentar bersifat negatif...",
        "topics": "Topik yang paling banyak dibicarakan adalah: Pelayanan, Kualitas...",
        "recommendation": "Perlu perhatian lebih lanjut (14.58% komentar negatif)..."
      },
      "keywords": [
        { "keyword": "pelayanan cepat", "frequency": 42, "percentage": "17.50" }
      ],
      "topics": [
        { "topic": "Pelayanan", "frequency": 98, "percentage": "40.83" }
      ]
    }
  }
  ```

#### `GET /api/analyses/:id/comments`
Mengambil data komentar perorangan pada analisis terkait.
- **Query Parameters**: `page`, `limit`, `sentiment` (`positive`/`neutral`/`negative`), `search`, `sortBy`, `sortOrder`.

#### `POST /api/analyses/:id/reanalyze`
Menjalankan ulang seluruh pipeline NLP dari data komentar yang sudah ada di basis data.
- **Response (202 Accepted)**: `{"success": true, "message": "Re-analysis started successfully."}`

#### `DELETE /api/analyses/:id`
Menghapus analisis beserta rekaman kata kunci dan topiknya. Jika analisis yang dihapus merupakan versi terbaru (`is_latest = true`), analisis sebelumnya akan dipromosikan menjadi versi terbaru secara otomatis.

---

### 4. Dasbor Agregat (`/api/dashboard`)

Semua endpoint berikut mendukung filter opsional melalui query parameter `platform`, `dateFrom`, dan `dateTo`:

- `GET /api/dashboard/summary` — Menghitung total analisis, total postingan, total komentar, serta breakdown jumlah sentimen agregat.
- `GET /api/dashboard/sentiment` — Persentase dan jumlah sentimen positif, netral, dan negatif.
- `GET /api/dashboard/trends` — Data tren agregasi sentimen harian (`DATE_TRUNC('day', created_at)`).
- `GET /api/dashboard/topics?limit=10` — Daftar topik yang paling sering muncul lintas analisis.
- `GET /api/dashboard/keywords?limit=10` — Daftar kata kunci teratas lintas analisis.
- `GET /api/dashboard/platform` — Rasio perbandingan volume postingan per platform (Instagram vs TikTok).
- `GET /api/dashboard/recent?limit=5` — Daftar rekaman analisis terbaru yang telah diselesaikan.

---

### 5. API ML Service (`POST http://localhost:8000/analyze`)

Endpoint internal yang dipanggil oleh backend untuk menjalankan inferensi AI:
- **Request Body**:
  ```json
  {
    "comments": [
      "Pelayanannya sangat memuaskan dan cepat!",
      "Pengiriman barang terlambat 3 hari, tolong diperbaiki."
    ]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "comments": [
      {
        "text": "Pelayanannya sangat memuaskan dan cepat!",
        "processed_text": "pelayanannya sangat memuaskan dan cepat",
        "sentiment": "positive",
        "score": 0.9982,
        "topic": "Pelayanan"
      },
      {
        "text": "Pengiriman barang terlambat 3 hari, tolong diperbaiki.",
        "processed_text": "pengiriman barang terlambat hari tolong diperbaiki",
        "sentiment": "negative",
        "score": 0.9845,
        "topic": "Pengiriman"
      }
    ],
    "keywords": [
      { "keyword": "pelayanan", "frequency": 1, "percentage": 50.0 },
      { "keyword": "pengiriman", "frequency": 1, "percentage": 50.0 }
    ],
    "topics": [
      { "topic": "Pelayanan", "frequency": 1, "percentage": 50.0 },
      { "topic": "Pengiriman", "frequency": 1, "percentage": 50.0 }
    ],
    "insight": {
      "overall": "Dari total 2 komentar yang dianalisis...",
      "positive": "Sebanyak 1 komentar bersifat positif...",
      "negative": "Sebanyak 1 komentar bersifat negatif...",
      "topics": "Topik yang paling banyak dibicarakan adalah: Pelayanan, Pengiriman.",
      "recommendation": "Perhatian diperlukan..."
    }
  }
  ```

---

## Dokumentasi Database

Basis data menggunakan PostgreSQL dengan skema relasional yang didefinisikan dalam berkas migrasi `database/migrations/`:

### Diagram Entitas Relasi (ERD)

```mermaid
erDiagram
    POSTS ||--o{ ANALYSES : "has many"
    POSTS ||--o{ COMMENTS : "contains"
    ANALYSES ||--o{ COMMENTS : "classifies"
    ANALYSES ||--o{ KEYWORDS : "extracts"
    ANALYSES ||--o{ TOPICS : "categorizes"

    POSTS {
        int id PK
        varchar platform "instagram | tiktok"
        varchar platform_post_id "UK (platform, platform_post_id)"
        text url
        varchar author
        text caption
        timestamptz published_at
        int like_count
        int comment_count
        text thumbnail_url
        varchar import_source "default: csv"
        varchar imported_filename
        timestamptz created_at
        timestamptz updated_at
    }

    ANALYSES {
        int id PK
        int post_id FK "REFERENCES posts(id) ON DELETE CASCADE"
        varchar status "pending | fetching | processing | completed | failed"
        text error_message
        timestamptz fetched_at
        int total_comments
        int positive_count
        int neutral_count
        int negative_count
        numeric positive_percentage
        numeric neutral_percentage
        numeric negative_percentage
        jsonb generated_insight
        boolean is_latest "default: true"
        timestamptz created_at
        timestamptz updated_at
    }

    COMMENTS {
        int id PK
        int post_id FK "REFERENCES posts(id) ON DELETE CASCADE"
        int analysis_id FK "REFERENCES analyses(id) ON DELETE SET NULL"
        varchar platform_comment_id
        varchar username
        text raw_text
        text processed_text
        timestamptz published_at
        int like_count
        varchar sentiment "positive | neutral | negative"
        numeric sentiment_score
        varchar topic
        boolean is_skipped "default: false"
        varchar skip_reason "empty_text | duplicate_id"
        timestamptz created_at
        timestamptz updated_at
    }

    KEYWORDS {
        int id PK
        int analysis_id FK "REFERENCES analyses(id) ON DELETE CASCADE"
        varchar keyword
        int frequency
        numeric percentage
        timestamptz created_at
    }

    TOPICS {
        int id PK
        int analysis_id FK "REFERENCES analyses(id) ON DELETE CASCADE"
        varchar topic
        int frequency
        numeric percentage
        timestamptz created_at
    }
```

### Tabel Pelacak Migrasi (`_migrations`)
Dikelola secara otomatis oleh skrip `backend/src/scripts/migrate.js` untuk memastikan setiap skrip SQL hanya dijalankan tepat satu kali:
- `id` (SERIAL PRIMARY KEY)
- `filename` (VARCHAR(255) UNIQUE NOT NULL)
- `applied_at` (TIMESTAMPTZ DEFAULT NOW())

---

## Dokumentasi Machine Learning & NLP

Pipeline NLP diimplementasikan secara terisolasi pada direktori `ml-service/`:

### 1. Model Analisis Sentimen (IndoBERT)
- **Tipe Model**: *Transformer* dua arah (*bidirectional*) berbasis arsitektur BERT (`BertForSequenceClassification`).
- **Lokasi Bobot**: Disimpan secara lokal pada direktori `ml-service/my-indobert-sentiment/` dalam format aman `model.safetensors` (~497 MB).
- **Spesifikasi Arsitektur**:
  - `hidden_size`: 768
  - `num_hidden_layers`: 12
  - `num_attention_heads`: 12
  - `intermediate_size`: 3072
  - `vocab_size`: 50.000 token
  - `max_position_embeddings`: 512 token
- **Kelas Label**:
  - `0`: `"negatif"` $\rightarrow$ dipetakan ke `"negative"`
  - `1`: `"netral"` $\rightarrow$ dipetakan ke `"neutral"`
  - `2`: `"positif"` $\rightarrow$ dipetakan ke `"positive"`
- **Mekanisme Fallback**: Apabila model lokal gagal dimuat, sistem memiliki *fallback* terprogram ke model Hugging Face:  
  `lxyuan/distilbert-base-multilingual-cased-sentiments-student`.
- **Eksekusi Batch**: Inferensi sentimen dijalankan dengan ukuran *batch* 32 untuk mencegah kehabisan memori (*Out Of Memory* / OOM).

### 2. Pra-pemrosesan Teks (*Preprocessing Pipeline*)
Dijalankan oleh fungsi `preprocess()` pada `preprocessor.py` dengan tahapan berurutan:
1. **Pembersihan URL**: Menghapus tautan web berawalan `http://`, `https://`, atau `www.`.
2. **Pembersihan Mention**: Menghapus pola akun `@username`.
3. **Normalisasi Hashtag**: Menghapus tanda pagar `#` namun tetap mempertahankan kata di dalamnya (`#keren` $\rightarrow$ `keren`).
4. **Pembersihan Emoji**: Menghapus karakter emoji berdasar kategori Unicode `So` (*Symbol, other*).
5. **Normalisasi Pengulangan Karakter**: Mereduksi huruf yang diketik berulang secara berlebihan (`bagussss` $\rightarrow$ `baguss`).
6. **Case Folding & Spasi**: Mengubah seluruh teks menjadi huruf kecil (*lowercase*) dan memadatkan multi-spasi menjadi spasi tunggal.

### 3. Pemodelan Topik (*Topic Modeling*)
1. Jika jumlah komentar valid $\ge 15$, sistem menjalankan model **BERTopic**:
   - Model *embedding*: `paraphrase-multilingual-MiniLM-L12-v2`.
   - Vektorisasi: `CountVectorizer(ngram_range=(1, 2))`.
   - Jumlah topik dinamis: $\min(8, \max(2, N / 5))$.
   - Kluster kata kunci hasil BERTopic kemudian dicocokkan kembali ke 8 kategori utama menggunakan kemiripan leksikal kata.
2. Jika jumlah komentar $< 15$ atau BERTopic mengalami kegagalan, sistem mengaktifkan *fallback* pencocokan berbasis kata kunci (*keyword-based topic classification*) ke kategori:
   - **Pelayanan**: aduan layanan, staf, respon, CS, dll.
   - **Harga**: mahal, murah, biaya, tarif, diskon, promo, dll.
   - **Kualitas**: mutu, bahan, bagus, rusak, material, dll.
   - **Pengiriman**: ekspedisi, kurir, lama, lambat, cepat, dll.
   - **Kemasan**: packing, bungkus, kardus, bocor, dll.
   - **Informasi**: panduan, tutorial, deskripsi, detail, dll.
   - **Fasilitas**: gedung, parkir, ruang, tempat, lokasi, dll.
   - **Konten**: video, foto, audio, visual kreatif, dll.
   - **Umum**: komentar yang tidak masuk dalam kluster di atas.

### 4. Ekstraksi Kata Kunci (*TF-IDF & N-Gram*)
Dijalankan oleh `extract_keywords()` pada `keywords.py`:
- Memecah teks menjadi unigram dan bigram setelah membuang kata henti (*stopwords*) Bahasa Indonesia (daftar terintegrasi berbasis Sastrawi).
- Menghitung frekuensi kemunculan unigram dan bigram. Bigram yang muncul minimal 2 kali diprioritaskan dibandingkan unigram penyusunnya jika memiliki korelasi frekuensi kuat.
- Mengembalikan 20 kata kunci teratas beserta persentase kontribusinya terhadap total kemunculan.

### 5. Pembangkit Insight Deterministik (*Insight Generator*)
Dijalankan oleh `generate_insight()` pada `insight.py`:
- Menyusun teks wawasan naratif (*narrative insight*) menggunakan aturan deterministik berbasis data riil tanpa melibatkan LLM generatif bebas sehingga **100% bebas halusinasi**.
- Menghitung sentimen dominan dan membuat ringkasan rasio.
- Menemukan kata kunci yang paling sering berkolokasi dengan komentar positif maupun negatif.
- Memberikan rekomendasi penanganan otomatis berdasar tingkat keparahan (*persentase sentimen negatif*):
  - $> 30\%$: *"Perhatian diperlukan secara mendesak"*.
  - $> 15\%$: *"Perlu perhatian lebih lanjut"*.
  - $\le 15\%$: *"Perhatikan beberapa keluhan berikut"*.
  - $0\%$: *"Pertahankan performa saat ini"*.

---

## Kinerja & Evaluasi Model

- Model inferensi sentimen menggunakan bobot *checkpoint* lokal IndoBERT yang telah di-*finetune* untuk klasifikasi 3 label (`negatif`, `netral`, `positif`).
- Berkas bobot model tersimpan dalam format modern Hugging Face `model.safetensors` dengan ukuran ~497 MB.
- *Catatan Transparansi Evaluasi*: Repositori ini menyediakan bobot model siap pakai (*inference-ready checkpoints*). Namun, riwayat catatan pelatihan awal (*training log*) dan metrik eksperimen komparatif (seperti skor F1-score atau Confusion Matrix dari dataset latih) tidak disertakan di dalam repositori ini.

---

## Batasan Sistem

1. **Penyimpanan Token Impor Sementara (*In-Memory Store*)**: Sesi pratinjau CSV disimpan dalam `Map` di memori backend dengan TTL 10 menit. Jika server backend di-*restart* sebelum pengguna menekan tombol konfirmasi, berkas CSV harus diunggah ulang.
2. **Kapasitas Pemrosesan per Impor**: Jumlah komentar maksimal yang diizinkan untuk diproses per permintaan adalah 5.000 komentar pada ML Service dan 10.000 baris pada CsvImportService, dengan batas ukuran berkas 10 MB.
3. **Model Autentikasi Pengguna**: Sistem saat ini menerapkan model *single-admin password* (kata sandi tunggal yang disimpan di variabel lingkungan) dan belum mengimplementasikan sistem multi-user atau registrasi akun publik.
4. **Dependensi Memori Layanan AI**: Karena memuat model BERT dan Sentence-Transformers secara simultan ke dalam RAM/VRAM, proses *startup* awal ML Service membutuhkan waktu beberapa detik dan alokasi memori yang cukup.

---

## Rencana Pengembangan Mendatang

- [ ] Dukungan ekspor laporan hasil analisis ke format PDF dan Excel (.xlsx).
- [ ] Penambahan fitur manajemen *multi-user* dengan *Role-Based Access Control* (Admin, Analis, Viewer).
- [ ] Penggunaan Redis untuk penyimpanan *token session* impor dan antrean tugas *background job* (seperti BullMQ atau Celery).
- [ ] Integrasi scraping langsung via konektor resmi Social Media Graph API (Instagram Graph API & TikTok for Developers).
- [ ] Peningkatan model sentimen dengan penambahan analisis aspek (*Aspect-Based Sentiment Analysis* / ABSA).
- [ ] Penambahan pengujian unit (*Unit Testing*) dan *End-to-End Testing* otomatis pada CI/CD pipeline.

---

## Panduan Kontribusi

Kontribusi pada repositori ini sangat terbuka untuk penyempurnaan fitur dan perbaikan *bug*. Silakan ikuti panduan berikut:

1. **Fork** repositori ini ke akun GitHub Anda.
2. Buat *branch* fitur baru dari *branch* utama (`main`):
   ```bash
   git checkout -b fitur/nama-fitur-baru
   ```
3. Lakukan perubahan kode dengan tetap mempertahankan konsistensi gaya penulisan (*coding style*) dan dokumentasi fungsi.
4. Pastikan tidak ada berkas konfigurasi rahasia (`.env`) atau bobot berukuran besar yang tidak sengaja ter-*commit*.
5. Lakukan *commit* dengan pesan yang deskriptif:
   ```bash
   git commit -m "feat: tambah fitur ekspor laporan ke format PDF"
   ```
6. Dorong (*push*) perubahan ke repositori fork Anda:
   ```bash
   git push origin fitur/nama-fitur-baru
   ```
7. Buat **Pull Request (PR)** baru pada repositori utama dan jelaskan secara singkat perubahan yang Anda lakukan.

---

## Lisensi

Repositori ini saat ini belum menyertakan berkas lisensi sumber terbuka resmi (*No specified license / All rights reserved*). Hak cipta kode sepenuhnya berada pada pemilik repositori. Penggunaan, modifikasi, atau pendistribusian ulang untuk kepentingan komersial wajib meminta izin tertulis dari pengelola repositori.

---

## Penulis & Pengelola

- **Pengembang Utama**: Farhan Bagas ([@farhanrbagask](https://github.com/farhanrbagask))
- **Email Kontak**: [farhanbagask@gmail.com](mailto:farhanbagask@gmail.com)
- **Repositori Resmi**: [https://github.com/farhanrbagask/media-comment-insight-analyzer](https://github.com/farhanrbagask/media-comment-insight-analyzer)
