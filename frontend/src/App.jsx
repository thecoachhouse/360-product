import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserLogin from './pages/UserLogin';
import UserDashboard from './pages/UserDashboard';
import AssessmentPage from './pages/AssessmentPage';
import './App.css';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  const handleUserLogin = () => {
    setIsUserAuthenticated(true);
  };

  const handleUserLogout = () => {
    setIsUserAuthenticated(false);
  };

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
              <UserLogin onLogin={handleUserLogin} />
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
