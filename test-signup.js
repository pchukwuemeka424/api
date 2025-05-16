// Script to test the signup endpoint
const http = require('http');

// Signup data
const userData = {
  email: 'test@gmail.com', // Using valid email domain
  password: 'Password123!',
  name: 'Test User',
  age: 28,
  location: 'New York'
};

// Create the request options
const options = {
  hostname: 'localhost',
  port: 7001,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Send the request
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE BODY:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write the data
const postData = JSON.stringify(userData);
req.write(postData);
req.end();

console.log('Request sent, waiting for response...'); 