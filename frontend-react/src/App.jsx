import { useState, useEffect } from 'react';
import './style.css';
import './cms.css';
import Home from './components/Home';
import Login from './components/Login';
import Cms from './components/Cms';
import Camera from './components/Camera';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('login') === 'true');
  const [profilePic, setProfilePic] = useState(
    localStorage.getItem('profile_picture') || 'fotonabila/fotonabila.jpeg'
  );
  const [toasts, setToasts] = useState([]);

  // Toast handler
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Listen to hash change
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Register Service Worker and Push Notification
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);

          // Register for Push Notifications
          import('./utils/push.js')
            .then((pushUtil) => {
              setTimeout(() => {
                pushUtil
                  .registerPushSubscription()
                  .then((sub) => {
                    if (sub) {
                      console.log('Successfully subscribed to Web Push:', sub);
                    }
                  })
                  .catch((err) => {
                    console.warn('Web Push subscription failed:', err);
                  });
              }, 2000);
            })
            .catch((err) => {
              console.error('Failed to import push utility:', err);
            });
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  // Sync login state
  const handleLogout = () => {
    localStorage.removeItem('login');
    setIsLoggedIn(false);
    showToast('Berhasil logout.', 'success');
    window.location.hash = '#/';
  };

  // Determine active view
  const isHomeRoute =
    currentHash === '#/' ||
    currentHash === '' ||
    [
      '#/profil',
      '#/about',
      '#/goals',
      '#/favorite',
      '#/artikel-section',
      '#/contact',
    ].includes(currentHash);

  let viewComponent = null;

  if (isHomeRoute) {
    viewComponent = (
      <Home
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        profilePic={profilePic}
        showToast={showToast}
        currentHash={currentHash}
      />
    );
  } else if (currentHash === '#/login') {
    if (isLoggedIn) {
      window.location.hash = '#/cms';
    } else {
      viewComponent = (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          showToast={showToast}
        />
      );
    }
  } else if (currentHash === '#/cms') {
    if (!isLoggedIn) {
      window.location.hash = '#/login';
    } else {
      viewComponent = (
        <Cms
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          showToast={showToast}
        />
      );
    }
  } else if (currentHash === '#/camera') {
    viewComponent = (
      <Camera
        showToast={showToast}
        setProfilePic={setProfilePic}
      />
    );
  } else {
    // Fallback to Home
    viewComponent = (
      <Home
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        profilePic={profilePic}
        showToast={showToast}
        currentHash={currentHash}
      />
    );
  }

  // Adjust body classes
  useEffect(() => {
    document.body.className = '';
    if (currentHash === '#/login') {
      document.body.classList.add('login-page-active');
    } else if (currentHash === '#/cms') {
      document.body.classList.add('cms-page-active');
    }
  }, [currentHash]);

  return (
    <>
      {/* Toast Container */}
      <div id="toast-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-new ${toast.type} show`} style={{ animation: 'toastIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <span>{toast.type === 'success' ? '✨' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {viewComponent}
    </>
  );
}

export default App;
