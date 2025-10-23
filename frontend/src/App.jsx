import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase, isAdmin } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserLogin from './pages/UserLogin';
import UserDashboard from './pages/UserDashboard';
import AssessmentPage from './pages/AssessmentPage';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    // Listen for auth changes (this handles magic link redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      console.log('📧 User email:', session?.user?.email);
      console.log('👤 User role:', session?.user?.user_metadata?.role);
      console.log('🎫 Session exists:', !!session);
      
      setSession(session);
      setUser(session?.user || null);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);

      // Handle magic link sign in
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User successfully signed in via magic link!');
      }

      // Log if there's an error
      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAdminLogin = (user) => {
    setUser(user);
    setUserRole(user?.user_metadata?.role);
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
  };

  const handleUserLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e9ecef',
            borderTopColor: '#0d6efd',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6c757d' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication states
  const isAdminAuthenticated = session && userRole === 'admin';
  const isUserAuthenticated = session && userRole !== 'admin'; // Any authenticated user who is not admin

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route 
          path="/admin/login" 
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Login onLogin={handleAdminLogin} />
            )
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            isAdminAuthenticated ? (
              <Dashboard onLogout={handleAdminLogout} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } 
        />

        {/* User Routes */}
        <Route 
          path="/user/login" 
          element={
            isUserAuthenticated ? (
              <Navigate to="/user/dashboard" replace />
            ) : (
              <UserLogin />
            )
          } 
        />
        <Route 
          path="/user/dashboard" 
          element={
            isUserAuthenticated ? (
              <UserDashboard onLogout={handleUserLogout} />
            ) : (
              <Navigate to="/user/login" replace />
            )
          } 
        />
        <Route 
          path="/user/assessment/:id" 
          element={
            isUserAuthenticated ? (
              <AssessmentPage onLogout={handleUserLogout} />
            ) : (
              <Navigate to="/user/login" replace />
            )
          } 
        />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/user/login" replace />} />
        <Route path="/login" element={<Navigate to="/user/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
