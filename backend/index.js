require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Supaya backend bisa membaca data JSON yang dikirim dari frontend dengan limit besar
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. Konfigurasi Koneksi ke Database MySQL
// Hubungkan ke host terlebih dahulu untuk memastikan database dibuat otomatis jika belum ada (untuk localhost)
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'data_artikel_db';

const connectionConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    // Jika ada database name di env (seperti di Railway), langsung hubungkan
    database: (process.env.DB_NAME || process.env.MYSQLDATABASE) ? dbName : undefined
};

let db;

const useSQLite = !process.env.DB_HOST && !process.env.MYSQLHOST;

if (useSQLite) {
    console.log('MySQL host tidak terkonfigurasi. Menggunakan database SQLite...');
    const sqlite3 = require('sqlite3').verbose();
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.resolve(__dirname, './data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    const isVercel = !!process.env.VERCEL;
    const dbPath = isVercel ? '/tmp/database.sqlite' : path.join(dataDir, 'database.sqlite');
    console.log(`Menghubungkan SQLite ke path: ${dbPath}`);
    const sqliteDb = new sqlite3.Database(dbPath);

    db = {
        query: (sql, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }

            // Bersihkan SQL dari sintaks spesifik MySQL agar cocok dengan SQLite
            let cleanSql = sql.replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4/gi, '')
                              .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
                              .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
                              .replace(/LONGTEXT/gi, 'TEXT')
                              .replace(/VARCHAR\(\d+\)/gi, 'TEXT');

            const isSelect = cleanSql.trim().toLowerCase().startsWith('select') || 
                             cleanSql.trim().toLowerCase().startsWith('show') || 
                             cleanSql.trim().toLowerCase().startsWith('desc') ||
                             cleanSql.trim().toLowerCase().startsWith('explain');

            if (isSelect) {
                sqliteDb.all(cleanSql, params, (err, rows) => {
                    if (err) callback(err);
                    else callback(null, rows);
                });
            } else {
                sqliteDb.run(cleanSql, params, function(err) {
                    if (err) callback(err);
                    else {
                        callback(null, {
                            affectedRows: this.changes,
                            insertId: this.lastID,
                            changes: this.changes
                        });
                    }
                });
            }
        },
        on: (event, handler) => {}
    };

    // Setup SQLite Tables
    const setupSQLite = () => {
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS artikel (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                judul TEXT NOT NULL,
                konten TEXT NOT NULL,
                gambar TEXT DEFAULT NULL,
                lat TEXT DEFAULT NULL,
                lon TEXT DEFAULT NULL,
                tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        db.query(createTableSql, [], (err) => {
            if (err) {
                console.error("Gagal membuat tabel SQLite:", err);
                return;
            }
            console.log("Tabel SQLite 'artikel' terverifikasi.");

            // Dummy data check
            db.query("SELECT COUNT(*) AS count FROM artikel", [], (err, results) => {
                if (err) return;
                const count = results[0] ? (results[0].count || results[0]['COUNT(*)'] || 0) : 0;
                if (count === 0) {
                    const insertDummySql = `
                        INSERT INTO artikel (judul, konten) VALUES
                        ('Pengenalan Pemrograman Web', 'Pemrograman Web adalah proses pembuatan aplikasi berbasis web yang diakses menggunakan internet. Bagian Frontend berfokus pada tampilan pengguna menggunakan HTML, CSS, dan JavaScript, sementara Backend berfokus pada logika server dan database.'),
                        ('Belajar Async Javascript', 'Async JavaScript adalah teknik penulisan kode JavaScript di mana tugas dapat berjalan secara paralel tanpa menghalangi proses lain. Konsep utamanya meliputi Callback, Promises, dan Async/Await, yang sangat membantu dalam mengoptimalkan performa aplikasi.'),
                        ('Membuat API dengan Express.js', 'Express.js adalah framework web minimalis dan fleksibel untuk Node.js. Dengan Express, kita bisa dengan mudah membuat REST API yang aman, cepat, dan terorganisir untuk dikonsumsi oleh aplikasi Frontend.');
                    `;
                    db.query(insertDummySql, [], (err) => {
                        if (err) console.error("Gagal memasukkan data sampel SQLite:", err);
                        else console.log("Data sampel SQLite berhasil dimasukkan.");
                    });
                }
            });
        });
    };
    setupSQLite();

} else {
    // Jalankan MySQL jika terkonfigurasi
    function handleDisconnect() {
        db = mysql.createConnection(connectionConfig);

        db.connect((err) => {
            if (err) {
                console.error('Koneksi MySQL gagal: ' + err.stack);
                setTimeout(handleDisconnect, 2000); // Coba lagi dalam 2 detik
                return;
            }
            console.log('Koneksi ke server MySQL berhasil!');

            const setupTables = () => {
                const createTableSql = `
                    CREATE TABLE IF NOT EXISTS artikel (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        judul VARCHAR(255) NOT NULL,
                        konten TEXT NOT NULL,
                        gambar LONGTEXT DEFAULT NULL,
                        lat VARCHAR(50) DEFAULT NULL,
                        lon VARCHAR(50) DEFAULT NULL,
                        tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                `;

                db.query(createTableSql, (err) => {
                    if (err) {
                        console.error("Gagal membuat tabel:", err);
                        return;
                    }
                    console.log("Tabel 'artikel' terverifikasi.");

                    db.query("SHOW COLUMNS FROM artikel LIKE 'gambar'", (showErr, showResults) => {
                        if (showErr) return;
                        if (!showResults || showResults.length === 0) {
                            db.query("ALTER TABLE artikel ADD COLUMN gambar LONGTEXT DEFAULT NULL", (alterErr) => {});
                        }
                    });

                    db.query("SHOW COLUMNS FROM artikel LIKE 'lat'", (showErr, showResults) => {
                        if (showErr) return;
                        if (!showResults || showResults.length === 0) {
                            db.query("ALTER TABLE artikel ADD COLUMN lat VARCHAR(50) DEFAULT NULL, ADD COLUMN lon VARCHAR(50) DEFAULT NULL", (alterErr) => {});
                        }
                    });

                    db.query("SELECT COUNT(*) AS count FROM artikel", (err, results) => {
                        if (err) return;
                        if (results[0] && results[0].count === 0) {
                            const insertDummySql = `
                                INSERT INTO artikel (judul, konten) VALUES
                                ('Pengenalan Pemrograman Web', 'Pemrograman Web adalah proses pembuatan aplikasi berbasis web yang diakses menggunakan internet. Bagian Frontend berfokus pada tampilan pengguna menggunakan HTML, CSS, dan JavaScript, sementara Backend berfokus pada logika server dan database.'),
                                ('Belajar Async Javascript', 'Async JavaScript adalah teknik penulisan kode JavaScript di mana tugas dapat berjalan secara paralel tanpa menghalangi proses lain. Konsep utamanya meliputi Callback, Promises, dan Async/Await, yang sangat membantu dalam mengoptimalkan performa aplikasi.'),
                                ('Membuat API dengan Express.js', 'Express.js adalah framework web minimalis dan fleksibel untuk Node.js. Dengan Express, kita bisa dengan mudah membuat REST API yang aman, cepat, dan terorganisir untuk dikonsumsi oleh aplikasi Frontend.');
                            `;
                            db.query(insertDummySql, (err) => {});
                        }
                    });
                });
            };

            if (connectionConfig.database) {
                setupTables();
            } else {
                db.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
                    if (err) return;
                    db.query(`USE \`${dbName}\``, (err) => {
                        if (err) return;
                        setupTables();
                    });
                });
            }
        });

        db.on('error', (err) => {
            console.error('Database connection error:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
                handleDisconnect();
            }
        });
    }

    handleDisconnect();
}

