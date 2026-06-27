import { useState, useEffect, useRef } from 'react';
import CameraEmbed from './CameraEmbed';

function Cms({ isLoggedIn, onLogout, showToast }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [articles, setArticles] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stats, setStats] = useState({ total: 0, terbaru: '-' });

  // Form states
  const [judul, setJudul] = useState('');
  const [konten, setKonten] = useState('');
  const [gambar, setGambar] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Geolocation states
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [geoStatus, setGeoStatus] = useState('off'); // 'off', 'searching', 'ok', 'failed'

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Fetch articles list
  const fetchArticles = (search = '') => {
    const apiBase = window.location.port === '5000' ? 'http://localhost:3000' : '';
    let url = `${apiBase}/api/artikel`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setArticles(data))
      .catch((err) => console.warn('Failed to load articles:', err));
  };

  // Fetch dashboard stats
  const fetchStats = () => {
    const apiBase = window.location.port === '5000' ? 'http://localhost:3000' : '';
    fetch(`${apiBase}/api/artikel/stats`)
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.status === 'success') {
          setStats(resJson.data);
        }
      })
      .catch((err) => console.warn('Failed to load stats:', err));
  };

  // Initial load
  useEffect(() => {
    fetchArticles();
    fetchStats();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchArticles(searchKeyword);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchKeyword]);

  // Leaflet Map integration
  useEffect(() => {
    if (activeSection === 'overview' && mapContainerRef.current) {
      // Destroy existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map dynamically
      import('../utils/map.js')
        .then(({ createMap, photoIcon }) => {
          const defaultCenter = [-7.447, 109.236];
          createMap(mapContainerRef.current, { center: defaultCenter, zoom: 10 })
            .then((map) => {
              mapInstanceRef.current = map;

              // Filter articles with valid coordinates
              const validArticles = articles.filter((a) => {
                const lat = parseFloat(a.lat || a.latitude);
                const lon = parseFloat(a.lon || a.longitude);
                return !isNaN(lat) && !isNaN(lon);
              });

              if (validArticles.length > 0) {
                const markers = [];
                validArticles.forEach((item) => {
                  const lat = parseFloat(item.lat || item.latitude);
                  const lon = parseFloat(item.lon || item.longitude);
                  
                  const marker = window.L.marker([lat, lon], { icon: photoIcon() }).addTo(map);

                  const popupHtml = `
                    <div class="map-popup">
                      <h4 class="map-popup_title" style="margin: 0 0 4px 0; font-family: 'Poppins', sans-serif; font-weight: bold; color: #3A302E;">${item.judul}</h4>
                      ${
                        item.gambar
                          ? `<img src="${item.gambar}" class="map-popup_img" style="width: 100%; max-height: 100px; object-fit: cover; border-radius: 6px; margin-top: 4px; display: block;">`
                          : ''
                      }
                      <p style="margin: 6px 0 0 0; font-size: 11px; color: #555; line-height: 1.4;">${item.konten.substring(
                        0,
                        75
                      )}...</p>
                    </div>
                  `;
                  marker.bindPopup(popupHtml);
                  markers.push([lat, lon]);
                });

                if (markers.length > 0) {
                  try {
                    map.fitBounds(markers, { padding: [35, 35] });
                  } catch (e) {
                    console.warn('Failed to fit bounds:', e);
                  }
                }
              }

              // Invalidate size to load all tiles correctly
              setTimeout(() => {
                map.invalidateSize();
              }, 150);
            })
            .catch((err) => {
              console.warn('Map initialization error:', err);
            });
        })
        .catch((err) => console.error('Failed to load map module:', err));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeSection, articles]);

  // Capture Geolocation coords
  const captureLocation = async () => {
    setGeoStatus('searching');
    try {
      const { getCurrentCoords } = await import('../utils/geo.js');
      const position = await getCurrentCoords();
      if (position) {
        setCoords({ lat: position.lat, lon: position.lng });
        setGeoStatus('ok');
      } else {
        setGeoStatus('failed');
      }
    } catch (err) {
      console.warn(err);
      setGeoStatus('failed');
    }
  };

  // Trigger geo capture when switching to management (only if not editing an existing article)
  useEffect(() => {
    if (activeSection === 'manajemen' && !editingId) {
      captureLocation();
    }
  }, [activeSection, editingId]);

  // Reset form helper
  const resetForm = () => {
    setJudul('');
    setKonten('');
    setGambar('');
    setEditingId(null);
    setCoords({ lat: null, lon: null });
    setGeoStatus('off');
  };

  // Submit article
  const handleSaveArticle = (e) => {
    e.preventDefault();
    if (!judul || !konten) {
      showToast('Judul dan isi artikel tidak boleh kosong!', 'error');
      return;
    }

    const payload = {
      judul,
      konten,
      gambar: gambar || '',
      lat: coords.lat,
      lon: coords.lon,
    };

    if (editingId) {
      payload.id = editingId;
    }

    const apiBase = window.location.port === '5000' ? 'http://localhost:3000' : '';
    fetch(`${apiBase}/api/artikel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success') {
          showToast(result.message, 'success');
          resetForm();
          fetchStats();
          fetchArticles();
          // Redirect to overview
          setActiveSection('overview');
        } else {
          showToast(result.message || 'Gagal menyimpan artikel', 'error');
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Terjadi kesalahan koneksi server.', 'error');
      });
  };

  // Delete article
  const handleDeleteArticle = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      const apiBase = window.location.port === '5000' ? 'http://localhost:3000' : '';
      fetch(`${apiBase}/api/artikel/${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.status === 'success') {
            showToast(result.message, 'success');
            fetchStats();
            fetchArticles();
          } else {
            showToast(result.message || 'Gagal menghapus.', 'error');
          }
        })
        .catch((err) => {
          console.error(err);
          showToast('Error server.', 'error');
        });
    }
  };

  // Prepare edit article
  const handleEditClick = (article) => {
    setEditingId(article.id);
    setJudul(article.judul);
    setKonten(article.konten);
    setGambar(article.gambar || '');
    if (article.lat && article.lon) {
      setCoords({ lat: article.lat, lon: article.lon });
      setGeoStatus('ok');
    } else {
      setCoords({ lat: null, lon: null });
      setGeoStatus('off');
    }
    setActiveSection('manajemen');
  };

  // Copy coordinates to clipboard
  const handleCopyCoords = (lat, lon) => {
    navigator.clipboard
      .writeText(`${lat}, ${lon}`)
      .then(() => showToast('Koordinat berhasil disalin!', 'success'))
      .catch(() => showToast('Gagal menyalin koordinat.', 'error'));
  };

  return (
    <div className="cms-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <h2>Content Management System</h2>
            <p>Admin Panel</p>
          </div>

          <nav className="cms-menu">
            <button
              type="button"
              className={`menu-link ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              📊 Dashboard Overview
            </button>
            <a href="#/" className="menu-link">
              👁️ Lihat Profil / Web
            </a>
            <button
              type="button"
              className={`menu-link ${activeSection === 'manajemen' ? 'active' : ''}`}
              onClick={() => setActiveSection('manajemen')}
            >
              📝 Manajemen Artikel
            </button>
            <button
              type="button"
              className={`menu-link ${activeSection === 'riwayat' ? 'active' : ''}`}
              onClick={() => setActiveSection('riwayat')}
            >
              🕒 Riwayat Artikel
            </button>
          </nav>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="cms-main">
        <section className="cms-topbar">
          <p className="eyebrow">Panel Kontrol</p>
          <h1>Dashboard Konten</h1>
          <p className="subtext">
            Kelola artikel, kamera web, dan riwayat publikasi dalam tampilan admin yang elegan.
          </p>
        </section>

        {/* SECTION: OVERVIEW */}
        {activeSection === 'overview' && (
          <section id="section-overview" className="cms-section cms-section--active">
            <div className="overview-summary-grid">
              <div className="summary-card">
                <span>Status Akun</span>
                <strong>Administrator</strong>
              </div>
              <div className="summary-card">
                <span>Total Artikel</span>
                <strong id="stat-total">{stats.total}</strong>
              </div>
              <div className="summary-card">
                <span>Artikel Terbaru</span>
                <strong id="stat-latest" style={{ fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {stats.terbaru}
                </strong>
              </div>
            </div>

            <div className="panel panel--map" style={{ marginTop: '24px', marginBottom: '24px' }}>
              <div className="panel-header">
                <h2>Peta Sebaran Artikel</h2>
                <span>Lokasi geografis penulisan artikel di peta interaktif.</span>
              </div>
              <div className="panel-body">
                <div ref={mapContainerRef} id="map" className="map-container" style={{ height: '350px', background: '#e0defe', borderRadius: '14px' }}></div>
              </div>
            </div>

            <div className="panel panel--list">
              <div className="panel-header">
                <h2>Ringkasan Konten</h2>
                <span>Artikel terbaru yang telah dikelola dan ringkasan cepat.</span>
              </div>
              <div className="panel-body" id="recentArtikel">
                {articles.length === 0 ? (
                  <p className="empty">Belum ada artikel yang diterbitkan.</p>
                ) : (
                  articles.slice(0, 3).map((item) => (
                    <div key={item.id} className="article-card">
                      <h3>{item.judul}</h3>
                      <p>{item.konten.substring(0, 140)}{item.konten.length > 140 ? '...' : ''}</p>
                      <small>
                        📅{' '}
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </small>
                      <div className="article-actions">
                        <button className="edit-btn" onClick={() => handleEditClick(item)}>
                          Edit
                        </button>
                        <button className="hapus-btn" onClick={() => handleDeleteArticle(item.id)}>
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: MANAJEMEN ARTIKEL */}
        {activeSection === 'manajemen' && (
          <section id="section-manajemen" className="cms-section cms-section--active">
            <div className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <h2 id="form-title">{editingId ? '✍️ Edit Artikel' : 'Buat Postingan Artikel Baru'}</h2>
                  <span>Isi detail artikel dan simpan dengan mudah di sini.</span>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleSaveArticle}>
                    <div className="form-group">
                      <label htmlFor="judul">Judul Artikel</label>
                      <input
                        className="input-field"
                        type="text"
                        id="judul"
                        placeholder="Masukkan judul artikel"
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="isi">Isi Artikel</label>
                      <textarea
                        className="textarea-field"
                        id="isi"
                        placeholder="Tulis isi artikel..."
                        value={konten}
                        onChange={(e) => setKonten(e.target.value)}
                      ></textarea>
                    </div>

                    <CameraEmbed
                      onImageCaptured={(dataUrl) => setGambar(dataUrl)}
                      currentImage={gambar}
                      onClearImage={() => setGambar('')}
                      showToast={showToast}
                    />

                    {/* Geolocation Capture Status */}
                    {geoStatus === 'searching' && (
                      <p className="geo-status geo-status--searching" style={{ display: 'block' }}>
                        🌐 Sedang mendeteksi lokasi geografis Anda...
                      </p>
                    )}
                    {geoStatus === 'ok' && coords.lat && coords.lon && (
                      <p className="geo-status geo-status--ok" style={{ display: 'block' }}>
                        📍 Lokasi aktif: {parseFloat(coords.lat).toFixed(4)}, {parseFloat(coords.lon).toFixed(4)}
                      </p>
                    )}
                    {geoStatus === 'failed' && (
                      <p className="geo-status geo-status--off" style={{ display: 'block' }}>
                        ⚠️ Geolocation nonaktif / gagal mendeteksi koordinat.
                      </p>
                    )}

                    <div className="form-actions" style={{ marginTop: '20px' }}>
                      <button type="submit" className="save-btn" id="btn-save">
                        {editingId ? 'Perbarui Artikel' : 'Simpan Artikel'}
                      </button>
                      <button
                        type="button"
                        id="btn-reset"
                        className="btn-reset"
                        onClick={resetForm}
                        style={{ display: editingId ? 'inline-block' : 'none' }}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: RIWAYAT ARTIKEL */}
        {activeSection === 'riwayat' && (
          <section id="section-riwayat" className="cms-section cms-section--active">
            <div className="panel">
              <div className="panel-header">
                <h2>Daftar Riwayat Publikasi Artikel</h2>
                <span>Tabel publikasi artikel dengan aksi edit dan hapus.</span>
              </div>
              <div className="panel-body">
                <div className="search-bar">
                  <input
                    className="search-input"
                    type="text"
                    id="search-input"
                    placeholder="🔍 Cari artikel berdasarkan judul atau isi..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <div className="table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Judul</th>
                        <th>Foto</th>
                        <th>Preview</th>
                        <th>Tanggal</th>
                        <th>Lokasi</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody id="history-tbody">
                      {articles.length === 0 ? (
                        <tr>
                          <td className="empty" colSpan="7">
                            Belum ada riwayat artikel.
                          </td>
                        </tr>
                      ) : (
                        articles.map((artikel) => {
                          const latitude = artikel.lat || artikel.latitude;
                          const longitude = artikel.lon || artikel.longitude;

                          return (
                            <tr key={artikel.id}>
                              <td style={{ fontWeight: 600 }}>{artikel.judul}</td>
                              <td className="history-thumb-cell">
                                {artikel.gambar ? (
                                  <img
                                    src={artikel.gambar}
                                    alt={`Foto ${artikel.judul}`}
                                    className="history-thumb"
                                    style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                  />
                                ) : (
                                  <span className="no-image-label">Tanpa Foto</span>
                                )}
                              </td>
                              <td>
                                {artikel.konten.substring(0, 55)}
                                {artikel.konten.length > 55 ? '...' : ''}
                              </td>
                              <td>{new Date(artikel.tanggal).toLocaleDateString('id-ID')}</td>
                              <td>
                                {latitude && longitude ? (
                                  <div className="location-wrapper">
                                    <a
                                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="geo-link"
                                      aria-label="Lihat lokasi"
                                    >
                                      📍 {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                                    </a>
                                    <button
                                      type="button"
                                      className="copy-coords"
                                      onClick={() => handleCopyCoords(latitude, longitude)}
                                      aria-label="Salin koordinat"
                                      title="Salin Koordinat"
                                    >
                                      📋
                                    </button>
                                  </div>
                                ) : (
                                  <span className="no-location">Tidak ada lokasi</span>
                                )}
                              </td>
                              <td>
                                <span className="status-badge published">Published</span>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() => handleEditClick(artikel)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-hapus hapus-btn"
                                    onClick={() => handleDeleteArticle(artikel.id)}
                                    aria-label="Hapus artikel"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Cms;
