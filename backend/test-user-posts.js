const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a test JWT token for the user
const token = jwt.sign(
  { userId: '688266466ab872c06d6191b4', username: 'dhana' },
  process.env.JWT_SECRET || 'fallback-secret',
  { expiresIn: '1h' }
);

console.log('Testing user posts API...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/users/me/posts',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const data = JSON.parse(responseData);
      console.log(`Found ${data.length} posts for user`);
      if (data.length > 0) {
        console.log('Sample post:', {
          title: data[0].title,
          author: data[0].author?.displayName || 'Unknown'
        });
      }
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
