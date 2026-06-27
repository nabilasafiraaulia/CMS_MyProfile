import { useState, useEffect, useRef } from 'react';
import {
  startCamera,
  stopCamera,
  listCameras,
  captureFrame,
  canvasToBlob,
  downloadBlob,
} from '../camera-utils';

function Camera({ showToast, setProfilePic }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [activeFilter, setActiveFilter] = useState('none');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState('');

  // Load cameras list
  useEffect(() => {
    async function init() {
      try {
        const cameraDevices = await listCameras();
        setDevices(cameraDevices);
        if (cameraDevices.length > 0) {
          setSelectedDeviceId(cameraDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to list cameras:', err);
        setCameraError('Gagal mendeteksi perangkat kamera.');
      }
    }
    init();
  }, []);

  // Control camera stream based on selected device and preview status
  useEffect(() => {
    let activeStream = null;

    async function launchStream() {
      if (!selectedDeviceId || isPreview) return;

      try {
        setCameraError('');
        if (stream) {
          stopCamera(stream);
        }

        if (videoRef.current) {
          const s = await startCamera(videoRef.current, 'user', selectedDeviceId);
          setStream(s);
          activeStream = s;
        }
      } catch (err) {
        console.error('Failed to start camera stream:', err);
        setCameraError('Gagal mengakses kamera. Mohon izinkan akses kamera.');
      }
    }

    launchStream();

    return () => {
      if (activeStream) {
        stopCamera(activeStream);
      }
    };
  }, [selectedDeviceId, isPreview]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream);
      }
    };
  }, [stream]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    try {
      const canvas = captureFrame(videoRef.current, {
        filter: activeFilter,
        watermark: watermarkEnabled,
      });
      const blob = await canvasToBlob(canvas);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setCapturedBlob(blob);
      setPreviewUrl(dataUrl);
      setIsPreview(true);

      if (stream) {
        stopCamera(stream);
        setStream(null);
      }

      showToast('Foto berhasil diambil!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengambil foto.', 'error');
    }
  };

  const handleRetry = () => {
    setIsPreview(false);
    setPreviewUrl('');
    setCapturedBlob(null);
  };

  const handleDownload = () => {
    if (capturedBlob) {
      downloadBlob(capturedBlob, `profile_camera_${Date.now()}.png`);
      showToast('Foto berhasil diunduh.', 'success');
    }
  };

  const handleSaveProfilePic = () => {
    if (previewUrl) {
      localStorage.setItem('profile_picture', previewUrl);
      setProfilePic(previewUrl);
      showToast('Foto profil berhasil diubah!', 'success');
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div className="glow glow1"></div>
      <div className="glow glow2"></div>

      <div
        className="login-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: '30px',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', textAlign: 'left', margin: 0, color: '#3A302E' }}>
            📷 Story Camera
          </h1>
          <a href="#/" className="back-profile" style={{ margin: 0, fontWeight: 600 }}>
            ← Kembali
          </a>
        </div>

        <div
          className="camera-stream-box"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            background: '#000',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            border: '4px solid white',
            boxSizing: 'border-box',
          }}
        >
          {/* Video stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: isPreview ? 'none' : 'block' }}
          />

          {/* Captured preview image */}
          {isPreview && (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          {/* Active filter label */}
          {!isPreview && activeFilter !== 'none' && (
            <div
              id="filter-indicator"
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '30px',
                fontSize: '11px',
                fontTarget: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Filter: {activeFilter}
            </div>
          )}
        </div>

        {/* ERROR CONTAINER */}
        {cameraError && (
          <div
            id="camera-error"
            style={{
              background: '#FAF6F5',
              border: '1px solid rgba(195,155,143,0.4)',
              color: '#3A302E',
              padding: '15px',
              borderRadius: '16px',
              marginTop: '15px',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {cameraError}
          </div>
        )}

        {/* CAMERA CONTROLS */}
        {!isPreview && (
          <div id="stream-controls" style={{ marginTop: '25px' }}>
            <div className="form-row" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ textAlign: 'left', fontSize: '13px', color: '#555', marginTop: 0, display: 'block' }}>
                  Pilih Perangkat Kamera
                </label>
                <select
                  id="camera-select"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  style={{
                    background: 'white',
                    border: '1px solid rgba(195,155,143,0.18)',
                    padding: '12px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    marginTop: '5px',
                    width: '100%',
                  }}
                >
                  {devices.length === 0 ? (
                    <option value="">Memuat kamera...</option>
                  ) : (
                    devices.map((device, i) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Kamera ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label style={{ textAlign: 'left', fontSize: '13px', color: '#555', marginTop: 0, display: 'block' }}>
                  Pilihan Filter Piksel
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                  {['none', 'grayscale', 'sepia'].map((filterName) => (
                    <button
                      key={filterName}
                      type="button"
                      className={`filter-btn ${activeFilter === filterName ? 'active' : ''}`}
                      onClick={() => setActiveFilter(filterName)}
                      style={{
                        background: activeFilter === filterName ? '#C39B8F' : '#eee',
                        color: activeFilter === filterName ? 'white' : '#333',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {filterName === 'none' ? 'Normal' : filterName.charAt(0).toUpperCase() + filterName.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                background: '#FAF6F5',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(195,155,143,0.18)',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#3A302E' }}>
                Tambahkan Watermark Waktu
              </span>
              <label className="switch" style={{ margin: 0, position: 'relative', display: 'inline-block', width: '46px', height: '26px' }}>
                <input
                  type="checkbox"
                  id="watermark-toggle"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                type="button"
                id="btn-capture"
                className="btn-rose-action"
                onClick={handleCapture}
                disabled={!!cameraError}
              >
                📷 Ambil Foto
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW CONTROLS (Initially Hidden) */}
        {isPreview && (
          <div id="preview-controls" style={{ marginTop: '25px', display: 'block' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <button
                type="button"
                id="btn-save-profile"
                className="btn-rose-control"
                onClick={handleSaveProfilePic}
              >
                👤 Jadikan Foto Profil
              </button>
              <button
                type="button"
                id="btn-download"
                className="btn-rose-control-alt"
                onClick={handleDownload}
              >
                📥 Unduh Foto PNG
              </button>
            </div>
            <button
              type="button"
              id="btn-retry"
              className="btn-secondary-action"
              onClick={handleRetry}
            >
              🔄 Ambil Ulang Foto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Camera;
