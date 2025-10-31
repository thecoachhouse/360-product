import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './CoacheeManagement.css';

function CoacheeManagement({ programme, onClose, onUpdate }) {
  const [coachees, setCoachees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingCoachee, setEditingCoachee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });
  const [csvText, setCsvText] = useState('');
  const [importErrors, setImportErrors] = useState([]);

  useEffect(() => {
    if (programme) {
      fetchCoachees();
    }
  }, [programme]);

  const fetchCoachees = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('coachees')
        .select(`
          id,
          full_name,
          email,
          created_at,
          nominations (count),
          assessment_responses (count)
        `)
        .eq('programme_id', programme.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCoachees(data || []);
    } catch (err) {
      console.error('Error fetching coachees:', err);
      setError('Failed to load coachees. Please try again.');
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
      setSaving(true);
      setError('');

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Check if email already exists
      const { data: existingCoachee } = await supabase
        .from('coachees')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingCoachee && (!editingCoachee || existingCoachee.id !== editingCoachee.id)) {
        setError('A coachee with this email already exists');
        return;
      }

      const coacheeData = {
        programme_id: programme.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase()
      };

      if (editingCoachee) {
        // Update existing coachee
        const { error: updateError } = await supabase
          .from('coachees')
          .update(coacheeData)
          .eq('id', editingCoachee.id);

        if (updateError) throw updateError;
      } else {
        // Create new coachee
        const { error: insertError } = await supabase
          .from('coachees')
          .insert([coacheeData]);

        if (insertError) throw insertError;
      }

      // Reset form and refresh
      setFormData({ full_name: '', email: '' });
      setShowAddForm(false);
      setEditingCoachee(null);
      fetchCoachees();
      
      // Notify parent to refresh programme list
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving coachee:', err);
      setError(err.message || 'Failed to save coachee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coachee) => {
    setEditingCoachee(coachee);
    setFormData({
      full_name: coachee.full_name,
      email: coachee.email
    });
    setShowAddForm(true);
    setShowImportForm(false);
  };

  const handleDelete = async (coacheeId) => {
    if (!confirm('Are you sure you want to delete this coachee? This will also delete all associated nominations and assessment responses.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('coachees')
        .delete()
        .eq('id', coacheeId);

      if (deleteError) throw deleteError;

      fetchCoachees();
      
      // Notify parent to refresh programme list
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error deleting coachee:', err);
      setError(err.message || 'Failed to delete coachee. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ full_name: '', email: '' });
    setShowAddForm(false);
    setShowImportForm(false);
    setEditingCoachee(null);
    setCsvText('');
    setImportErrors([]);
  };

  const handleCsvImport = async () => {
    try {
      setSaving(true);
      setError('');
      setImportErrors([]);

      if (!csvText.trim()) {
        setError('Please paste CSV data');
        return;
      }

      // Parse CSV (basic implementation - expects: name,email or full_name,email)
      const lines = csvText.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      // Find column indices
      const nameIndex = headers.findIndex(h => h === 'name' || h === 'full_name' || h === 'full name');
      const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail');

      if (nameIndex === -1 || emailIndex === -1) {
        setError('CSV must contain "name" (or "full_name") and "email" columns');
        return;
      }

      // Parse rows
      const coacheesToAdd = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const name = values[nameIndex];
        const email = values[emailIndex];

        if (!name || !email) {
          errors.push(`Row ${i + 1}: Missing name or email`);
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 1}: Invalid email format (${email})`);
          continue;
        }

        coacheesToAdd.push({
          programme_id: programme.id,
          full_name: name,
          email: email.toLowerCase()
        });
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        if (coacheesToAdd.length === 0) {
          return;
        }
      }

      // Check for duplicate emails in CSV
      const emailSet = new Set();
      const duplicates = [];
      coacheesToAdd.forEach((coachee, index) => {
        if (emailSet.has(coachee.email)) {
          duplicates.push(`Row ${index + 2}: Duplicate email (${coachee.email})`);
        } else {
          emailSet.add(coachee.email);
        }
      });

      if (duplicates.length > 0) {
        setImportErrors(prev => [...prev, ...duplicates]);
      }

      // Check for existing emails in database
      const emails = coacheesToAdd.map(c => c.email);
      const { data: existing } = await supabase
        .from('coachees')
        .select('email')
        .in('email', emails);

      const existingEmails = new Set(existing?.map(c => c.email) || []);
      const newCoachees = coacheesToAdd.filter(c => !existingEmails.has(c.email));

      if (newCoachees.length === 0) {
        setError('All coachees in CSV already exist in database');
        return;
      }

      // Insert new coachees
      const { error: insertError } = await supabase
        .from('coachees')
        .insert(newCoachees);

      if (insertError) throw insertError;

      // Show success with warnings if any
      const skipped = coacheesToAdd.length - newCoachees.length;
      if (skipped > 0) {
        setImportErrors(prev => [...prev, `${skipped} coachee(s) skipped (already exist)`]);
      }

      // Refresh and close
      setCsvText('');
      fetchCoachees();
      
      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => {
        setShowImportForm(false);
        setImportErrors([]);
      }, 2000);
    } catch (err) {
      console.error('Error importing coachees:', err);
      setError(err.message || 'Failed to import coachees. Please check your CSV format.');
    } finally {
      setSaving(false);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content coachee-management" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Manage Coachees</h2>
            <p className="modal-subtitle">{programme?.name || 'Programme'}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="alert alert-warning">
              <strong>Import Warnings:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {importErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-bar">
            <button 
              className="btn-primary"
              onClick={() => {
                setShowAddForm(true);
                setShowImportForm(false);
                setEditingCoachee(null);
                setFormData({ full_name: '', email: '' });
              }}
            >
              + Add Coachee
            </button>
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowImportForm(true);
                setShowAddForm(false);
                setEditingCoachee(null);
                setCsvText('');
              }}
            >
              📥 Import from CSV
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="form-card">
              <h3>{editingCoachee ? 'Edit Coachee' : 'Add New Coachee'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="full_name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Sarah Johnson"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., sarah.johnson@example.com"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingCoachee ? 'Update Coachee' : 'Add Coachee'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CSV Import Form */}
          {showImportForm && (
            <div className="form-card">
              <h3>Import Coachees from CSV</h3>
              <p className="field-hint" style={{ marginBottom: '16px' }}>
                CSV format: <code>name,email</code> or <code>full_name,email</code>
                <br />
                Example:
                <br />
                <code style={{ display: 'block', marginTop: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  name,email<br />
                  Sarah Johnson,sarah.johnson@example.com<br />
                  Michael Chen,michael.chen@example.com
                </code>
              </p>
              <div className="form-group">
                <label htmlFor="csv_text">
                  Paste CSV Data <span className="required">*</span>
                </label>
                <textarea
                  id="csv_text"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,email&#10;Sarah Johnson,sarah.johnson@example.com&#10;Michael Chen,michael.chen@example.com"
                  rows={10}
                  style={{ 
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleCsvImport}
                  disabled={saving || !csvText.trim()}
                >
                  {saving ? 'Importing...' : 'Import Coachees'}
                </button>
              </div>
            </div>
          )}

          {/* Coachees List */}
          {loading ? (
            <div className="loading-state">
              <p>Loading coachees...</p>
            </div>
          ) : coachees.length === 0 ? (
            <div className="empty-state">
              <p>No coachees in this programme yet.</p>
              <p className="empty-state-hint">Add your first coachee to get started</p>
            </div>
          ) : (
            <div className="coachees-table-container">
              <table className="coachees-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Nominations</th>
                    <th>Responses</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coachees.map((coachee) => (
                    <tr key={coachee.id}>
                      <td className="cell-primary">{coachee.full_name}</td>
                      <td>{coachee.email}</td>
                      <td>
                        <span className="badge">
                          {coachee.nominations?.[0]?.count || 0}
                        </span>
                      </td>
                      <td>
                        <span className="badge">
                          {coachee.assessment_responses?.[0]?.count || 0}
                        </span>
                      </td>
                      <td className="cell-secondary">{formatDate(coachee.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(coachee)}
                            title="Edit coachee"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(coachee.id)}
                            title="Delete coachee"
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
      </div>
    </div>
  );
}

export default CoacheeManagement;
