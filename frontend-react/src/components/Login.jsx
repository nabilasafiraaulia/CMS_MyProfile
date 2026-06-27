import { useState } from 'react';

function Login({ setIsLoggedIn, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Username dan password tidak boleh kosong!', 'error');
      return;
    }

    if (username === 'admin' && password === '123') {
      localStorage.setItem('login', 'true');
      setIsLoggedIn(true);
      showToast('Login berhasil!', 'success');
      window.location.hash = '#/cms';
    } else {
      showToast('Login gagal!', 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="glow glow1"></div>
      <div className="glow glow2"></div>

      <div className="login-card" style={{ border: '1px solid rgba(255, 255, 255, 0.4)', maxWidth: '380px', margin: '40px auto' }}>
        <div className="login-icon">🔐</div>
        <h1>Login CMS</h1>
        <p style={{ marginBottom: '24px' }}>Masuk untuk mengelola artikel website pribadi</p>

        <form onSubmit={handleLoginSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label htmlFor="username" style={{ marginTop: 0, fontSize: '13px', color: '#555' }}>
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                background: '#FAF6F5',
                border: '1px solid rgba(195,155,143,0.14)',
                marginTop: '5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label htmlFor="password" style={{ marginTop: 0, fontSize: '13px', color: '#555' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: '#FAF6F5',
                border: '1px solid rgba(195,155,143,0.14)',
                marginTop: '5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button type="submit" id="btn-login" className="btn-rose-control btn-full">
            Login
          </button>
        </form>

        <div
          className="demo-login"
          style={{
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '14px',
            padding: '12px',
            marginTop: '20px',
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#777' }}>
            Demo Login
          </span>
          <h3 style={{ marginTop: '4px', fontSize: '13px', color: '#C39B8F', lineHeight: '1.6' }}>
            Username : <b>admin</b>
            <br />
            Password : <b>123</b>
          </h3>
        </div>

        <a href="#/" className="back-profile" style={{ marginTop: '20px', fontWeight: 600, display: 'inline-block' }}>
          ← Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

export default Login;
