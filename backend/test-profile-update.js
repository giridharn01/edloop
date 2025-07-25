const https = require('http');

const data = JSON.stringify({
  bio: 'Updated bio: Full-stack developer with expertise in MERN stack.',
  domain: 'Software Engineering',
  interests: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL'],
  university: 'Anna University'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/users/me',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgyNjY0NjZhYjg3MmMwNmQ2MTkxYjQiLCJ1c2VybmFtZSI6ImRoYW5hIiwiaWF0IjoxNzUzNDEwODc5LCJleHAiOjE3NTM0MTQ0Nzl9.fXBbjpyhB8KSQQGlEh3uLDU--OxMC7O4_kD_IHpX7Vg`
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:');
    console.log(JSON.stringify(JSON.parse(responseData), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
