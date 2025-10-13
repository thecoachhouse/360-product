import { useState } from 'react';
import './Login.css'; // Reuse the same login styles

function UserLogin({ onLogin }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Temporary login - just check if email is filled
    // Later this will be replaced with magic link
    if (email) {
      onLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Turning Point 360</h1>
        <p className="login-subtitle">Complete Your Assessment</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.com"
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Send Magic Link
          </button>
          
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
            For now, just enter your email to continue
          </p>
        </form>
      </div>
    </div>
  );
}

export default UserLogin;

