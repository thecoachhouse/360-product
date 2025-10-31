import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './NomineeDropdown.css';

function NomineeDropdown({ value, onChange, disabled = false }) {
  const [nominees, setNominees] = useState([]);
  const [filteredNominees, setFilteredNominees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNominees();
  }, []);

  useEffect(() => {
    // Filter nominees based on search term
    if (!searchTerm.trim()) {
      setFilteredNominees(nominees);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = nominees.filter(nominee => {
        const nameMatch = nominee.full_name?.toLowerCase().includes(term);
        const emailMatch = nominee.email?.toLowerCase().includes(term);
        return nameMatch || emailMatch;
      });
      setFilteredNominees(filtered);
    }
  }, [searchTerm, nominees]);

  useEffect(() => {
    // Find selected nominee when value changes
    if (value) {
      const nominee = nominees.find(n => n.id === value);
      setSelectedNominee(nominee || null);
      if (nominee) {
        setSearchTerm(nominee.full_name || '');
      }
    } else {
      setSelectedNominee(null);
      setSearchTerm('');
    }
  }, [value, nominees]);

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNominees = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('nominees')
        .select('id, full_name, email, created_at')
        .order('full_name', { ascending: true });

      if (error) throw error;

      setNominees(data || []);
      setFilteredNominees(data || []);
    } catch (err) {
      console.error('Error fetching nominees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (nominee) => {
    setSelectedNominee(nominee);
    setSearchTerm(nominee.full_name);
    setIsOpen(false);
    if (onChange) {
      onChange(nominee.id, nominee);
    }
  };

  const handleClear = () => {
    setSelectedNominee(null);
    setSearchTerm('');
    setIsOpen(false);
    if (onChange) {
      onChange(null, null);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="nominee-dropdown" ref={dropdownRef}>
      <div className="dropdown-input-wrapper">
        <input
          type="text"
          className="dropdown-input"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search nominees by name or email..."
          disabled={disabled}
          autoComplete="off"
        />
        {selectedNominee && !disabled && (
          <button
            type="button"
            className="dropdown-clear"
            onClick={handleClear}
            title="Clear selection"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        <button
          type="button"
          className="dropdown-toggle"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {loading ? (
            <div className="dropdown-loading">
              <p>Loading nominees...</p>
            </div>
          ) : filteredNominees.length === 0 ? (
            <div className="dropdown-empty">
              <p>No nominees found</p>
              {searchTerm && (
                <p className="dropdown-empty-hint">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="dropdown-list">
              {filteredNominees.map((nominee) => (
                <button
                  key={nominee.id}
                  type="button"
                  className={`dropdown-item ${selectedNominee?.id === nominee.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(nominee)}
                >
                  <div className="nominee-item-name">{nominee.full_name}</div>
                  <div className="nominee-item-email">{nominee.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NomineeDropdown;
