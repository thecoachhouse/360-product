import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('assessments');

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} />
      
      <div className="dashboard-content">
        <Sidebar 
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
        />
        
        <main className="main-content">
          <div className="content-header">
            <h1>Manage Assessments</h1>
            <p className="content-description">
              View and manage all 360° coaching assessments
            </p>
          </div>
          
          <div className="content-body">
            {/* Assessment management content will go here */}
            <div className="empty-state">
              <p>Assessment management interface coming soon...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

