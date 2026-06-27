-- SQL Dump untuk setup data_artikel_db
-- Silakan impor file ini di phpMyAdmin (http://localhost/phpmyadmin)

CREATE DATABASE IF NOT EXISTS `data_artikel_db`;
USE `data_artikel_db`;

-- Struktur dari tabel `artikel`
CREATE TABLE IF NOT EXISTS `artikel` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `judul` VARCHAR(255) NOT NULL,
  `konten` TEXT NOT NULL,
  `gambar` LONGTEXT DEFAULT NULL,
  `tanggal` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data sampel untuk tabel `artikel`
INSERT INTO `artikel` (`judul`, `konten`) VALUES
('Pengenalan Pemrograman Web', 'Pemrograman Web adalah proses pembuatan aplikasi berbasis web yang diakses menggunakan internet. Bagian Frontend berfokus pada tampilan pengguna menggunakan HTML, CSS, dan JavaScript, sementara Backend berfokus pada logika server dan database.'),
('Belajar Async Javascript', 'Async JavaScript adalah teknik penulisan kode JavaScript di mana tugas dapat berjalan secara paralel tanpa menghalangi proses lain. Konsep utamanya meliputi Callback, Promises, dan Async/Await, yang sangat membantu dalam mengoptimalkan performa aplikasi.'),
('Membuat API dengan Express.js', 'Express.js adalah framework web minimalis dan fleksibel untuk Node.js. Dengan Express, kita bisa dengan mudah membuat REST API yang aman, cepat, dan terorganisir untuk dikonsumsi oleh aplikasi Frontend.');
