const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const bodyParser = require('body-parser');

// GitLab credentials
const gitlabClientId = '6271ba47b08f71f32e523d8772fbfcee74f6cd679abd91655ba07526f14e2a2f';
const gitlabClientSecret = 'gloas-7dc50f1431d2b5532620bf47476900ca48dcfbfa5650a71f50c22d00e66d144e';

// GitHub credentials
const githubClientId = 'Ov23liALUEtT4yXBPpdJ';
const githubClientSecret = '41cf1d1bbb6e5429871339a891fad73c018375fc';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// GitLab OAuth access token endpoint
app.get('/gitlab/getAccessToken', async (req, res) => {
  const params = new URLSearchParams({
    client_id: gitlabClientId,
    client_secret: gitlabClientSecret,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:3000', // Ensure this matches GitLab and client-side
  });

  try {
    const response = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const data = await response.json();
    console.log('GitLab Access Token Response:', data); // Debug response
    if (data.error) {
      return res.status(400).json({ error: data.error_description || 'Failed to obtain access token from GitLab' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching GitLab access token:', error);
    res.status(500).json({ error: 'Failed to fetch GitLab access token' });
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
    console.error('Error fetching GitLab user data:', error);
    res.status(500).json({ error: 'Failed to fetch GitLab user data' });
  }
});

// GitHub OAuth access token endpoint
app.get('/github/getAccessToken', async (req, res) => {
  const params = `?client_id=${githubClientId}&client_secret=${githubClientSecret}&code=${req.query.code}`;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token' + params, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching GitHub access token:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub access token' });
  }
});

// Get user data from GitHub
app.get('/github/getUserData', async (req, res) => {
  const token = req.get('Authorization');
  if (!token) {
    return res.status(400).json({ error: 'Authorization token is missing' });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: { 'Authorization': token },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub user data' });
  }
});

// Handle the toggle request for autoReview (for both GitHub and GitLab)
app.post('/toggleAutoReview', (req, res) => {
  const { repoId, autoReview, platform } = req.body;

  if (!repoId || typeof autoReview === 'undefined' || !platform) {
    return res.status(400).json({ error: 'Missing repoId, autoReview status, or platform' });
  }

  // Validate the platform (either GitHub or GitLab)
  if (platform !== 'github' && platform !== 'gitlab') {
    return res.status(400).json({ error: 'Invalid platform specified. Choose either "github" or "gitlab".' });
  }

  // For simplicity, log the toggle request
  console.log(`${platform.charAt(0).toUpperCase() + platform.slice(1)} - Toggled repo with ID ${repoId} to autoReview: ${autoReview}`);

  // Send back a response with the updated status
  res.json({
    message: `Repository with ID ${repoId} on ${platform.charAt(0).toUpperCase() + platform.slice(1)} has been toggled to ${autoReview ? 'ON' : 'OFF'} for autoReview.`,
    repoId,
    autoReview,
    platform,
  });
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
