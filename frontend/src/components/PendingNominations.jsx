import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ProcessNomination from './ProcessNomination';
import './PendingNominations.css';

function PendingNominations({ selectedProgramme = null }) {
  const [pendingNominations, setPendingNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [relationshipFilter, setRelationshipFilter] = useState('all'); // 'all', 'Peer', 'Direct Report', 'Senior Leader'

  useEffect(() => {
    fetchPendingNominations();
  }, [selectedProgramme, filter, relationshipFilter]);

  const fetchPendingNominations = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('nominations')
        .select(`
          id,
          coachee_id,
          nominee_id,
          relationship_type,
          pending_nominee_name,
          status,
          admin_notes,
          created_at,
          processed_at,
          coachees (
            id,
            full_name,
            email,
            programmes (
              id,
              name,
              clients (
                id,
                name
              )
            )
          ),
          nominees (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by status
      if (filter !== 'all') {
        query = query.eq('status', filter);
      } else {
        // Show pending first when 'all' is selected
        query = query.in('status', ['pending', 'approved', 'rejected']);
      }

      // Filter by relationship type
      if (relationshipFilter !== 'all') {
        query = query.eq('relationship_type', relationshipFilter);
      }

      // Filter by programme if selected
      if (selectedProgramme) {
        query = query.eq('coachees.programmes.id', selectedProgramme.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPendingNominations(data || []);
    } catch (err) {
      console.error('Error fetching pending nominations:', err);
      setError('Failed to load pending nominations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessNomination = (nomination) => {
    setSelectedNomination(nomination);
  };

  const handleNominationProcessed = () => {
    setSelectedNomination(null);
    fetchPendingNominations();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '⏱️ Pending', color: '#ffc107', bg: '#fff3cd' },
      approved: { text: '✅ Approved', color: '#198754', bg: '#d1e7dd' },
      rejected: { text: '✗ Rejected', color: '#dc3545', bg: '#f8d7da' }
    };
    return badges[status] || badges.pending;
  };

  const getRelationshipBadge = (type) => {
    const colors = {
      'Peer': '#0d6efd',
      'Direct Report': '#198754',
      'Senior Leader': '#6f42c1'
    };
    return colors[type] || '#6c757d';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group nominations by coachee
  const groupedNominations = pendingNominations.reduce((acc, nomination) => {
    const coacheeId = nomination.coachee_id;
    if (!acc[coacheeId]) {
      acc[coacheeId] = {
        coachee: nomination.coachees,
        nominations: []
      };
    }
    acc[coacheeId].nominations.push(nomination);
    return acc;
  }, {});

  const pendingCount = pendingNominations.filter(n => n.status === 'pending').length;
  const approvedCount = pendingNominations.filter(n => n.status === 'approved').length;
  const rejectedCount = pendingNominations.filter(n => n.status === 'rejected').length;

  return (
    <div className="pending-nominations">
      <div className="content-header">
        <div>
          <h1>Pending Nominations</h1>
          <p className="content-description">
            Process nominations from onboarding assessments by adding email addresses or linking to existing nominees
          </p>
        </div>
        <div className="status-summary">
          <span className="summary-badge pending">
            ⏱️ {pendingCount} Pending
          </span>
          <span className="summary-badge approved">
            ✅ {approvedCount} Approved
          </span>
          <span className="summary-badge rejected">
            ✗ {rejectedCount} Rejected
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All ({pendingNominations.length})</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="approved">Approved ({approvedCount})</option>
            <option value="rejected">Rejected ({rejectedCount})</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Relationship:</label>
          <select 
            value={relationshipFilter} 
            onChange={(e) => setRelationshipFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="Peer">Peer</option>
            <option value="Direct Report">Direct Report</option>
            <option value="Senior Leader">Senior Leader</option>
          </select>
        </div>
      </div>

      {/* Nominations List */}
      <div className="content-body">
        {loading ? (
          <div className="loading-state">
            <p>Loading pending nominations...</p>
          </div>
        ) : pendingNominations.length === 0 ? (
          <div className="empty-state">
            <p>No nominations found</p>
            <p className="empty-state-hint">
              {filter !== 'all' 
                ? `No ${filter} nominations match your filters`
                : 'Nominations will appear here after coachees complete onboarding assessments'}
            </p>
          </div>
        ) : (
          <div className="nominations-list">
            {Object.values(groupedNominations).map((group, idx) => (
              <div key={group.coachee.id} className="coachee-group">
                <div className="coachee-header">
                  <h3>{group.coachee.full_name}</h3>
                  <span className="coachee-email">{group.coachee.email}</span>
                  {group.coachee.programmes && (
                    <span className="coachee-programme">
                      {group.coachee.programmes.name}
                      {group.coachee.programmes.clients && (
                        <span className="coachee-client">
                          {' '}• {group.coachee.programmes.clients.name}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                
                <table className="nominations-table">
                  <thead>
                    <tr>
                      <th>Nominee Name</th>
                      <th>Relationship</th>
                      <th>Status</th>
                      <th>Processed</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.nominations.map((nomination) => {
                      const statusBadge = getStatusBadge(nomination.status);
                      const relationshipColor = getRelationshipBadge(nomination.relationship_type);
                      const nomineeName = nomination.nominees?.full_name || nomination.pending_nominee_name;
                      
                      return (
                        <tr key={nomination.id}>
                          <td className="cell-primary">
                            {nomineeName}
                            {nomination.nominees?.email && (
                              <div className="nominee-email">{nomination.nominees.email}</div>
                            )}
                          </td>
                          <td>
                            <span 
                              className="relationship-badge"
                              style={{ 
                                backgroundColor: relationshipColor + '20',
                                color: relationshipColor
                              }}
                            >
                              {nomination.relationship_type}
                            </span>
                          </td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ 
                                backgroundColor: statusBadge.bg,
                                color: statusBadge.color
                              }}
                            >
                              {statusBadge.text}
                            </span>
                          </td>
                          <td className="cell-secondary">
                            {formatDate(nomination.processed_at)}
                          </td>
                          <td className="cell-secondary">
                            {formatDate(nomination.created_at)}
                          </td>
                          <td>
                            {nomination.status === 'pending' ? (
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleProcessNomination(nomination)}
                              >
                                Process
                              </button>
                            ) : (
                              <span className="cell-secondary">
                                {nomination.status === 'approved' ? '✓' : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Nomination Modal */}
      {selectedNomination && (
        <ProcessNomination
          nomination={selectedNomination}
          onClose={() => setSelectedNomination(null)}
          onSuccess={handleNominationProcessed}
        />
      )}
    </div>
  );
}

export default PendingNominations;
