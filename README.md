# Praktikum Pemrograman Web

**Departemen Teknologi Informasi - 2025**

## Anggota Kelompok A06

| Nama                     | NRP        |
| ------------------------ | ---------- |
| Muhammad Hugo Rayandra E | 5027251076 |
| Hasheemi Rafsanjani      | 5027251015 |
| Syarifah Nailatur Rohma  | 5027251109 |

## Deskripsi Singkat

Sebuah website manajemen antrian pasien rumah sakit dengan beberapa role, ada pasien, operator
(bagian memanggil pasien) dan admin sebagai yang memiliki role tertinggi dan bisa untuk menerbitkan
antrean baru. Website dibuat dengan HTML CSS JS + TS dengan tempat penyimpanan masih pada
localstorage. Dengan route yang terproteksi, alur yang jelas , data terintegrasi dan tampilan yang
clean, ramah pengguna

## Struktur Folder

```text
.
├── README.md
├── ambil-antrian.html
├── dist
│   ├── admin.js
│   ├── ambil-antrian.js
│   ├── layar.js
│   ├── login.js
│   ├── operator.js
│   ├── shared.js
│   └── speech.js
├── index.html
├── landing.html
├── layar.html
├── login.html
├── operator.html
├── package-lock.json
├── package.json
├── src
│   ├── admin.ts
│   ├── ambil-antrian.ts
│   ├── layar.ts
│   ├── login.ts
│   ├── operator.ts
│   ├── shared.ts
│   └── speech.ts
├── styles.css
├── tsconfig.json
└── vercel.json
```

## Halaman Website

- **login.html** Halaman login dengan support multi role, bisa untuk login pasien, operator dan
  admin

- **index.html** Halaman khusus untuk role admin , berisi penerbitan tiket manual, persetujuan tiket
  dan pembuatan antrian baru ataupun dokter baru

- **operator.html** Halaman khusus untuk role operator, berfungsi memanggil atau approve pasien
  sesuai urutan nya dan prioritasnya

- **layar.html** display layar yang biasanya ditampilan di monitor klinik/rs

- **ambil-antrian.html** tempat untuk role pasien/user biasa bisa mengambil antrian secara online
  dan untuk monitor apakah sudah dipanggil atau belum dengan bantuan teks pesan dan juga suara

## Teknologi

Website ini dibuat menggunakan:

- HTML5
- CSS3
- JavaScript
- TypeScript

## Deployment

Website telah di-deploy menggunakan Vercel dan dapat diakses melalui:

**https://rsmg-pweba06.vercel.app/**
