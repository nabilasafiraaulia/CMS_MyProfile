import { useState, useEffect } from 'react';

function Home({ isLoggedIn, onLogout, profilePic, showToast, currentHash }) {
  const [typedText, setTypedText] = useState('');
  const [articles, setArticles] = useState([]);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    email: '',
    phone: '',
    company: '',
    employees: 'Pilih jumlah',
    solutions: 'Pilih solusi',
    pesan: '',
  });

  // Typing effect
  useEffect(() => {
    const text = 'Mahasiswi Informatika | Web Developer';
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      if (isDeleting) {
        setTypedText(text.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setTypedText(text.substring(0, charIndex + 1));
        charIndex++;
      }

      let speed = isDeleting ? 40 : 100;

      if (!isDeleting && charIndex === text.length) {
        speed = 2500; // Hold at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        speed = 800; // Pause before typing again
      }

      timeoutId = setTimeout(type, speed);
    };

    type();
    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch articles
  useEffect(() => {
    const apiBase = window.location.port === '5000' ? 'http://localhost:3000' : '';
    fetch(`${apiBase}/api/artikel`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => setArticles(data))
      .catch((err) => console.warn('Home list load failed:', err));
  }, []);

  // Scroll to section on hash change
  useEffect(() => {
    if (currentHash) {
      const sectionId = currentHash.replace('#/', '');
      if (sectionId && sectionId !== '#/') {
        const el = document.getElementById(sectionId);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentHash]);

  // Form submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.pesan) {
      showToast('Email dan Pesan wajib diisi!', 'error');
      return;
    }
    showToast('Pesan berhasil terkirim!', 'success');
    setContactForm({
      email: '',
      phone: '',
      company: '',
      employees: 'Pilih jumlah',
      solutions: 'Pilih solusi',
      pesan: '',
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setContactForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleAvatarClick = () => {
    window.location.hash = '#/camera';
  };

  return (
    <div>
      {isLoggedIn && (
        <div
          className="admin-bar"
          style={{
            background: '#F3ECE9',
            color: '#3A302E',
            padding: '12px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
            borderRadius: '24px',
            margin: '10px 20px 0 20px',
          }}
        >
          <span>⚡ Mode Admin Aktif (Login Berhasil)</span>
          <a
            href="#/cms"
            style={{
              color: 'white',
              background: '#C39B8F',
              padding: '6px 14px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontSize: '12px',
              transition: '.2s',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(195,155,143,0.2)',
            }}
          >
            🛠️ Kembali ke CMS Dashboard
          </a>
        </div>
      )}

      {/* NAVBAR */}
      <div className="navbar" id="spa-navbar">
        <a href="#/" className={currentHash === '#/' || currentHash === '' ? 'active' : ''}>
          🏠 Beranda
        </a>
        <a href="#/profil" className={currentHash === '#/profil' ? 'active' : ''}>
          👤 Profil
        </a>
        <a href="#/about" className={currentHash === '#/about' ? 'active' : ''}>
          📖 About Me
        </a>
        <a href="#/goals" className={currentHash === '#/goals' ? 'active' : ''}>
          🎯 Goals
        </a>
        <a href="#/favorite" className={currentHash === '#/favorite' ? 'active' : ''}>
          💗 Favorite
        </a>
        <a href="#/artikel-section" className={currentHash === '#/artikel-section' ? 'active' : ''}>
          📝 Artikel
        </a>
        <a href="#/contact" className={currentHash === '#/contact' ? 'active' : ''}>
          ☎️ Contact
        </a>
        {isLoggedIn ? (
          <>
            <a href="#/cms" style={{ background: 'var(--primary)', color: 'white' }}>
              🛠️ Dashboard CMS
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} style={{ background: 'var(--text-medium)', color: 'white' }}>
              🚪 Logout
            </a>
          </>
        ) : (
          <a
            href="#/login"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '24px',
            }}
          >
            🔐 Login
          </a>
        )}
      </div>

      <div className="container">
        {/* HEADER */}
        <div className="header" id="profil" style={{ position: 'relative' }}>
          {/* Twinkling Glitters */}
          <span className="glitter-particle" style={{ top: '10%', left: '8%', animationDelay: '0s' }}>✨</span>
          <span className="glitter-particle" style={{ top: '22%', right: '12%', animationDelay: '0.4s' }}>✨</span>
          <span className="glitter-particle" style={{ top: '45%', left: '5%', animationDelay: '0.8s' }}>✨</span>
          <span className="glitter-particle" style={{ top: '75%', right: '8%', animationDelay: '1.2s' }}>✨</span>
          <span className="glitter-particle" style={{ top: '35%', right: '82%', animationDelay: '1.6s' }}>✨</span>
          <span className="glitter-particle" style={{ top: '15%', left: '88%', animationDelay: '2s' }}>✨</span>
          <span className="glitter-particle" style={{ top: '55%', right: '2%', animationDelay: '2.4s' }}>✨</span>

          <h1 id="judul" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Nabila Safira Aulia Zaky
          </h1>
          <p id="typing2" style={{ fontFamily: "'Poppins', sans-serif", minHeight: '35px' }}>
            {typedText}
            <span
              style={{
                borderRight: '3px solid var(--primary)',
                marginLeft: '2px',
                animation: 'blink 0.8s infinite',
              }}
            ></span>
          </p>

          <div className="profile" style={{ position: 'relative', display: 'inline-block' }}>
            <img
              id="home-avatar"
              src={profilePic}
              alt="Foto Nabila"
              onClick={handleAvatarClick}
              style={{
                viewTransitionName: 'profile-avatar',
                cursor: 'pointer',
                border: '6px solid white',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '50%',
                transition: 'transform 0.3s',
                width: '180px',
                height: '180px',
                objectFit: 'cover',
              }}
            />
            <div
              className="avatar-overlay"
              onClick={handleAvatarClick}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'var(--primary)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                cursor: 'pointer',
                border: '3px solid white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              }}
            >
              📷
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {/* ABOUT */}
          <section id="about" style={{ marginTop: '40px' }}>
            <h2>Tentang Saya</h2>
            <p>
              Halo semuanya 👋
              <br />
              <br />
              Perkenalkan saya <b>Nabila Safira Aulia Zaky</b>, mahasiswa Program Studi Informatika,
              Universitas Nahdlatul Ulama Al-Ghazali Cilacap.
              <br />
              <br />
              Saat ini saya berusia <span id="umur">20</span> tahun dan tinggal di Cilacap, Jawa Tengah.
              <br />
              <br />
              Saya memiliki ketertarikan pada dunia teknologi, desain website, dan pengembangan
              aplikasi modern 💻✨
            </p>
          </section>

          {/* GRID */}
          <div className="grid">
            {/* HOBI */}
            <div className="card glitter-card-effect">
              <h2>Hobi</h2>
              <ul>
                <li>Traveling ✈️</li>
                <li>Menyanyi 🎤</li>
                <li>Memasak 🍳</li>
                <li>Menonton Film 🎬</li>
              </ul>
            </div>

            {/* GOALS */}
            <div className="card glitter-card-effect" id="goals">
              <h2>Goals</h2>
              <ol>
                <li>Lulus tepat waktu</li>
                <li>Menjadi orang sukses</li>
                <li>Membahagiakan orang tua</li>
                <li>Punya bisnis sendiri</li>
              </ol>
            </div>
          </div>

          {/* FAVORITE */}
          <section id="favorite" style={{ marginTop: '50px' }}>
            <h2>Favorite Things</h2>
            <table>
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Favorit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Makanan</td>
                  <td>Salad Sayur dan salad buah</td>
                </tr>
                <tr>
                  <td>Warna</td>
                  <td>Pink, Hitam, Ungu</td>
                </tr>
                <tr>
                  <td>Film</td>
                  <td>Drama Korea</td>
                </tr>
                <tr>
                  <td>Buku</td>
                  <td>Novel Romance</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ARTIKEL */}
          <section className="artikel-section" id="artikel-section" style={{ marginTop: '50px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <h2>Artikel Saya</h2>
              <button
                id="btn-open-camera"
                className="btn-rose-action"
                onClick={() => {
                  window.location.hash = '#/cms';
                }}
              >
                🎥 Story Camera
              </button>
            </div>
            <div id="artikel-list">
              {articles.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#85756B' }}>
                  Belum ada artikel yang diterbitkan.
                </p>
              ) : (
                articles.map((artikel) => (
                  <div
                    key={artikel.id}
                    className="card-artikel-item glitter-card-effect"
                    style={{
                      textAlign: 'left',
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: '12px',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '22px',
                        fontWeight: 700,
                      }}
                    >
                      {artikel.judul}
                    </h3>
                    <p style={{ marginBottom: '15px', fontSize: '15px', lineHeight: '1.8' }}>
                      {artikel.konten}
                    </p>
                    {artikel.gambar && (
                      <img
                        src={artikel.gambar}
                        alt={artikel.judul}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          marginBottom: '15px',
                          display: 'block',
                        }}
                      />
                    )}
                    <small style={{ display: 'block', fontWeight: 500 }}>
                      📅{' '}
                      {new Date(artikel.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </small>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* CONTACT */}
          <section className="contact" id="contact" style={{ marginTop: '60px', marginBottom: '60px' }}>
            <h2>Contact Me</h2>
            <form id="formKontak" onSubmit={handleContactSubmit}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="contoh@gmail.com"
                value={contactForm.email}
                onChange={handleInputChange}
              />

              <label htmlFor="phone">Phone Number</label>
              <input
                type="text"
                id="phone"
                placeholder="+62 81234567890"
                value={contactForm.phone}
                onChange={handleInputChange}
              />

              <div className="form-row">
                <div>
                  <label htmlFor="company">Company Name</label>
                  <input
                    type="text"
                    id="company"
                    placeholder="Nama perusahaan"
                    value={contactForm.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="employees">Number of Employees</label>
                  <select
                    id="employees"
                    value={contactForm.employees}
                    onChange={handleInputChange}
                  >
                    <option>Pilih jumlah</option>
                    <option>1-10</option>
                    <option>11-50</option>
                    <option>51-100</option>
                  </select>
                </div>
              </div>

              <label htmlFor="solutions">Solutions</label>
              <select
                id="solutions"
                value={contactForm.solutions}
                onChange={handleInputChange}
              >
                <option>Pilih solusi</option>
                <option>Website</option>
                <option>Mobile App</option>
                <option>UI/UX Design</option>
              </select>

              <label htmlFor="pesan">Pesan</label>
              <textarea
                id="pesan"
                placeholder="Tulis pesan..."
                value={contactForm.pesan}
                onChange={handleInputChange}
              ></textarea>

              <button type="submit" id="btn-kirim-pesan">
                Kirim
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Home;
