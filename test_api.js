const axios = require('axios');

async function test() {
  try {
    // 1. Admin login
    console.log('Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'admin@saturn.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.data.token;
    console.log('Login successful! Token:', token);

    // 2. Fetch providers
    console.log('Fetching admin providers...');
    const providersRes = await axios.get('http://localhost:5000/api/admin/providers', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Total providers found in API:', providersRes.data.data.providers.length);

    // 3. Fetch single provider details
    const providerId = '6a32441ad4374ae4b32c684a'; // Shahal
    console.log(`Fetching provider details for ID: ${providerId}...`);
    const singleProvRes = await axios.get(`http://localhost:5000/api/admin/providers/${providerId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Single provider response success:', singleProvRes.data.success);
    console.log('Provider details:', {
      name: singleProvRes.data.data.provider.name,
      type: singleProvRes.data.data.provider.providerType,
      sessionsCount: singleProvRes.data.data.sessions.length,
      reviewsCount: singleProvRes.data.data.reviews.length
    });

    // 4. Fetch single user details
    const userId = '6a2ce5d25e2736faf5a117bb'; // Shahal
    console.log(`Fetching user details for ID: ${userId}...`);
    const singleUserRes = await axios.get(`http://localhost:5000/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Single user response success:', singleUserRes.data.success);
    console.log('User details:', {
      name: singleUserRes.data.data.user.name,
      phone: singleUserRes.data.data.user.phone,
      sessionsCount: singleUserRes.data.data.sessions.length
    });

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
