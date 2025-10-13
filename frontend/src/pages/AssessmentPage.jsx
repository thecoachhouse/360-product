import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SurveyComponent from '../components/SurveyComponent';
import './AssessmentPage.css';

function AssessmentPage({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/user/dashboard');
  };

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
          <h1>Turning Point 360 Assessment</h1>
          <p className="assessment-subtitle">Assessment ID: {id}</p>
        </div>
        
        <div className="survey-wrapper">
          <SurveyComponent />
        </div>
      </div>
    </div>
  );
}

export default AssessmentPage;

