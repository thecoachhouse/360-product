import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import SurveyComponent from '../components/SurveyComponent';
import './AssessmentPage.css';

function AssessmentPage({ onLogout }) {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessmentType, setAssessmentType] = useState(type || 'peer'); // onboarding, self, or peer
  const [templateId, setTemplateId] = useState(id);
  const [coacheeId, setCoacheeId] = useState(searchParams.get('coacheeId') || null);
  const [nominationId, setNominationId] = useState(null);
  const [template, setTemplate] = useState(null);
  const [title, setTitle] = useState('Assessment');

  useEffect(() => {
    loadAssessmentData();
  }, [type, id, coacheeId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate('/user/login');
        return;
      }

      // If templateId is provided, load template directly
      if (templateId) {
        const { data: templateData, error: templateError } = await supabase
          .from('assessment_templates')
          .select('id, name, survey_json, template_type')
          .eq('id', templateId)
          .single();

        if (templateError) {
          throw new Error(`Failed to load assessment template: ${templateError.message}`);
        }

        setTemplate(templateData);
        setAssessmentType(templateData.template_type || assessmentType);
        setTitle(templateData.name || 'Assessment');
        setLoading(false);
        return;
      }

      // Legacy route: /user/assessment/:id (without type)
      // This is for nominees completing peer assessments
      if (id && !type) {
        // Assume it's a nomination ID for peer assessment
        const { data: nomination, error: nomError } = await supabase
          .from('nominations')
          .select(`
            id,
            coachee_id,
            relationship_type,
            coachees (
              id,
              programme_id,
              programmes (
                id,
                assessment_templates (
                  id,
                  name,
                  survey_json,
                  template_type
                )
              )
            )
          `)
          .eq('id', id)
          .single();

        if (nomError) {
          throw new Error(`Failed to load nomination: ${nomError.message}`);
        }

        // Find peer assessment template for this coachee's programme
        const peerTemplate = nomination.coachees?.programmes?.assessment_templates?.find(
          t => t.template_type === 'peer'
        );

        if (!peerTemplate) {
          throw new Error('No peer assessment template found for this programme');
        }

        setTemplate(peerTemplate);
        setAssessmentType('peer');
        setCoacheeId(nomination.coachee_id);
        setNominationId(nomination.id);
        setTitle(`Peer Assessment - ${nomination.coachees?.full_name || 'Coachee'}`);
        setLoading(false);
        return;
      }

      // If we have coacheeId and type, load the appropriate template
      if (coacheeId && assessmentType) {
        const { data: coachee, error: coacheeError } = await supabase
          .from('coachees')
          .select(`
            id,
            programme_id,
            programmes (
              id,
              assessment_templates (
                id,
                name,
                survey_json,
                template_type
              )
            )
          `)
          .eq('id', coacheeId)
          .single();

        if (coacheeError) {
          throw new Error(`Failed to load coachee: ${coacheeError.message}`);
        }

        const foundTemplate = coachee.programmes?.assessment_templates?.find(
          t => t.template_type === assessmentType
        );

        if (!foundTemplate) {
          throw new Error(`No ${assessmentType} assessment template found for this programme`);
        }

        setTemplate(foundTemplate);
        setTitle(foundTemplate.name || `${assessmentType} Assessment`);
        setLoading(false);
        return;
      }

      throw new Error('Invalid assessment parameters');
    } catch (err) {
      console.error('Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back based on user type
    if (assessmentType === 'onboarding' || assessmentType === 'self') {
      navigate('/user/coachee/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const handleComplete = async (surveyData) => {
    // This will be called by SurveyComponent after submission
    // The actual save is handled in SurveyComponent
    // Navigate back to appropriate dashboard
    if (assessmentType === 'onboarding' || assessmentType === 'self') {
      navigate('/user/coachee/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="assessment-page">
        <Navbar onLogout={onLogout} userType="user" />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
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
            <p style={{ color: '#6c757d' }}>Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assessment-page">
        <Navbar onLogout={onLogout} userType="user" />
        <div className="assessment-container">
          <div className="assessment-header">
            <button className="back-button" onClick={handleBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Dashboard
            </button>
            <h1>Error Loading Assessment</h1>
          </div>
          <div style={{ padding: '24px', color: '#c33' }}>
            <p>{error}</p>
            <button 
              onClick={loadAssessmentData}
              style={{
                marginTop: '16px',
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
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-page">
      <Navbar onLogout={onLogout} userType="user" />
      
      <div className="assessment-container">
        <div className="assessment-header">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Dashboard
          </button>
          <h1>{title}</h1>
          <p className="assessment-subtitle">
            {assessmentType === 'onboarding' && 'Complete your onboarding to begin your journey'}
            {assessmentType === 'self' && 'Reflect on your leadership competencies'}
            {assessmentType === 'peer' && 'Provide feedback on your colleague'}
          </p>
        </div>
        
        <div className="survey-wrapper">
          {template && (
            <SurveyComponent 
              template={template}
              assessmentType={assessmentType}
              coacheeId={coacheeId}
              nominationId={nominationId}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AssessmentPage;

