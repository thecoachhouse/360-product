import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ClientManagement.css'; // Reuse same styles

function ProgrammeManagement({ onNavigateToBuilder }) {
  const [programmes, setProgrammes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [viewingTemplates, setViewingTemplates] = useState(null);
  const [templates, setTemplates] = useState({ self: null, peer: null, onboarding: null });
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingSelf, setEditingSelf] = useState(false);
  const [editingPeer, setEditingPeer] = useState(false);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [selfJsonText, setSelfJsonText] = useState('');
  const [peerJsonText, setPeerJsonText] = useState('');
  const [onboardingJsonText, setOnboardingJsonText] = useState('');
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    cohort_size: '',
    min_senior_leaders: '1',
    min_peers: '2',
    min_direct_reports: '2'
  });

  useEffect(() => {
    fetchProgrammes();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('programmes')
        .select(`
          id,
          name,
          cohort_size,
          min_senior_leaders,
          min_peers,
          min_direct_reports,
          created_at,
          clients (
            id,
            name
          ),
          coachees (count),
          assessment_templates (count)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProgrammes(data || []);
    } catch (err) {
      console.error('Error fetching programmes:', err);
      setError('Failed to load programmes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      const programmeData = {
        client_id: formData.client_id,
        name: formData.name,
        cohort_size: formData.cohort_size ? parseInt(formData.cohort_size) : null,
        min_senior_leaders: parseInt(formData.min_senior_leaders),
        min_peers: parseInt(formData.min_peers),
        min_direct_reports: parseInt(formData.min_direct_reports)
      };

      if (editingProgramme) {
        const { error: updateError } = await supabase
          .from('programmes')
          .update(programmeData)
          .eq('id', editingProgramme.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('programmes')
          .insert([programmeData]);

        if (insertError) throw insertError;
      }

      setFormData({
        client_id: '',
        name: '',
        cohort_size: '',
        min_senior_leaders: '1',
        min_peers: '2',
        min_direct_reports: '2'
      });
      setShowForm(false);
      setEditingProgramme(null);
      fetchProgrammes();
    } catch (err) {
      console.error('Error saving programme:', err);
      setError(err.message || 'Failed to save programme. Please try again.');
    }
  };

  const handleEdit = (programme) => {
    setEditingProgramme(programme);
    setFormData({
      client_id: programme.clients.id,
      name: programme.name,
      cohort_size: programme.cohort_size || '',
      min_senior_leaders: programme.min_senior_leaders?.toString() || '1',
      min_peers: programme.min_peers?.toString() || '2',
      min_direct_reports: programme.min_direct_reports?.toString() || '2'
    });
    setShowForm(true);
  };

  const handleDelete = async (programmeId) => {
    if (!confirm('Are you sure you want to delete this programme? This will also delete all associated coachees, nominations, and assessments.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('programmes')
        .delete()
        .eq('id', programmeId);

      if (deleteError) throw deleteError;

      fetchProgrammes();
    } catch (err) {
      console.error('Error deleting programme:', err);
      setError('Failed to delete programme. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProgramme(null);
    setFormData({
      client_id: '',
      name: '',
      cohort_size: '',
      min_senior_leaders: '1',
      min_peers: '2',
      min_direct_reports: '2'
    });
  };

  const handleBuildAssessment = (programme) => {
    // Navigate to Assessment Builder with programme context
    if (onNavigateToBuilder) {
      onNavigateToBuilder(programme);
    }
  };

  const handleViewTemplates = async (programme) => {
    try {
      setLoadingTemplates(true);
      setViewingTemplates(programme);
      
      const { data, error: fetchError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('programme_id', programme.id);

      if (fetchError) throw fetchError;

      const selfTemplate = data?.find(t => t.template_type === 'self');
      const peerTemplate = data?.find(t => t.template_type === 'peer');
      const onboardingTemplate = data?.find(t => t.template_type === 'onboarding');

      setTemplates({
        self: selfTemplate,
        peer: peerTemplate,
        onboarding: onboardingTemplate
      });

      // Initialize editable JSON text
      if (selfTemplate) {
        setSelfJsonText(JSON.stringify(selfTemplate.survey_json, null, 2));
      }
      if (peerTemplate) {
        setPeerJsonText(JSON.stringify(peerTemplate.survey_json, null, 2));
      }
      if (onboardingTemplate) {
        setOnboardingJsonText(JSON.stringify(onboardingTemplate.survey_json, null, 2));
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load assessment templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCloseTemplateView = () => {
    setViewingTemplates(null);
    setTemplates({ self: null, peer: null, onboarding: null });
    setEditingSelf(false);
    setEditingPeer(false);
    setEditingOnboarding(false);
  };

  const handleSaveTemplate = async (type) => {
    try {
      setSavingTemplates(true);
      setError('');

      const jsonText = type === 'self' ? selfJsonText : type === 'peer' ? peerJsonText : onboardingJsonText;
      const template = type === 'self' ? templates.self : type === 'peer' ? templates.peer : templates.onboarding;

      // Validate JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (parseError) {
        setError(`Invalid JSON in ${type} template: ${parseError.message}`);
        return;
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('assessment_templates')
        .update({ survey_json: parsedJson })
        .eq('id', template.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedTemplate = { ...template, survey_json: parsedJson };
      if (type === 'self') {
        setTemplates({ ...templates, self: updatedTemplate });
        setEditingSelf(false);
      } else if (type === 'peer') {
        setTemplates({ ...templates, peer: updatedTemplate });
        setEditingPeer(false);
      } else {
        setTemplates({ ...templates, onboarding: updatedTemplate });
        setEditingOnboarding(false);
      }

      alert('Template updated successfully!');
    } catch (err) {
      console.error('Error saving template:', err);
      setError(`Failed to save ${type} template: ${err.message}`);
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleCancelEdit = (type) => {
    const template = type === 'self' ? templates.self : type === 'peer' ? templates.peer : templates.onboarding;
    if (type === 'self') {
      setSelfJsonText(JSON.stringify(template.survey_json, null, 2));
      setEditingSelf(false);
    } else if (type === 'peer') {
      setPeerJsonText(JSON.stringify(template.survey_json, null, 2));
      setEditingPeer(false);
    } else {
      setOnboardingJsonText(JSON.stringify(template.survey_json, null, 2));
      setEditingOnboarding(false);
    }
  };

  const extractQuestionMappings = (template) => {
    if (!template || !template.survey_json) return [];
    
    const mappings = [];
    const surveyJson = template.survey_json;
    
    const processElements = (elements) => {
      elements?.forEach(element => {
        if (element.type === 'panel' && element.elements) {
          processElements(element.elements);
        } else if (element.competency && element.name && element.title) {
          mappings.push({
            name: element.name,
            title: element.title,
            competencyId: element.competency
          });
        }
      });
    };

    surveyJson.pages?.forEach(page => {
      processElements(page.elements);
    });

    return mappings;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const hasTemplates = (programme) => {
    return programme.assessment_templates?.[0]?.count > 0;
  };

  return (
    <div className="client-management">
      <div className="content-header">
        <div>
          <h1>Programme Management</h1>
          <p className="content-description">
            Manage coaching programmes and their assessment configurations
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm || clients.length === 0}
        >
          + New Programme
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {clients.length === 0 && !loading && (
        <div className="alert alert-error">
          Please create at least one client before creating programmes.
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h2>{editingProgramme ? 'Edit Programme' : 'Create New Programme'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="client_id">
                Client <span className="required">*</span>
              </label>
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">
                Programme Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Leadership Development Q1 2025"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cohort_size">
                Cohort Size
                <span className="label-hint">(optional)</span>
              </label>
              <input
                type="number"
                id="cohort_size"
                name="cohort_size"
                value={formData.cohort_size}
                onChange={handleInputChange}
                placeholder="e.g., 15"
                min="1"
              />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '16px',
              marginTop: '20px'
            }}>
              <div className="form-group">
                <label htmlFor="min_senior_leaders">
                  Min. Senior Leaders <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="min_senior_leaders"
                  name="min_senior_leaders"
                  value={formData.min_senior_leaders}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="min_peers">
                  Min. Peers <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="min_peers"
                  name="min_peers"
                  value={formData.min_peers}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="min_direct_reports">
                  Min. Direct Reports <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="min_direct_reports"
                  name="min_direct_reports"
                  value={formData.min_direct_reports}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <p className="field-hint" style={{ marginTop: '8px' }}>
              Minimum nomination requirements for each relationship type
            </p>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingProgramme ? 'Update Programme' : 'Create Programme'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-body">
        {loading ? (
          <div className="loading-state">
            <p>Loading programmes...</p>
          </div>
        ) : programmes.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p>No programmes yet</p>
            <p className="empty-state-hint">Create your first programme to get started</p>
          </div>
        ) : (
          <div className="clients-table">
            <table>
              <thead>
                <tr>
                  <th>Programme Name</th>
                  <th>Client</th>
                  <th>Cohort</th>
                  <th>Min Nominations</th>
                  <th>Coachees</th>
                  <th>Templates</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((programme) => (
                  <tr key={programme.id}>
                    <td className="cell-primary">{programme.name}</td>
                    <td>{programme.clients?.name || 'N/A'}</td>
                    <td>{programme.cohort_size || '—'}</td>
                    <td className="cell-secondary" style={{ fontSize: '12px' }}>
                      SL:{programme.min_senior_leaders} · P:{programme.min_peers} · DR:{programme.min_direct_reports}
                    </td>
                    <td>
                      <span className="badge">
                        {programme.coachees?.[0]?.count || 0}
                      </span>
                    </td>
                    <td>
                      {hasTemplates(programme) ? (
                        <span className="badge" style={{ backgroundColor: '#d1f4e0', color: '#0f5132' }}>
                          ✓ {programme.assessment_templates?.[0]?.count}
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>
                          None
                        </span>
                      )}
                    </td>
                    <td className="cell-secondary">{formatDate(programme.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        {hasTemplates(programme) ? (
                          <button
                            className="btn-icon"
                            onClick={() => handleViewTemplates(programme)}
                            title="View assessment templates"
                            style={{ color: '#0d6efd' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        ) : (
                          <button
                            className="btn-icon"
                            onClick={() => handleBuildAssessment(programme)}
                            title="Build assessment"
                            style={{ color: '#198754' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                              <polyline points="2 17 12 22 22 17"></polyline>
                              <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(programme)}
                          title="Edit programme"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDelete(programme.id)}
                          title="Delete programme"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Viewer Modal */}
      {viewingTemplates && (
        <div className="modal-overlay" onClick={handleCloseTemplateView}>
          <div className="modal-content template-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assessment Templates - {viewingTemplates.name}</h2>
              <button className="modal-close" onClick={handleCloseTemplateView}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {loadingTemplates ? (
                <div className="loading-state">
                  <p>Loading templates...</p>
                </div>
              ) : (
                <>
                  {/* Self-Assessment Template */}
                  {templates.self && (
                    <div className="template-section">
                      <div className="template-header">
                        <h3>📊 Self-Assessment Template</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!editingSelf ? (
                            <>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => setEditingSelf(true)}
                              >
                                ✏️ Edit JSON
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => copyToClipboard(selfJsonText)}
                              >
                                📋 Copy JSON
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleSaveTemplate('self')}
                                disabled={savingTemplates}
                              >
                                {savingTemplates ? 'Saving...' : '💾 Save Changes'}
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => handleCancelEdit('self')}
                                disabled={savingTemplates}
                              >
                                ✖️ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="template-stats">
                        <div className="stat-item">
                          <span className="stat-label">Questions:</span>
                          <span className="stat-value">{extractQuestionMappings(templates.self).length}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Created:</span>
                          <span className="stat-value">{formatDate(templates.self.created_at)}</span>
                        </div>
                      </div>

                      <div className="json-preview">
                        {editingSelf ? (
                          <textarea
                            className="json-editor"
                            value={selfJsonText}
                            onChange={(e) => setSelfJsonText(e.target.value)}
                            rows={15}
                          />
                        ) : (
                          <pre>{selfJsonText}</pre>
                        )}
                      </div>

                      <div className="question-mappings">
                        <h4>Question → Competency Mappings ({extractQuestionMappings(templates.self).length})</h4>
                        <div className="mappings-list">
                          {extractQuestionMappings(templates.self).map((mapping, idx) => (
                            <div key={idx} className="mapping-item">
                              <span className="mapping-number">Q{idx + 1}</span>
                              <div className="mapping-details">
                                <div className="mapping-question">{mapping.title}</div>
                                <div className="mapping-meta">
                                  <code>{mapping.name}</code> → <span className="competency-id">{mapping.competencyId}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Peer-Assessment Template */}
                  {templates.peer && (
                    <div className="template-section">
                      <div className="template-header">
                        <h3>👥 Peer-Assessment Template</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!editingPeer ? (
                            <>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => setEditingPeer(true)}
                              >
                                ✏️ Edit JSON
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => copyToClipboard(peerJsonText)}
                              >
                                📋 Copy JSON
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleSaveTemplate('peer')}
                                disabled={savingTemplates}
                              >
                                {savingTemplates ? 'Saving...' : '💾 Save Changes'}
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => handleCancelEdit('peer')}
                                disabled={savingTemplates}
                              >
                                ✖️ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="template-stats">
                        <div className="stat-item">
                          <span className="stat-label">Questions:</span>
                          <span className="stat-value">{extractQuestionMappings(templates.peer).length}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Created:</span>
                          <span className="stat-value">{formatDate(templates.peer.created_at)}</span>
                        </div>
                      </div>

                      <div className="json-preview">
                        {editingPeer ? (
                          <textarea
                            className="json-editor"
                            value={peerJsonText}
                            onChange={(e) => setPeerJsonText(e.target.value)}
                            rows={15}
                          />
                        ) : (
                          <pre>{peerJsonText}</pre>
                        )}
                      </div>

                      <div className="question-mappings">
                        <h4>Question → Competency Mappings ({extractQuestionMappings(templates.peer).length})</h4>
                        <div className="mappings-list">
                          {extractQuestionMappings(templates.peer).map((mapping, idx) => (
                            <div key={idx} className="mapping-item">
                              <span className="mapping-number">Q{idx + 1}</span>
                              <div className="mapping-details">
                                <div className="mapping-question">{mapping.title}</div>
                                <div className="mapping-meta">
                                  <code>{mapping.name}</code> → <span className="competency-id">{mapping.competencyId}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Onboarding Assessment Template */}
                  {templates.onboarding && (
                    <div className="template-section">
                      <div className="template-header">
                        <h3>🎓 Onboarding Assessment Template</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!editingOnboarding ? (
                            <>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => setEditingOnboarding(true)}
                              >
                                ✏️ Edit JSON
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => copyToClipboard(onboardingJsonText)}
                              >
                                📋 Copy JSON
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => handleSaveTemplate('onboarding')}
                                disabled={savingTemplates}
                              >
                                {savingTemplates ? 'Saving...' : '💾 Save Changes'}
                              </button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => handleCancelEdit('onboarding')}
                                disabled={savingTemplates}
                              >
                                ✖️ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="template-stats">
                        <div className="stat-item">
                          <span className="stat-label">Created:</span>
                          <span className="stat-value">{formatDate(templates.onboarding.created_at)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Note:</span>
                          <span className="stat-value">No competency mapping required</span>
                        </div>
                      </div>

                      <div className="json-preview">
                        {editingOnboarding ? (
                          <textarea
                            className="json-editor"
                            value={onboardingJsonText}
                            onChange={(e) => setOnboardingJsonText(e.target.value)}
                            rows={15}
                          />
                        ) : (
                          <pre>{onboardingJsonText}</pre>
                        )}
                      </div>
                    </div>
                  )}

                  {!templates.self && !templates.peer && !templates.onboarding && (
                    <div className="empty-state">
                      <p>No templates found for this programme</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseTemplateView}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgrammeManagement;

