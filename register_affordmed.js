// register_affordmed.js
// Script to register with Affordmed API and get clientID and clientSecret

const axios = require('axios');

async function register() {
  try {
    const response = await axios.post('http://20.207.122.201/evaluation-service/register', {
      email: 'saumiltiwari04@gmail.com',
      name: 'Saumil Tiwari',
      mobileNo: '9304774255',
      githubUsername: 'st4377',
      rollNo: 'RA2311030010246',
      accessCode: 'Xy9aNC'
    });
    console.log('Registration successful:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Registration failed:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

register();
