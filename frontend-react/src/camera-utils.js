export async function startCamera(videoEl, facingMode = 'user', deviceId = null) {
    const constraints = {
        audio: false,
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
    } else {
        constraints.video.facingMode = facingMode;
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    return stream;
}

export function stopCamera(stream) {
    if (stream) {
        stream.getTracks().forEach((track) => {
            track.stop();
        });
    }
}

export async function listCameras() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true }).then(s => stopCamera(s)).catch(() => {});
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error listing cameras:', error);
        return [];
    }
}

export function captureFrame(videoEl, { filter = 'none', watermark = false } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    if (filter === 'grayscale') {
        applyGrayscale(ctx, canvas);
    } else if (filter === 'sepia') {
        applySepia(ctx, canvas);
    }

    if (watermark) {
        addWatermark(ctx, canvas);
    }

    return canvas;
}

function applyGrayscale(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
}

function applySepia(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);     // Red
        data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b); // Green
        data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
}

function addWatermark(ctx, canvas) {
    const text = 'ProfileCam - Nabila Safira';
    const dateText = new Date().toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    ctx.save();
    const fontSize = Math.max(16, Math.floor(canvas.width * 0.03));
    ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
    
    const textWidth1 = ctx.measureText(text).width;
    const textWidth2 = ctx.measureText(dateText).width;
    const boxWidth = Math.max(textWidth1, textWidth2) + 30;
    const boxHeight = fontSize * 2.8;

    const x = canvas.width - boxWidth - 20;
    const y = canvas.height - boxHeight - 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x + 15, y + 10);

    ctx.font = `${fontSize * 0.8}px Poppins, sans-serif`;
    ctx.fillStyle = '#F5E8DA';
    ctx.fillText(dateText, x + 15, y + 10 + fontSize * 1.2);

    ctx.restore();
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), type, quality);
    });
}

export function downloadBlob(blob, filename = 'profile_camera.png') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
