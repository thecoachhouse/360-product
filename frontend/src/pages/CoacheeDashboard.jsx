import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';
import './Dashboard.css';
import './UserDashboard.css';

function CoacheeDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [coachee, setCoachee] = useState(null);
  const [programme, setProgramme] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState({
    onboarding: { completed: false, templateId: null },
    self: { completed: false, templateId: null },
    peer: { total: 0, completed: 0, pending: 0 }
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoacheeData();
  }, []);

  const fetchCoacheeData = async () => {
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

      // Check if user is a coachee
      // Normalize email to lowercase for case-insensitive matching
      // Use maybeSingle() to avoid throwing error when no record found
      const normalizedEmail = user.email?.toLowerCase().trim();
      const { data: coacheeData, error: coacheeError } = await supabase
        .from('coachees')
        .select(`
          id,
          full_name,
          email,
          programme_id,
          programmes (
            id,
            name,
            clients (name)
          )
        `)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (coacheeError || !coacheeData) {
        // User is not a coachee - might be a nominee
        // Redirect to nominee dashboard (current UserDashboard)
        console.log('👤 User is not a coachee, redirecting to nominee dashboard');
        navigate('/user/dashboard', { replace: true });
        return;
      }

      console.log('✅ User is a coachee, loading CoacheeDashboard');

      setCoachee(coacheeData);
      setProgramme(coacheeData.programmes);

      // Fetch assessment templates for this programme
      const { data: templates, error: templatesError } = await supabase
        .from('assessment_templates')
        .select('id, name, template_type')
        .eq('programme_id', coacheeData.programme_id)
        .in('template_type', ['onboarding', 'self', 'peer']);

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
      }

      // Check which assessments are completed
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('assessment_template_id, submitted_at')
        .eq('coachee_id', coacheeData.id)
        .eq('respondent_email', user.email);

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      }

      // Map templates to status
      const templateMap = {};
      (templates || []).forEach(t => {
        templateMap[t.template_type] = t.id;
      });

      const completedTemplateIds = new Set((responses || []).map(r => r.assessment_template_id));

      // Get peer assessment status (only approved nominations)
      const { data: nominations, error: nominationsError } = await supabase
        .from('nominations')
        .select(`
          id,
          relationship_type,
          status,
          nominee_id,
          nominees (id, email)
        `)
        .eq('coachee_id', coacheeData.id)
        .eq('status', 'approved'); // Only get approved nominations

      if (nominationsError) {
        console.error('Error fetching nominations:', nominationsError);
      } else {
        console.log('Fetched approved nominations for coachee:', nominations);
      }

      // Count peer assessments (only approved nominations with nominee_id)
      const approvedNominations = (nominations || []).filter(n => n.nominee_id); // Ensure nominee_id exists
      const totalNominations = approvedNominations.length;
      console.log('Total approved nominations:', totalNominations);

      // Get peer assessment template ID for this programme
      const peerTemplateId = templateMap.peer;
      
      // Get all assessment responses for this coachee with the peer template
      const { data: peerResponses, error: peerResponsesError } = await supabase
        .from('assessment_responses')
        .select('id, respondent_email, submitted_at')
        .eq('coachee_id', coacheeData.id)
        .eq('assessment_template_id', peerTemplateId);

      if (peerResponsesError) {
        console.error('Error fetching peer assessment responses:', peerResponsesError);
      } else {
        console.log('Fetched peer assessment responses:', peerResponses);
      }

      // Count completed peer assessments
      // Check which nominees have completed their assessment by matching emails
      const completedPeerAssessments = approvedNominations.filter(
        nomination => {
          const nomineeEmail = nomination.nominees?.email?.toLowerCase();
          if (!nomineeEmail || !peerResponses) return false;
          
          // Check if there's a response with this nominee's email
          return peerResponses.some(response => 
            response.respondent_email?.toLowerCase() === nomineeEmail
          );
        }
      ).length;
      
      console.log('Completed peer assessments:', completedPeerAssessments, 'out of', totalNominations);

      setAssessmentStatus({
        onboarding: {
          completed: templateMap.onboarding ? completedTemplateIds.has(templateMap.onboarding) : false,
          templateId: templateMap.onboarding
        },
        self: {
          completed: templateMap.self ? completedTemplateIds.has(templateMap.self) : false,
          templateId: templateMap.self
        },
        peer: {
          total: totalNominations,
          completed: completedPeerAssessments,
          pending: totalNominations - completedPeerAssessments
        }
      });

    } catch (err) {
      console.error('Error in fetchCoacheeData:', err);
      setError('Failed to load your assessment journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = (type, templateId) => {
    // Navigate to assessment page with type and template info
    if (coachee && coachee.id) {
      navigate(`/user/assessment/${type}/${templateId}?coacheeId=${coachee.id}`);
    } else {
      console.error('Coachee ID not available');
    }
  };

  const getNextStep = () => {
    if (!assessmentStatus.onboarding.completed && assessmentStatus.onboarding.templateId) {
      return {
        type: 'onboarding',
        title: 'Complete Your Onboarding',
        description: 'Please start by completing the onboarding form to begin your coaching journey.',
        templateId: assessmentStatus.onboarding.templateId
      };
    }
    if (!assessmentStatus.self.completed && assessmentStatus.self.templateId) {
      return {
        type: 'self',
        title: 'Complete Your Self-Assessment',
        description: 'Reflect on your leadership competencies with the self-assessment.',
        templateId: assessmentStatus.self.templateId
      };
    }
    return null;
  };

  const nextStep = getNextStep();

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
            <h1>Your Assessment Journey</h1>
            <p className="content-description">
              Welcome, {coachee?.full_name || userEmail}. Track your progress through the Turning Point 360 assessment.
            </p>
          </div>
          
          <div className="content-body">
            {loading ? (
              <div className="loading-state">
                <p>Loading your assessment journey...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p style={{ color: '#c33' }}>{error}</p>
                <button 
                  onClick={fetchCoacheeData}
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
            ) : (
              <div>
                {/* Next Step Section */}
                {nextStep && (
                  <div style={{
                    backgroundColor: '#e7f3ff',
                    border: '2px solid #0d6efd',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '32px'
                  }}>
                    <h2 style={{ marginTop: 0, color: '#0d6efd' }}>Next Step: {nextStep.title}</h2>
                    <p style={{ marginBottom: '16px', color: '#495057' }}>{nextStep.description}</p>
                    <button
                      onClick={() => handleStartAssessment(nextStep.type, nextStep.templateId)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Start {nextStep.type === 'onboarding' ? 'Onboarding' : 'Self-Assessment'} →
                    </button>
                  </div>
                )}

                {/* Assessment Status Cards */}
                <div style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
                  {/* Onboarding Status */}
                  <div className="assessment-card" style={{
                    border: assessmentStatus.onboarding.completed ? '2px solid #28a745' : '1px solid #dee2e6'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0 }}>Onboarding Form</h3>
                      {assessmentStatus.onboarding.completed ? (
                        <span style={{ color: '#28a745', fontWeight: '600' }}>✅ Completed</span>
                      ) : (
                        <span style={{ color: '#ffc107', fontWeight: '600' }}>⏱️ Pending</span>
                      )}
                    </div>
                    <p style={{ color: '#6c757d', marginBottom: '16px' }}>
                      Complete your onboarding questionnaire to begin your coaching journey.
                    </p>
                    {!assessmentStatus.onboarding.completed && assessmentStatus.onboarding.templateId && (
                      <button
                        onClick={() => handleStartAssessment('onboarding', assessmentStatus.onboarding.templateId)}
                        className="start-assessment-button"
                      >
                        Start Onboarding
                      </button>
                    )}
                  </div>

                  {/* Self-Assessment Status */}
                  <div className="assessment-card" style={{
                    border: assessmentStatus.self.completed ? '2px solid #28a745' : '1px solid #dee2e6',
                    opacity: assessmentStatus.onboarding.completed ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0 }}>Self-Assessment</h3>
                      {assessmentStatus.self.completed ? (
                        <span style={{ color: '#28a745', fontWeight: '600' }}>✅ Completed</span>
                      ) : (
                        <span style={{ color: '#ffc107', fontWeight: '600' }}>⏱️ Pending</span>
                      )}
                    </div>
                    <p style={{ color: '#6c757d', marginBottom: '16px' }}>
                      Reflect on your leadership competencies and rate yourself across all dimensions.
                    </p>
                    {assessmentStatus.onboarding.completed && !assessmentStatus.self.completed && assessmentStatus.self.templateId && (
                      <button
                        onClick={() => handleStartAssessment('self', assessmentStatus.self.templateId)}
                        className="start-assessment-button"
                      >
                        Start Self-Assessment
                      </button>
                    )}
                    {!assessmentStatus.onboarding.completed && (
                      <p style={{ fontSize: '14px', color: '#6c757d', fontStyle: 'italic' }}>
                        Complete onboarding first to unlock this assessment.
                      </p>
                    )}
                  </div>

                  {/* Peer Assessment Status */}
                  <div className="assessment-card" style={{
                    border: assessmentStatus.self.completed ? '2px solid #28a745' : '1px solid #dee2e6',
                    opacity: assessmentStatus.self.completed ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0 }}>Peer Assessments</h3>
                      <span style={{ color: '#6c757d', fontWeight: '600' }}>
                        {assessmentStatus.peer.completed}/{assessmentStatus.peer.total} Complete
                      </span>
                    </div>
                    <p style={{ color: '#6c757d', marginBottom: '16px' }}>
                      Your nominated peers are providing feedback on your leadership. You'll see results once all assessments are complete.
                    </p>
                    {assessmentStatus.self.completed && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ 
                          backgroundColor: '#f8f9fa', 
                          padding: '12px', 
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}>
                          <strong>Progress:</strong> {assessmentStatus.peer.completed} of {assessmentStatus.peer.total} peer assessments completed
                          {assessmentStatus.peer.pending > 0 && (
                            <span style={{ color: '#ffc107', marginLeft: '8px' }}>
                              ({assessmentStatus.peer.pending} pending)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {!assessmentStatus.self.completed && (
                      <p style={{ fontSize: '14px', color: '#6c757d', fontStyle: 'italic' }}>
                        Complete your self-assessment first to see peer assessment progress.
                      </p>
                    )}
                  </div>
                </div>

                {/* Programme Information */}
                {programme && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginTop: '24px'
                  }}>
                    <h3 style={{ marginTop: 0 }}>Programme Details</h3>
                    <p><strong>Programme:</strong> {programme.name}</p>
                    {programme.clients && (
                      <p><strong>Client:</strong> {programme.clients.name}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CoacheeDashboard;
