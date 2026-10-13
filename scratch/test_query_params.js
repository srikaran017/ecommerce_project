const https = require('https');

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        ...headers
      }
    }, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(respData) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: respData });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(respData) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: respData });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const base = 'https://dress-ecomm-backend.onrender.com/api/v1';

  // Login
  const loginRes = await post(`${base}/auth/login`, {
    email: 'customer_1791861416691@example.com',
    password: 'Password123!'
  });
  const token = loginRes.data?.data?.accessToken;

  console.log('Testing without limit (page=1&sort=newest):');
  const r1 = await get(`${base}/wishlist?page=1&sort=newest`, {
    Authorization: `Bearer ${token}`
  });
  console.log('r1 status:', r1.status, r1.data?.message);

  console.log('Testing with search (search=dress):');
  const r2 = await get(`${base}/wishlist?search=dress`, {
    Authorization: `Bearer ${token}`
  });
  console.log('r2 status:', r2.status, r2.data?.message);

  console.log('Testing with limit=10:');
  const r3 = await get(`${base}/wishlist?limit=10`, {
    Authorization: `Bearer ${token}`
  });
  console.log('r3 status:', r3.status, r3.data?.message);

  console.log('Testing with limit=10 as int (can HTTP send int? No, HTTP query is always string!):');
}

run().catch(console.error);
