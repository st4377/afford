// logging_middleware/index.js
// Affordmed Logging Middleware - Backend Example (Node.js)
// This is a reusable logging middleware for backend applications.
// It posts logs to the Affordmed test server as per the requirements.

const axios = require('axios');

// Allowed values for stack, level, and package
const STACKS = ['backend'];
const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'auth', 'config', 'middleware', 'utils'];

// Log function
async function Log(stack, level, pkg, message, authToken) {
  // Validate inputs
  if (!STACKS.includes(stack)) throw new Error('Invalid stack');
  if (!LEVELS.includes(level)) throw new Error('Invalid level');
  if (!PACKAGES.includes(pkg)) throw new Error('Invalid package');
  if (!authToken) throw new Error('Missing Authorization Token');

  const url = 'http://20.207.122.201/evaluation-service/logs';
  const body = { stack, level, package: pkg, message };
  const headers = { Authorization: `Bearer ${authToken}` };

  try {
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (error) {
    // Optionally log error details
    throw new Error('Failed to send log: ' + (error.response?.data?.message || error.message));
  }
}

module.exports = { Log };
