import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css'; // Reuse the same login styles

function UserLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if user just authenticated via magic link
  useEffect(() => {
    const checkSession = async () => {
      // Check for magic link errors in URL
      const urlError = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      if (urlError) {
        if (errorCode === 'otp_expired') {
          setError('This magic link has expired. Please request a new one below.');
        } else if (errorDescription) {
          setError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        } else {
          setError('Authentication failed. Please try again.');
        }
        // Clear the error from URL
        window.history.replaceState({}, '', '/user/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session && !session.user?.user_metadata?.role) {
        // User is authenticated (and not admin), redirect to dashboard
        console.log('Magic link session detected, redirecting to dashboard');
        navigate('/user/dashboard');
      }
    };

    checkSession();
  }, [navigate, searchParams]);

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
      setShowTokenInput(true);
      setLoading(false);
    } catch (err) {
      console.error('Magic link error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      console.log('Token verified successfully');
      navigate('/user/dashboard');
    } catch (err) {
      console.error('Token verification error:', err);
      setError('Invalid or expired code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Link 
        to="/admin/login"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          backgroundColor: '#fff',
          color: '#0d6efd',
          textDecoration: 'none',
          borderRadius: '6px',
          border: '1px solid #0d6efd',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#0d6efd';
          e.target.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.color = '#0d6efd';
        }}
      >
        Admin Portal
      </Link>
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

          {success && !showTokenInput && (
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
          
          {!showTokenInput ? (
            <button type="submit" className="login-button" disabled={loading || success}>
              {loading ? 'Sending...' : success ? 'Email Sent!' : 'Send Magic Link'}
            </button>
          ) : null}
          
          {!showTokenInput && (
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
              {success 
                ? "Didn't receive it? Check your spam folder or try again in a few minutes."
                : "No password needed - we'll send you a secure link to sign in"
              }
            </p>
          )}
        </form>

        {showTokenInput && (
          <form onSubmit={handleTokenSubmit} className="login-form" style={{ marginTop: '20px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#d1f2eb',
              border: '1px solid #a3e4d7',
              borderRadius: '6px',
              color: '#0c5e4a',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              <strong>✓ Email sent to {email}</strong>
              <br />
              Enter the 6-digit code from your email below:
            </div>

            <div className="form-group">
              <label htmlFor="token">6-Digit Code</label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                disabled={loading}
                maxLength={6}
                style={{
                  fontSize: '24px',
                  letterSpacing: '0.5em',
                  textAlign: 'center'
                }}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading || token.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTokenInput(false);
                setSuccess(false);
                setToken('');
              }}
              style={{
                marginTop: '12px',
                background: 'transparent',
                border: 'none',
                color: '#0d6efd',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserLogin;

