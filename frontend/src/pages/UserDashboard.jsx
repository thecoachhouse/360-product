import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';
import './Dashboard.css';
import './UserDashboard.css';

function UserDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const navigate = useNavigate();

  // Dummy assessment data
  const assessments = [
    {
      id: 1,
      name: 'Turning Point 360 Assessment',
      coacheeName: 'Sarah Johnson',
      dueDate: '2025-10-20',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Turning Point 360 Assessment',
      coacheeName: 'Michael Chen',
      dueDate: '2025-10-22',
      status: 'pending'
    },
    {
      id: 3,
      name: 'Turning Point 360 Assessment',
      coacheeName: 'Emma Williams',
      dueDate: '2025-10-25',
      status: 'pending'
    },
    {
      id: 4,
      name: 'Turning Point 360 Assessment',
      coacheeName: 'David Martinez',
      dueDate: '2025-10-27',
      status: 'pending'
    },
    {
      id: 5,
      name: 'Turning Point 360 Assessment',
      coacheeName: 'Lisa Anderson',
      dueDate: '2025-10-30',
      status: 'pending'
    }
  ];

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
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;

