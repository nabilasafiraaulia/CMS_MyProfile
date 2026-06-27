const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const ROOT = path.join(__dirname, 'frontend', 'profile.html');

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/profile.html';
  const filePath = path.join(ROOT, reqPath);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    if (stats.isDirectory()) {
      res.statusCode = 302;
      res.setHeader('Location', '/profile.html');
      res.end();
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type + '; charset=utf-8');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => {
      res.statusCode = 500;
      res.end('Server error');
    });
  });
});

server.listen(PORT, () => {
  console.log(`Static preview server running: http://localhost:${PORT}/`);
  console.log(`Serving from ${ROOT}`);
});
