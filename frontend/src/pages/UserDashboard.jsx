import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';
import './Dashboard.css';
import './UserDashboard.css';

function UserDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate('/user/login');
        return;
      }

      setUserEmail(user.email);

      // Fetch nominations for this user's email
      // Note: We match on nominee email since they might not have a nominee record yet
      const { data: nominations, error: nominationsError } = await supabase
        .from('nominations')
        .select(`
          id,
          relationship_type,
          created_at,
          coachee_id,
          coachees (
            id,
            full_name,
            email
          )
        `)
        .eq('nominees.email', user.email)
        .order('created_at', { ascending: false });

      if (nominationsError) {
        console.error('Error fetching nominations:', nominationsError);
        // If no nominations found via join, try getting nominees first
        const { data: nominee } = await supabase
          .from('nominees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (nominee) {
          const { data: nominationsById, error: nominationsByIdError } = await supabase
            .from('nominations')
            .select(`
              id,
              relationship_type,
              created_at,
              coachee_id,
              coachees (
                id,
                full_name,
                email
              )
            `)
            .eq('nominee_id', nominee.id)
            .order('created_at', { ascending: false });

          if (nominationsByIdError) {
            throw nominationsByIdError;
          }

          setAssessments(formatAssessments(nominationsById || []));
        } else {
          // No nominations found
          setAssessments([]);
        }
      } else {
        setAssessments(formatAssessments(nominations || []));
      }
    } catch (err) {
      console.error('Error in fetchAssessments:', err);
      setError('Failed to load your assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAssessments = (nominations) => {
    return nominations.map((nomination) => ({
      id: nomination.id,
      name: 'Turning Point 360 Assessment',
      coacheeName: nomination.coachees?.full_name || 'Unknown',
      coacheeEmail: nomination.coachees?.email || '',
      relationshipType: nomination.relationship_type,
      dueDate: new Date(nomination.created_at).toISOString().split('T')[0], // Use created date as placeholder
      status: 'pending'
    }));
  };

  const handleStartAssessment = (assessmentId) => {
    navigate(`/user/assessment/${assessmentId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} userType="user" />
      
      <div className="dashboard-content">
        <UserSidebar 
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
        />
        
        <main className="main-content">
          <div className="content-header">
            <h1>Your Assessments</h1>
            <p className="content-description">
              Complete peer assessments for your colleagues
            </p>
          </div>
          
          <div className="content-body">
            {loading ? (
              <div className="loading-state">
                <p>Loading your assessments...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p style={{ color: '#c33' }}>{error}</p>
                <button 
                  onClick={fetchAssessments}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : assessments.length === 0 ? (
              <div className="empty-state">
                <p>No assessments assigned yet.</p>
                <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '8px' }}>
                  You'll receive an email when someone nominates you to complete an assessment.
                </p>
              </div>
            ) : (
              <div className="assessments-list">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="assessment-card">
                    <div className="assessment-info">
                      <h3 className="assessment-name">{assessment.name}</h3>
                      <div className="assessment-details">
                        <span className="assessment-coachee">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          For: {assessment.coacheeName}
                        </span>
                        {assessment.relationshipType && (
                          <span className="assessment-relationship" style={{ marginLeft: '12px', color: '#6c757d', fontSize: '14px' }}>
                            ({assessment.relationshipType})
                          </span>
                        )}
                        <span className="assessment-due">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          Due: {formatDate(assessment.dueDate)}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="start-assessment-button"
                      onClick={() => handleStartAssessment(assessment.id)}
                    >
                      Start Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;

