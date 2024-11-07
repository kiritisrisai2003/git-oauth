import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Import the styles we just created
import App from './App'; // GitHub Login Component
import New from './New'; // GitLab Login Component
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

function Main() {
  // State to manage which component to display
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Handle button clicks to switch components
  const handleGitHubLogin = () => {
    setSelectedComponent(<App />); // Show GitHub component
  };

  const handleGitLabLogin = () => {
    setSelectedComponent(<New />); // Show GitLab component
  };

  return (
    <div>
      {/* Navbar with login options */}
      <div className="navbar">
        <button onClick={handleGitHubLogin}>Login with GitHub</button>
        <button onClick={handleGitLabLogin}>Login with GitLab</button>
      </div>

      {/* Main content */}
      <div className="container">
        <div className="app-container">
          {/* Conditionally render the selected component */}
          {selectedComponent || <h1>Welcome! Please select a login method.</h1>}
        </div>
      </div>
    </div>
  );
}

root.render(
  <Main />
);

// Optionally, you can include reportWebVitals if needed
reportWebVitals();
