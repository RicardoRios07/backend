const axios = require('axios');

const api = axios.create({ baseURL: 'http://localhost:3000/api', timeout: 5000 });

async function run() {
  try {
    console.log('1) Health check');
    const h = await api.get('/health');
    console.log('Health:', h.data);

    const timestamp = Date.now();
    const email = `cli-test+${timestamp}@example.com`;
    console.log('\n2) Register user', email);
    let reg;
    try {
      reg = await api.post('/auth/register', { name: 'CLI Test', email, password: 'secret' });
      console.log('Register response:', reg.data);
    } catch (err) {
      if (err.response) {
        console.log('Register failed status', err.response.status, err.response.data);
      } else {
        console.error('Register error', err.message);
      }
    }

    console.log('\n3) Login');
    const login = await api.post('/auth/login', { email, password: 'secret' });
    console.log('Login response:', login.data.user ? { user: login.data.user } : login.data);
    const token = login.data.token;

    console.log('\n4) Get cart (auth)');
    const cart = await api.get('/cart', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Cart:', cart.data);

    console.log('\nAll tests completed.');
  } catch (err) {
    if (err.response) console.error('Error:', err.response.status, err.response.data);
    else console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
