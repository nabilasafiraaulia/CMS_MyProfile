import { useState, useEffect, useRef } from 'react';
import {
  startCamera,
  stopCamera,
  listCameras,
  captureFrame,
  canvasToBlob,
  downloadBlob,
} from '../camera-utils';

function CameraEmbed({ onImageCaptured, currentImage, onClearImage, showToast }) {
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

  // Load cameras
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

  // Start stream when device selection changes
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

  // Sync preview with external currentImage (e.g. if form reset or editing article)
  useEffect(() => {
    if (currentImage) {
      setIsPreview(true);
      setPreviewUrl(currentImage);
    } else {
      setIsPreview(false);
      setPreviewUrl('');
    }
  }, [currentImage]);

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
      onImageCaptured(dataUrl);

      // Stop stream while in preview mode to save resources
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
    onClearImage();
  };

  const handleDownload = () => {
    if (capturedBlob) {
      downloadBlob(capturedBlob, `story_photo_${Date.now()}.png`);
      showToast('Foto berhasil diunduh.', 'success');
    } else if (previewUrl) {
      // Fallback if blob is not available (e.g. loaded from existing article)
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `story_photo_${Date.now()}.jpg`;
      a.click();
      showToast('Foto berhasil diunduh.', 'success');
    }
  };

  const handleSetProfilePic = () => {
    if (previewUrl) {
      localStorage.setItem('profile_picture', previewUrl);
      showToast('Foto profil berhasil diubah!', 'success');
      // Trigger event or full page update if needed
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="camera-embed-card">
      <div className="panel-header">
        <h3>Story Camera Langsung</h3>
        <span>Gunakan kamera web untuk capture gambar dengan cepat.</span>
      </div>

      <div className="camera-stream-box" style={{ position: 'relative' }}>
        {/* Live stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ display: isPreview ? 'none' : 'block' }}
        />

        {/* Capture preview */}
        {isPreview && (
          <img
            src={previewUrl}
            alt="Preview"
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Active filter label */}
        {!isPreview && activeFilter !== 'none' && (
          <div className="camera-filter-indicator" style={{ display: 'block' }}>
            Filter: {activeFilter}
          </div>
        )}
      </div>

      {cameraError && (
        <div className="camera-error-message" style={{ display: 'block' }}>
          {cameraError}
        </div>
      )}

      {/* Stream controls */}
      {!isPreview && (
        <div className="camera-controls-panel">
          <div className="camera-form-row">
            <div>
              <label htmlFor="camera-select">Pilih Perangkat Kamera</label>
              <select
                id="camera-select"
                className="input-field"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
              >
                {devices.length === 0 ? (
                  <option value="">Kamera tidak terdeteksi</option>
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
              <label>Filter</label>
              <div className="camera-filter-group">
                {['none', 'grayscale', 'sepia'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f === 'none' ? 'Normal' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="camera-summary">
            <span>Tambahkan watermark waktu</span>
            <label className="switch">
              <input
                type="checkbox"
                id="watermark-toggle"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="form-actions">
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

      {/* Preview actions */}
      {isPreview && (
        <div className="camera-preview-actions" style={{ display: 'flex' }}>
          <button
            type="button"
            id="btn-save-profile"
            className="btn-rose-control"
            onClick={handleSetProfilePic}
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
          <button
            type="button"
            id="btn-retry"
            className="btn-secondary-action"
            onClick={handleRetry}
          >
            🔄 Ambil Ulang / Hapus Foto
          </button>
        </div>
      )}
    </div>
  );
}

export default CameraEmbed;
