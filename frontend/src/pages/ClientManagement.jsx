import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ClientManagement.css';

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          created_at,
          programmes (count)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients. Please try again.');
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
      const clientData = {
        name: formData.name
      };

      if (editingClient) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (updateError) throw updateError;
      } else {
        // Create new client
        const { error: insertError } = await supabase
          .from('clients')
          .insert([clientData]);

        if (insertError) throw insertError;
      }

      // Reset form and refresh list
      setFormData({ name: '', cohort_size: '' });
      setShowForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      console.error('Error saving client:', err);
      setError(err.message || 'Failed to save client. Please try again.');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated programmes and data.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) throw deleteError;

      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '' });
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
    <div className="client-management">
      <div className="content-header">
        <div>
          <h1>Client Management</h1>
          <p className="content-description">
            Manage client organizations and their coaching programmes
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          + New Client
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h2>{editingClient ? 'Edit Client' : 'Create New Client'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                Client Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Acme Corporation"
                required
              />
              <p className="field-hint">
                The organization or company name
              </p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingClient ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-body">
        {loading ? (
          <div className="loading-state">
            <p>Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p>No clients yet</p>
            <p className="empty-state-hint">Create your first client to get started</p>
          </div>
        ) : (
          <div className="clients-table">
              <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Programmes</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="cell-primary">{client.name}</td>
                    <td>
                      <span className="badge">
                        {client.programmes?.[0]?.count || 0}
                      </span>
                    </td>
                    <td className="cell-secondary">{formatDate(client.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(client)}
                          title="Edit client"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDelete(client.id)}
                          title="Delete client"
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
  );
}

export default ClientManagement;

