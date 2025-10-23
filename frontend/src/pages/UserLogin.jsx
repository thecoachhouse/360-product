import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css'; // Reuse the same login styles

function UserLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user just authenticated via magic link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !session.user?.user_metadata?.role) {
        // User is authenticated (and not admin), redirect to dashboard
        console.log('Magic link session detected, redirecting to dashboard');
        navigate('/user/dashboard');
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Send magic link via Supabase
      // Redirect to login page so token can be processed, then auto-redirect to dashboard
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/user/login`,
        }
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
        setLoading(false);
        return;
      }

      // Success - show message
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Magic link error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
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
              disabled={loading || success}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '14px',
              marginTop: '8px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              backgroundColor: '#d1f2eb',
              border: '1px solid #a3e4d7',
              borderRadius: '6px',
              color: '#0c5e4a',
              fontSize: '14px',
              marginTop: '8px'
            }}>
              <strong>✓ Check your email!</strong>
              <br />
              We've sent a magic link to <strong>{email}</strong>
              <br />
              Click the link in the email to sign in.
            </div>
          )}
          
          <button type="submit" className="login-button" disabled={loading || success}>
            {loading ? 'Sending...' : success ? 'Email Sent!' : 'Send Magic Link'}
          </button>
          
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
            {success 
              ? "Didn't receive it? Check your spam folder or try again in a few minutes."
              : "No password needed - we'll send you a secure link to sign in"
            }
          </p>
        </form>
      </div>
    </div>
  );
}

export default UserLogin;

