const https = require('https');

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

async function run() {
  const base = 'https://dress-ecomm-backend.onrender.com/api/v1';

  const email = `customer_${Date.now()}@example.com`;
  const password = 'Password123!';
  console.log('Registering:', email);
  const regRes = await post(`${base}/auth/register`, {
    name: 'Customer Test',
    email,
    password,
    phone: '+919876543210'
  });
  console.log('Register response:', JSON.stringify(regRes.data, null, 2));

  console.log('Logging in with registered credentials:');
  const loginRes = await post(`${base}/auth/login`, {
    email,
    password
  });
  console.log('Login response:', JSON.stringify(loginRes.data, null, 2));
  console.log('Login Set-Cookie header:', loginRes.headers['set-cookie']);

  const token = loginRes.data?.data?.accessToken || loginRes.data?.data?.token || loginRes.data?.accessToken;
  console.log('Token extracted:', token ? token.slice(0, 25) + '...' : 'NULL');

  if (token) {
    console.log('\n--- Testing GET /wishlist?page=1&limit=12&sort=newest ---');
    const w1 = await get(`${base}/wishlist?page=1&limit=12&sort=newest`, {
      Authorization: `Bearer ${token}`
    });
    console.log('Wishlist with query status:', w1.status, JSON.stringify(w1.data, null, 2));

    console.log('\n--- Testing GET /wishlist without query ---');
    const w2 = await get(`${base}/wishlist`, {
      Authorization: `Bearer ${token}`
    });
    console.log('Wishlist bare status:', w2.status, JSON.stringify(w2.data, null, 2));

    console.log('\n--- Testing GET /wishlist/ids ---');
    const w3 = await get(`${base}/wishlist/ids`, {
      Authorization: `Bearer ${token}`
    });
    console.log('Wishlist IDs status:', w3.status, JSON.stringify(w3.data, null, 2));
  }
}

run().catch(console.error);
