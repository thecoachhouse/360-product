import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ClientManagement from './ClientManagement';
import ProgrammeManagement from './ProgrammeManagement';
import AssessmentBuilder from './AssessmentBuilder';
import PendingNominations from '../components/PendingNominations';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('assessments');
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [coachees, setCoachees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedSection === 'assessments') {
      fetchCoachees();
    }
  }, [selectedSection]);

  const fetchCoachees = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch coachees with their program and client information
      const { data, error: fetchError } = await supabase
        .from('coachees')
        .select(`
          id,
          full_name,
          email,
          created_at,
          programmes (
            id,
            name,
            clients (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Fetch nomination counts for each coachee
      const coacheesWithStats = await Promise.all(
        (data || []).map(async (coachee) => {
          const { count } = await supabase
            .from('nominations')
            .select('*', { count: 'exact', head: true })
            .eq('coachee_id', coachee.id);

          return {
            ...coachee,
            nominationCount: count || 0
          };
        })
      );

      setCoachees(coacheesWithStats);
    } catch (err) {
      console.error('Error fetching coachees:', err);
      setError('Failed to load coachees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleNavigateToBuilder = (programme) => {
    setSelectedProgramme(programme);
    setSelectedSection('builder');
  };

  const handleBackFromBuilder = () => {
    setSelectedProgramme(null);
    setSelectedSection('programmes');
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'clients':
        return <ClientManagement />;
      
      case 'programmes':
        return (
          <ProgrammeManagement 
            onNavigateToBuilder={handleNavigateToBuilder}
          />
        );
      
      case 'builder':
        return (
          <AssessmentBuilder 
            selectedProgramme={selectedProgramme}
            onBack={handleBackFromBuilder}
          />
        );
      
      case 'pending-nominations':
        return (
          <PendingNominations 
            selectedProgramme={selectedProgramme}
          />
        );
      
      case 'assessments':
      default:
        return (
          <>
            <div className="content-header">
              <h1>Manage Assessments</h1>
              <p className="content-description">
                View and manage all 360° coaching assessments
              </p>
            </div>
            
            <div className="content-body">
              {loading ? (
                <div className="loading-state">
                  <p>Loading coachees...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p style={{ color: '#c33' }}>{error}</p>
                  <button 
                    onClick={fetchCoachees}
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
              ) : coachees.length === 0 ? (
                <div className="empty-state">
                  <p>No coachees found. Add your first coachee to get started.</p>
                </div>
              ) : (
                <div className="coachees-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Program</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Client</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>Nominations</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coachees.map((coachee) => (
                        <tr key={coachee.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '12px' }}>{coachee.full_name}</td>
                          <td style={{ padding: '12px', color: '#6c757d' }}>{coachee.email}</td>
                          <td style={{ padding: '12px' }}>
                            {coachee.programmes?.name || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {coachee.programmes?.clients?.name || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: coachee.nominationCount > 0 ? '#d1e7dd' : '#f8f9fa',
                              color: coachee.nominationCount > 0 ? '#0f5132' : '#6c757d',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: 500
                            }}>
                              {coachee.nominationCount}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#6c757d', fontSize: '14px' }}>
                            {formatDate(coachee.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} />
      
      <div className="dashboard-content">
        <Sidebar 
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
        />
        
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