// 2. DASHBOARD STATS: Mengambil statistik artikel (Total artikel dan judul artikel terbaru)
// Catatan: Route ini harus didaftarkan SEBELUM route dinamis lainnya agar tidak terganggu
app.get('/api/artikel/stats', (req, res) => {
    const sqlTotal = "SELECT COUNT(*) AS total FROM artikel";
    db.query(sqlTotal, (err, resultsTotal) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        const total = resultsTotal[0].total;

        const sqlTerbaru = "SELECT judul FROM artikel ORDER BY id DESC LIMIT 1";
        db.query(sqlTerbaru, (err, resultsTerbaru) => {
            if (err) return res.status(500).json({ status: "error", message: err.message });
            const terbaru = resultsTerbaru[0] ? resultsTerbaru[0].judul : "-";
            res.json({
                status: "success",
                data: {
                    total: total,
                    terbaru: terbaru
                }
            });
        });
    });
});

// 3. READ: Mengambil semua artikel dari database, dengan dukungan pencarian (?search=keyword)
app.get('/api/artikel', (req, res) => {
    const { search } = req.query;
    let sql = "SELECT * FROM artikel";
    const params = [];

    if (search) {
        sql += " WHERE judul LIKE ? OR konten LIKE ?";
        const keyword = `%${search}%`;
        params.push(keyword, keyword);
    }

    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.json(results);
    });
});

// 4. CREATE & UPDATE: Menyimpan atau Memperbarui artikel
app.post('/api/artikel', (req, res) => {
    const { id, judul, konten, gambar, lat, lon } = req.body;

    if (!judul || !konten) {
        return res.status(400).json({ status: "error", message: "Judul dan konten diperlukan" });
    }

    const gambarValue = gambar || '';

    if (id) {
        // Jika data mengirimkan ID -> Lakukan UPDATE (Edit)
        const sql = "UPDATE artikel SET judul = ?, konten = ?, gambar = ?, lat = ?, lon = ? WHERE id = ?";
        db.query(sql, [judul, konten, gambarValue, lat || null, lon || null, id], (err, result) => {
            if (err) return res.status(500).json({ status: "error", message: err.message });
            res.json({ status: "success", message: "Artikel berhasil diperbarui" });
        });
    } else {
        // Jika tidak ada ID -> Lakukan INSERT (Tambah Baru)
        const sql = "INSERT INTO artikel (judul, konten, gambar, lat, lon) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [judul, konten, gambarValue, lat || null, lon || null], (err, result) => {
            if (err) return res.status(500).json({ status: "error", message: err.message });
            res.json({ status: "success", message: "Artikel berhasil ditambahkan" });
        });
    }
});

// 5. DELETE: Menghapus artikel berdasarkan ID
app.delete('/api/artikel/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM artikel WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Artikel tidak ditemukan" });
        }
        res.json({ status: "success", message: "Artikel berhasil dihapus" });
    });
});

// Mount Push API routes
const pushRoutes = require('./routes/push');
app.use('/api/push', pushRoutes);

// Serve static files from built frontend output directory
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/profile.html')));

// Fallback to profile.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/profile.html/profile.html'));
});

// Jalankan server Node.js di port 3000
app.listen(3000, () => {
    console.log('Server backend berjalan di http://localhost:3000');
});