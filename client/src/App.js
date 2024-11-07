import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

const clientID = 'Ov23liALUEtT4yXBPpdJ';
const clientSecret = '41cf1d1bbb6e5429871339a891fad73c018375fc';

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggleMessage, setToggleMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reposPerPage = 5;

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const codeParam = urlParams.get('code');

    if (codeParam && !accessToken) {
      async function getAccessToken() {
        try {
          const response = await fetch(`http://localhost:4000/github/getAccessToken?code=${codeParam}`, {
            method: 'GET',
          });
          const data = await response.json();
          if (data.access_token) {
            localStorage.setItem('accessToken', data.access_token);
            setAccessToken(data.access_token);
          }
        } catch (error) {
          console.error('Error fetching access token:', error);
        }
      }
      getAccessToken();
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      getUserData();
      getUserRepos();
    }
  }, [accessToken]);

  async function getUserData() {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('Access token is missing');
      return;
    }

    await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      });
  }

  async function getUserRepos() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('Access token is missing');
      return;
    }

    await fetch('https://api.github.com/user/repos', {
      method: 'GET',
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setRepos(data.map(repo => ({ ...repo, autoReview: false })));
      })
      .catch((error) => {
        console.error('Error fetching repositories:', error);
      });
  }

  async function toggleAutoReview(repoId, currentStatus) {
    try {
      const response = await axios.post('http://localhost:4000/toggleAutoReview', {
        repoId,
        autoReview: !currentStatus
      });

      setToggleMessage(response.data.message);
      setRepos(prevRepos =>
        prevRepos.map(repo =>
          repo.id === repoId ? { ...repo, autoReview: !currentStatus } : repo
        )
      );
    } catch (error) {
      console.error('Error toggling auto review:', error);
    }
  }

  function loginWithGitHub() {
    window.location.assign(`https://github.com/login/oauth/authorize?client_id=${clientID}`);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUserData(null);
    setRepos([]);
    setCurrentPage(1);
  }

  const lastRepoIndex = currentPage * reposPerPage;
  const firstRepoIndex = lastRepoIndex - reposPerPage;
  const currentRepos = repos.slice(firstRepoIndex, lastRepoIndex);

  const totalPages = Math.ceil(repos.length / reposPerPage);

  function handlePrevPage() {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  }

  function handleNextPage() {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  }

  return (
    <div className="app-container">
      <center>
        <h1>GitHub Dashboard</h1>
        {!accessToken ? (
          <button className="login-button" onClick={loginWithGitHub}>Login with GitHub</button>
        ) : (
          <div className="dashboard">
            <div className="header">
              <h3>Welcome to Your Dashboard</h3>
              <button className="logout-button" onClick={logout}>Logout</button>
            </div>

            {loading ? (
              <p>Loading user data...</p>
            ) : (
              userData && (
                <div className="user-data">
                  <h3>User Profile</h3>
                  <p><strong>Name:</strong> {userData.name}</p>
                  <p><strong>Username:</strong> {userData.login}</p>
                  <img className="user-avatar" src={userData.avatar_url} alt="User Avatar" />
                </div>
              )
            )}

            <div className="user-repos">
              <h3>Your Repositories</h3>
              {repos.length === 0 ? (
                <p>No repositories found</p>
              ) : (
                <div>
                  <ul>
                    {currentRepos.map((repo) => (
                      <li key={repo.id}>
                        <div className="repo-info">
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                            {repo.name}
                          </a>
                          <button
                            className={`toggle-btn ${repo.autoReview ? 'on' : 'off'}`}
                            onClick={() => toggleAutoReview(repo.id, repo.autoReview)}
                          >
                            {repo.autoReview ? 'Auto Review: ON' : 'Auto Review: OFF'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Pagination Controls */}
                  <div className="pagination">
                    <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
                  </div>
                </div>
              )}
            </div>

            {toggleMessage && <p>{toggleMessage}</p>}
          </div>
        )}
      </center>
    </div>
  );
}

export default App;
