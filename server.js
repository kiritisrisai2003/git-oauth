const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bodyParser = require('body-parser');

const clientId = '6271ba47b08f71f32e523d8772fbfcee74f6cd679abd91655ba07526f14e2a2f';
const clientSecret = 'gloas-7dc50f1431d2b5532620bf47476900ca48dcfbfa5650a71f50c22d00e66d144e';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// GitLab OAuth access token endpoint
app.get('/gitlab/getAccessToken', async (req, res) => {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:3000', // Ensure this matches GitLab and client-side
  });

  try {
    const response = await fetch(`https://gitlab.com/oauth/token`, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const data = await response.json();
    console.log('Access Token Response:', data); // Debug response
    if (data.error) {
      return res.status(400).json({ error: data.error_description || 'Failed to obtain access token' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching access token:', error);
    res.status(500).json({ error: 'Failed to fetch access token' });
  }
});

// Get user data from GitLab
app.get('/gitlab/getUserData', async (req, res) => {
  const token = req.get('Authorization');
  if (!token) {
    return res.status(400).json({ error: 'Authorization token is missing' });
  }

  try {
    const response = await fetch('https://gitlab.com/api/v4/user', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Toggle Auto Review Status
app.post('/toggleAutoReview', (req, res) => {
  const { repoId, autoReview } = req.body;

  if (!repoId || typeof autoReview === 'undefined') {
    return res.status(400).json({ error: 'Missing repoId or autoReview status' });
  }

  console.log(`Toggled repo with ID ${repoId} to autoReview: ${autoReview}`);

  res.json({
    message: `Repository with ID ${repoId} has been toggled to ${autoReview ? 'ON' : 'OFF'} for autoReview.`,
    repoId,
    autoReview,
  });
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
