const https = require('https');
const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data.slice(0, 300) });
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });
  });
}

async function run() {
  const baseUrls = [
    'https://dress-ecomm-backend.onrender.com/api/v1',
    'http://localhost:5000/api/v1'
  ];

  for (const base of baseUrls) {
    console.log('--- Probing:', base);
    const r1 = await testEndpoint(`${base}/wishlist/ids`);
    console.log('GET /wishlist/ids:', r1);
    const r2 = await testEndpoint(`${base}/wishlist`);
    console.log('GET /wishlist:', r2);
    const r3 = await testEndpoint(`${base}/admin/analytics/wishlist`);
    console.log('GET /admin/analytics/wishlist:', r3);
  }
}

run();
