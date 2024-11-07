import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

const clientID = '6271ba47b08f71f32e523d8772fbfcee74f6cd679abd91655ba07526f14e2a2f'; // Your GitLab OAuth Client ID

function New() {
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
      // Get access token after successful authorization
      async function getAccessToken() {
        try {
          const response = await fetch(`http://localhost:4000/gitlab/getAccessToken?code=${codeParam}`, {
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
    }
  }, [accessToken]);

  async function getUserData() {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('Access token is missing');
      return;
    }

    await fetch('https://gitlab.com/api/v4/user', {
      method: 'GET',
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        getUserRepos(data.id); // Fetch repositories once user data is fetched
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      });
  }

  async function getUserRepos(userId) {
    const token = localStorage.getItem('accessToken');

    if (!token || !userId) {
      console.error('Access token or user ID is missing');
      return;
    }

    await fetch(`https://gitlab.com/api/v4/users/${userId}/projects`, {
      method: 'GET',
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setRepos(data);
      })
      .catch((error) => {
        console.error('Error fetching repositories:', error);
      });
  }

  // Logout function
  function logout() {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUserData(null);
    setRepos([]);
    setCurrentPage(1);
  }

  // GitLab login function
  function loginWithGitLab() {
    window.location.assign(`https://gitlab.com/oauth/authorize?client_id=${clientID}&redirect_uri=http://localhost:3000&response_type=code&scope=read_api`);
  }

  // Pagination logic
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
        <h1>GitLab Dashboard</h1>
        {!accessToken ? (
          <button className="login-button" onClick={loginWithGitLab}>Login with GitLab</button>
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
                  <p><strong>Username:</strong> {userData.username}</p>
                  <img className="user-avatar" src={userData.avatar_url} alt="User Avatar" />
                </div>
              )
            )}

            <div className="user-repos">
              <h3>Your Projects</h3>
              {repos.length === 0 ? (
                <p>No projects found</p>
              ) : (
                <div>
                  <ul>
                    {currentRepos.map((repo) => (
                      <li key={repo.id}>
                        <div className="repo-info">
                          <a href={repo.web_url} target="_blank" rel="noopener noreferrer">
                            {repo.name}
                          </a>
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
          </div>
        )}
      </center>
    </div>
  );
}

export default New;
