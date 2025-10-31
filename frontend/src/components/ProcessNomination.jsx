import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import NomineeDropdown from './NomineeDropdown';
import './ProcessNomination.css';

function ProcessNomination({ nomination, onClose, onSuccess }) {
  const [processingMethod, setProcessingMethod] = useState('email'); // 'email' or 'existing'
  const [email, setEmail] = useState('');
  const [selectedNomineeId, setSelectedNomineeId] = useState(null);
  const [adminNotes, setAdminNotes] = useState(nomination.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingNominee, setExistingNominee] = useState(null);

  useEffect(() => {
    // Check if nominee is already linked
    if (nomination.nominee_id) {
      setExistingNominee(nomination.nominees);
      setProcessingMethod('existing');
      setSelectedNomineeId(nomination.nominee_id);
    }
  }, [nomination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');

      if (processingMethod === 'email') {
        // Validate email
        if (!email || !email.trim()) {
          setError('Please enter an email address');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setError('Please enter a valid email address');
          return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if nominee with this email already exists
        const { data: existingNominee, error: checkError } = await supabase
          .from('nominees')
          .select('id, full_name, email')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        let nomineeId;

        if (existingNominee) {
          // Link to existing nominee
          nomineeId = existingNominee.id;
          console.log('Linking to existing nominee:', existingNominee);
        } else {
          // Create new nominee
          const { data: newNominee, error: createError } = await supabase
            .from('nominees')
            .insert({
              full_name: nomination.pending_nominee_name,
              email: normalizedEmail
            })
            .select()
            .single();

          if (createError) throw createError;
          nomineeId = newNominee.id;
          console.log('Created new nominee:', newNominee);
        }

        // Update nomination with nominee_id
        await updateNomination(nomineeId);
      } else {
        // Link to existing nominee
        if (!selectedNomineeId) {
          setError('Please select an existing nominee');
          return;
        }

        await updateNomination(selectedNomineeId);
      }
    } catch (err) {
      console.error('Error processing nomination:', err);
      setError(err.message || 'Failed to process nomination. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateNomination = async (nomineeId) => {
    const { error: updateError } = await supabase
      .from('nominations')
      .update({
        nominee_id: nomineeId,
        status: 'approved',
        admin_notes: adminNotes.trim() || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', nomination.id);

    if (updateError) throw updateError;

    console.log('Nomination processed successfully');
    
    // Call success callback
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this nomination?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('nominations')
        .update({
          status: 'rejected',
          admin_notes: adminNotes.trim() || null,
          processed_at: new Date().toISOString()
        })
        .eq('id', nomination.id);

      if (updateError) throw updateError;

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error rejecting nomination:', err);
      setError(err.message || 'Failed to reject nomination. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content process-nomination" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Process Nomination</h2>
            <p className="modal-subtitle">
              {nomination.pending_nominee_name || nomination.nominees?.full_name} 
              {' '}• {nomination.relationship_type}
            </p>
            <p className="modal-subtitle-small">
              For: {nomination.coachees?.full_name}
            </p>
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

          {/* Processing Method Selection */}
          {!existingNominee && (
            <div className="form-group">
              <label>Processing Method:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="email"
                    checked={processingMethod === 'email'}
                    onChange={(e) => setProcessingMethod(e.target.value)}
                  />
                  <span>Add Email & Create New Nominee</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="existing"
                    checked={processingMethod === 'existing'}
                    onChange={(e) => setProcessingMethod(e.target.value)}
                  />
                  <span>Link to Existing Nominee</span>
                </label>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Add Email Method */}
            {processingMethod === 'email' && !existingNominee && (
              <>
                <div className="form-group">
                  <label htmlFor="nominee_name">
                    Nominee Name
                  </label>
                  <input
                    type="text"
                    id="nominee_name"
                    value={nomination.pending_nominee_name || ''}
                    readOnly
                    className="readonly-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., ryan.lloyd@company.com"
                    required
                    disabled={saving}
                  />
                  <p className="field-hint">
                    If a nominee with this email already exists, they will be linked automatically.
                  </p>
                </div>
              </>
            )}

            {/* Link to Existing Method */}
            {processingMethod === 'existing' && (
              <>
                <div className="form-group">
                  <label htmlFor="nominee_name">
                    Nominee Name
                  </label>
                  <input
                    type="text"
                    id="nominee_name"
                    value={nomination.pending_nominee_name || ''}
                    readOnly
                    className="readonly-input"
                  />
                  <p className="field-hint">
                    Search and select the existing nominee from the database
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="existing_nominee">
                    Select Existing Nominee <span className="required">*</span>
                  </label>
                  <NomineeDropdown
                    value={selectedNomineeId}
                    onChange={(nomineeId, nominee) => {
                      setSelectedNomineeId(nomineeId);
                      setExistingNominee(nominee);
                    }}
                    disabled={saving}
                  />
                  {existingNominee && selectedNomineeId && (
                    <div className="selected-nominee-info">
                      <p>Selected: <strong>{existingNominee.full_name}</strong></p>
                      <p>Email: {existingNominee.email}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Admin Notes */}
            <div className="form-group">
              <label htmlFor="admin_notes">
                Admin Notes <span className="field-hint">(optional)</span>
              </label>
              <textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this nomination..."
                rows={3}
                disabled={saving}
              />
            </div>

            {/* Relationship Type (read-only) */}
            <div className="form-group">
              <label>Relationship Type</label>
              <input
                type="text"
                value={nomination.relationship_type}
                readOnly
                className="readonly-input"
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReject}
                disabled={saving}
              >
                Reject Nomination
              </button>
              <div className="action-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || (processingMethod === 'existing' && !selectedNomineeId)}
                >
                  {saving ? 'Processing...' : 'Approve & Create Nomination'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProcessNomination;
