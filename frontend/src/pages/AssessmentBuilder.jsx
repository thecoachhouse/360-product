import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AssessmentBuilder.css';

function AssessmentBuilder({ selectedProgramme, onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState(selectedProgramme?.id || '');
  const [dimensions, setDimensions] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [selfJson, setSelfJson] = useState('');
  const [peerJson, setPeerJson] = useState('');
  const [onboardingJson, setOnboardingJson] = useState('');
  const [selfQuestions, setSelfQuestions] = useState([]);
  const [peerQuestions, setPeerQuestions] = useState([]);
  const [onboardingQuestionCount, setOnboardingQuestionCount] = useState(0);
  const [selfMappings, setSelfMappings] = useState({});
  const [peerMappings, setPeerMappings] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { id: 1, name: 'Select Programme', icon: '📋' },
    { id: 2, name: 'Dimensions', icon: '🎯' },
    { id: 3, name: 'Competencies', icon: '⭐' },
    { id: 4, name: 'Upload & Map', icon: '🔗' },
    { id: 5, name: 'Preview & Save', icon: '✅' }
  ];

  useEffect(() => {
    if (!selectedProgramme) {
      fetchProgrammes();
    }
  }, [selectedProgramme]);

  const fetchProgrammes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('programmes')
        .select(`
          id,
          name,
          clients (name),
          assessment_templates (count)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filter out programmes that already have templates
      const available = (data || []).filter(p => 
        !p.assessment_templates || p.assessment_templates[0]?.count === 0
      );
      
      setProgrammes(available);
    } catch (err) {
      console.error('Error fetching programmes:', err);
      setError('Failed to load programmes');
    }
  };

  // Step 1: Programme Selection
  const renderProgrammeSelection = () => (
    <div className="builder-step">
      <h2>Select Programme</h2>
      <p className="step-description">
        Choose the programme for which you want to create assessment templates
      </p>

      {programmes.length === 0 ? (
        <div className="empty-state">
          <p>No programmes available without templates.</p>
          <p className="empty-state-hint">
            Create a new programme first or use an existing one without templates.
          </p>
        </div>
      ) : (
        <div className="programme-selection">
          {programmes.map((prog) => (
            <div
              key={prog.id}
              className={`programme-card ${selectedProgrammeId === prog.id ? 'selected' : ''}`}
              onClick={() => setSelectedProgrammeId(prog.id)}
            >
              <div className="programme-info">
                <h3>{prog.name}</h3>
                <p className="programme-client">{prog.clients?.name}</p>
              </div>
              <div className="programme-select">
                {selectedProgrammeId === prog.id && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="step-actions">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back to Programmes
          </button>
        )}
        <button
          className="btn-primary"
          onClick={() => setCurrentStep(2)}
          disabled={!selectedProgrammeId}
        >
          Next: Define Dimensions
        </button>
      </div>
    </div>
  );

  // Step 2: Dimensions (Bulk Paste)
  const [dimensionsText, setDimensionsText] = useState('');

  const parseDimensions = () => {
    const text = dimensionsText.trim();
    if (!text) return;

    // Split by newlines or commas
    const lines = text.split(/[\n,]+/).map(line => line.trim()).filter(line => line);
    
    const parsed = lines.map(name => ({
      id: `dim_${Date.now()}_${Math.random()}`,
      name: name,
      description: ''
    }));

    setDimensions(parsed);
  };

  const renderDimensions = () => (
    <div className="builder-step">
      <h2>Define Dimensions</h2>
      <p className="step-description">
        Paste your dimension names (one per line or comma-separated)
      </p>

      <div className="bulk-input-section">
        <label htmlFor="dimensions-input">Dimensions</label>
        <textarea
          id="dimensions-input"
          placeholder={`Strategic Thinking\nPeople Leadership\nCommunication & Influence\nExecution Excellence\n\nOr comma-separated: Strategic Thinking, People Leadership, Communication, Execution`}
          value={dimensionsText}
          onChange={(e) => setDimensionsText(e.target.value)}
          rows={8}
          className="bulk-input"
        />
        <button 
          type="button" 
          className="btn-secondary"
          onClick={parseDimensions}
          disabled={!dimensionsText.trim()}
        >
          Parse Dimensions
        </button>
      </div>

      {dimensions.length > 0 && (
        <div className="parsed-preview">
          <h3>✓ {dimensions.length} Dimensions Found:</h3>
          <div className="parsed-list">
            {dimensions.map((dim, idx) => (
              <div key={dim.id} className="parsed-item">
                <span className="item-number">{idx + 1}</span>
                <span className="item-name">{dim.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={() => setCurrentStep(3)}
          disabled={dimensions.length === 0}
        >
          Next: Define Competencies
        </button>
      </div>
    </div>
  );

  // Step 3: Competencies (Bulk Paste)
  const [competenciesText, setCompetenciesText] = useState('');

  const parseCompetencies = () => {
    const text = competenciesText.trim();
    if (!text) return;

    const parsed = [];
    
    // Parse format: "Dimension Name: Comp1, Comp2, Comp3"
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Check if line has colon (dimension: competencies format)
      if (line.includes(':')) {
        const [dimName, compsString] = line.split(':').map(s => s.trim());
        
        // Find matching dimension
        const dimension = dimensions.find(d => 
          d.name.toLowerCase() === dimName.toLowerCase()
        );
        
        if (dimension && compsString) {
          // Split competencies by comma
          const compNames = compsString.split(',').map(c => c.trim()).filter(c => c);
          
          compNames.forEach(compName => {
            parsed.push({
              id: `comp_${Date.now()}_${Math.random()}`,
              dimensionId: dimension.id,
              name: compName,
              description: ''
            });
          });
        }
      } else {
        // No colon - assign to first dimension by default
        if (dimensions.length > 0 && line.trim()) {
          parsed.push({
            id: `comp_${Date.now()}_${Math.random()}`,
            dimensionId: dimensions[0].id,
            name: line.trim(),
            description: ''
          });
        }
      }
    });

    setCompetencies(parsed);
  };

  const getDimensionName = (dimensionId) => {
    return dimensions.find(d => d.id === dimensionId)?.name || 'Unknown';
  };

  const renderCompetencies = () => (
    <div className="builder-step">
      <h2>Define Competencies</h2>
      <p className="step-description">
        Paste competencies for each dimension. Use format: <code>Dimension Name: Comp1, Comp2, Comp3</code>
      </p>

      <div className="bulk-input-section">
        <label htmlFor="competencies-input">Competencies</label>
        <textarea
          id="competencies-input"
          placeholder={`Strategic Thinking: Vision & Direction, Innovation, Long-term Planning\nPeople Leadership: Team Building, Coaching & Development, Empowerment\nCommunication & Influence: Clarity, Active Listening, Influence\nExecution Excellence: Accountability, Decision Making, Results Focus`}
          value={competenciesText}
          onChange={(e) => setCompetenciesText(e.target.value)}
          rows={8}
          className="bulk-input"
        />
        <div className="input-hint">
          💡 Tip: Use the format "<strong>Dimension Name: Competency1, Competency2</strong>" for automatic mapping
        </div>
        <button 
          type="button" 
          className="btn-secondary"
          onClick={parseCompetencies}
          disabled={!competenciesText.trim()}
        >
          Parse Competencies
        </button>
      </div>

      {competencies.length > 0 && (
        <div className="parsed-preview">
          <h3>✓ {competencies.length} Competencies Found:</h3>
          <div className="parsed-list-grouped">
            {dimensions.map(dimension => {
              const dimComps = competencies.filter(c => c.dimensionId === dimension.id);
              if (dimComps.length === 0) return null;
              
              return (
                <div key={dimension.id} className="dimension-group">
                  <h4>{dimension.name}</h4>
                  <div className="parsed-list">
                    {dimComps.map((comp, idx) => (
                      <div key={comp.id} className="parsed-item">
                        <span className="item-number">{idx + 1}</span>
                        <span className="item-name">{comp.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={() => setCurrentStep(4)}
          disabled={competencies.length === 0}
        >
          Next: Upload & Map Assessments
        </button>
      </div>
    </div>
  );

  // Step 4: Upload & Map Assessments
  const extractQuestions = (jsonString, type) => {
    try {
      const parsed = JSON.parse(jsonString);
      const extracted = [];
      
      // Recursively extract questions from pages and panels
      const processElements = (elements, pageName = '', panelName = '') => {
        elements?.forEach(element => {
          if (element.type === 'panel' && element.elements) {
            // Process questions inside panels
            processElements(element.elements, pageName, element.name);
          } else if (element.name && element.title && element.type) {
            // This is a question
            extracted.push({
              name: element.name,
              title: element.title,
              type: element.type,
              page: pageName,
              panel: panelName
            });
          }
        });
      };

      parsed.pages?.forEach(page => {
        processElements(page.elements, page.name);
      });

      if (type === 'self') {
        setSelfQuestions(extracted);
        // Initialize mappings as empty
        const initialMappings = {};
        extracted.forEach(q => {
          initialMappings[q.name] = '';
        });
        setSelfMappings(initialMappings);
      } else {
        setPeerQuestions(extracted);
        const initialMappings = {};
        extracted.forEach(q => {
          initialMappings[q.name] = '';
        });
        setPeerMappings(initialMappings);
      }

      return { success: true, count: extracted.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleParseSelfJson = () => {
    const result = extractQuestions(selfJson, 'self');
    if (result.success) {
      setError('');
    } else {
      setError(`Failed to parse Self-Assessment JSON: ${result.error}`);
    }
  };

  const handleParsePeerJson = () => {
    const result = extractQuestions(peerJson, 'peer');
    if (result.success) {
      setError('');
    } else {
      setError(`Failed to parse Peer-Assessment JSON: ${result.error}`);
    }
  };

  const handleParseOnboardingJson = () => {
    try {
      const parsed = JSON.parse(onboardingJson);
      let count = 0;
      
      // Count questions recursively
      const countQuestions = (elements) => {
        elements?.forEach(element => {
          if (element.type === 'panel' && element.elements) {
            countQuestions(element.elements);
          } else if (element.name && element.title && element.type) {
            count++;
          }
        });
      };

      parsed.pages?.forEach(page => {
        countQuestions(page.elements);
      });

      setOnboardingQuestionCount(count);
      setError('');
    } catch (err) {
      setError(`Failed to parse Onboarding Assessment JSON: ${err.message}`);
    }
  };

  const updateMapping = (questionName, competencyId, type) => {
    if (type === 'self') {
      setSelfMappings(prev => ({
        ...prev,
        [questionName]: competencyId
      }));
    } else {
      setPeerMappings(prev => ({
        ...prev,
        [questionName]: competencyId
      }));
    }
  };

  const getCompetencyName = (competencyId) => {
    return competencies.find(c => c.id === competencyId)?.name || 'Unknown';
  };

  const renderUploadAndMap = () => {
    const allSelfMapped = selfQuestions.length > 0 && 
      Object.values(selfMappings).every(v => v !== '');
    const allPeerMapped = peerQuestions.length > 0 && 
      Object.values(peerMappings).every(v => v !== '');

    return (
      <div className="builder-step">
        <h2>Upload & Map Assessments</h2>
        <p className="step-description">
          Paste your SurveyJS JSON configurations for all three assessments. Self and Peer assessments require competency mapping; Onboarding does not.
        </p>

        {/* Self-Assessment Upload */}
        <div className="upload-section">
          <h3>📊 Self-Assessment Template</h3>
          <textarea
            placeholder='Paste your SurveyJS JSON here... e.g., { "title": "Self-Assessment", "pages": [...] }'
            value={selfJson}
            onChange={(e) => setSelfJson(e.target.value)}
            rows={8}
            className="json-input"
          />
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleParseSelfJson}
            disabled={!selfJson.trim()}
          >
            Parse & Extract Questions
          </button>
          
          {selfQuestions.length > 0 && (
            <div className="parse-success">
              ✓ Valid JSON • {selfQuestions.length} questions found
            </div>
          )}
        </div>

        {/* Self-Assessment Mapping */}
        {selfQuestions.length > 0 && (
          <div className="mapping-section">
            <h3>Map Self-Assessment Questions ({Object.values(selfMappings).filter(v => v).length}/{selfQuestions.length})</h3>
            <div className="questions-map-list">
              {selfQuestions.map((question, idx) => (
                <div key={question.name} className="question-map-item">
                  <div className="question-info">
                    <span className="question-number">Q{idx + 1}</span>
                    <div className="question-details">
                      <div className="question-name">{question.name}</div>
                      <div className="question-title">"{question.title}"</div>
                    </div>
                  </div>
                  <select
                    value={selfMappings[question.name] || ''}
                    onChange={(e) => updateMapping(question.name, e.target.value, 'self')}
                    className="competency-select"
                  >
                    <option value="">Select competency...</option>
                    {dimensions.map(dim => (
                      <optgroup key={dim.id} label={dim.name}>
                        {competencies
                          .filter(c => c.dimensionId === dim.id)
                          .map(comp => (
                            <option key={comp.id} value={comp.id}>
                              {comp.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peer-Assessment Upload */}
        <div className="upload-section" style={{ marginTop: '32px' }}>
          <h3>👥 Peer-Assessment Template</h3>
          <textarea
            placeholder='Paste your SurveyJS JSON here... e.g., { "title": "Peer-Assessment", "pages": [...] }'
            value={peerJson}
            onChange={(e) => setPeerJson(e.target.value)}
            rows={8}
            className="json-input"
          />
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleParsePeerJson}
            disabled={!peerJson.trim()}
          >
            Parse & Extract Questions
          </button>
          
          {peerQuestions.length > 0 && (
            <div className="parse-success">
              ✓ Valid JSON • {peerQuestions.length} questions found
            </div>
          )}
        </div>

        {/* Peer-Assessment Mapping */}
        {peerQuestions.length > 0 && (
          <div className="mapping-section">
            <h3>Map Peer-Assessment Questions ({Object.values(peerMappings).filter(v => v).length}/{peerQuestions.length})</h3>
            <div className="questions-map-list">
              {peerQuestions.map((question, idx) => (
                <div key={question.name} className="question-map-item">
                  <div className="question-info">
                    <span className="question-number">Q{idx + 1}</span>
                    <div className="question-details">
                      <div className="question-name">{question.name}</div>
                      <div className="question-title">"{question.title}"</div>
                    </div>
                  </div>
                  <select
                    value={peerMappings[question.name] || ''}
                    onChange={(e) => updateMapping(question.name, e.target.value, 'peer')}
                    className="competency-select"
                  >
                    <option value="">Select competency...</option>
                    {dimensions.map(dim => (
                      <optgroup key={dim.id} label={dim.name}>
                        {competencies
                          .filter(c => c.dimensionId === dim.id)
                          .map(comp => (
                            <option key={comp.id} value={comp.id}>
                              {comp.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onboarding Assessment Upload */}
        <div className="upload-section" style={{ marginTop: '32px' }}>
          <h3>🎓 Onboarding Assessment Template</h3>
          <p className="step-description" style={{ fontSize: '14px', marginBottom: '12px' }}>
            This assessment does not require competency mapping
          </p>
          <textarea
            placeholder='Paste your SurveyJS JSON here... e.g., { "title": "Onboarding Assessment", "pages": [...] }'
            value={onboardingJson}
            onChange={(e) => setOnboardingJson(e.target.value)}
            rows={8}
            className="json-input"
          />
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleParseOnboardingJson}
            disabled={!onboardingJson.trim()}
          >
            Validate & Count Questions
          </button>
          
          {onboardingQuestionCount > 0 && (
            <div className="parse-success">
              ✓ Valid JSON • {onboardingQuestionCount} questions found
            </div>
          )}
        </div>

        <div className="step-actions">
          <button type="button" className="btn-secondary" onClick={() => setCurrentStep(3)}>
            Back
          </button>
          <button
            className="btn-primary"
            onClick={() => setCurrentStep(5)}
            disabled={!allSelfMapped || !allPeerMapped || onboardingQuestionCount === 0}
          >
            Next: Preview & Save
          </button>
        </div>
      </div>
    );
  };

  // Step 5: Preview and Save
  const injectCompetencyIds = (jsonString, mappings) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Recursively inject competency IDs into questions
      const processElements = (elements) => {
        elements?.forEach(element => {
          if (element.type === 'panel' && element.elements) {
            processElements(element.elements);
          } else if (element.name && mappings[element.name]) {
            // Add competency field to this question
            element.competency = mappings[element.name];
          }
        });
      };

      parsed.pages?.forEach(page => {
        processElements(page.elements);
      });

      return parsed;
    } catch (err) {
      console.error('Error injecting competency IDs:', err);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const programme = selectedProgramme || 
        programmes.find(p => p.id === selectedProgrammeId);

      if (!programme) {
        throw new Error('No programme selected');
      }

      // Inject competency IDs into the uploaded JSONs
      const selfTemplateWithCompetencies = injectCompetencyIds(selfJson, selfMappings);
      const peerTemplateWithCompetencies = injectCompetencyIds(peerJson, peerMappings);

      if (!selfTemplateWithCompetencies || !peerTemplateWithCompetencies) {
        throw new Error('Failed to process assessment templates');
      }

      // Validate onboarding JSON
      let onboardingTemplate;
      try {
        onboardingTemplate = JSON.parse(onboardingJson);
      } catch (parseError) {
        throw new Error('Invalid onboarding assessment JSON');
      }

      // Save to database
      const templates = [
        {
          programme_id: programme.id,
          name: `${programme.name} - Self Assessment`,
          template_type: 'self',
          survey_json: selfTemplateWithCompetencies
        },
        {
          programme_id: programme.id,
          name: `${programme.name} - Peer Assessment`,
          template_type: 'peer',
          survey_json: peerTemplateWithCompetencies
        },
        {
          programme_id: programme.id,
          name: `${programme.name} - Onboarding Assessment`,
          template_type: 'onboarding',
          survey_json: onboardingTemplate
        }
      ];

      const { error: insertError } = await supabase
        .from('assessment_templates')
        .insert(templates);

      if (insertError) throw insertError;

      // Success! Navigate back or show success message
      alert('Assessment templates created successfully!');
      
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Error saving templates:', err);
      setError(err.message || 'Failed to save assessment templates');
    } finally {
      setSaving(false);
    }
  };

  const getCompetencyQuestionCounts = (competencyId) => {
    const selfCount = Object.values(selfMappings).filter(id => id === competencyId).length;
    const peerCount = Object.values(peerMappings).filter(id => id === competencyId).length;
    return { selfCount, peerCount };
  };

  const renderPreview = () => (
    <div className="builder-step">
      <h2>Preview & Save</h2>
      <p className="step-description">
        Review your assessment structure and question mappings before saving
      </p>

      <div className="preview-summary">
        <div className="summary-card">
          <div className="summary-icon">🎯</div>
          <div className="summary-content">
            <h3>{dimensions.length}</h3>
            <p>Dimensions</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">⭐</div>
          <div className="summary-content">
            <h3>{competencies.length}</h3>
            <p>Competencies</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">❓</div>
          <div className="summary-content">
            <h3>{selfQuestions.length}</h3>
            <p>Self Questions</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <h3>{peerQuestions.length}</h3>
            <p>Peer Questions</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🎓</div>
          <div className="summary-content">
            <h3>{onboardingQuestionCount}</h3>
            <p>Onboarding Questions</p>
          </div>
        </div>
      </div>

      <div className="preview-structure">
        <h3>Question Distribution by Competency</h3>
        {dimensions.map(dimension => {
          const dimComps = competencies.filter(c => c.dimensionId === dimension.id);
          return (
            <div key={dimension.id} className="preview-dimension">
              <h4>📊 {dimension.name}</h4>
              {dimComps.map(competency => {
                const { selfCount, peerCount } = getCompetencyQuestionCounts(competency.id);
                
                return (
                  <div key={competency.id} className="preview-competency">
                    <div className="preview-comp-header">
                      <span className="comp-name">⭐ {competency.name}</span>
                      <span className="comp-counts">
                        <span className="count-badge self">Self: {selfCount}</span>
                        <span className="count-badge peer">Peer: {peerCount}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="step-actions">
        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(4)}>
          Back
        </button>
        <button
          className="btn-primary btn-success"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '✓ Save Templates with Competency Mappings'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="assessment-builder">
      <div className="builder-header">
        <h1>Assessment Builder</h1>
        <div className="step-indicator">
          {steps.map((step, idx) => (
            <div 
              key={step.id} 
              className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <div className="step-number">{step.icon}</div>
              <div className="step-label">{step.name}</div>
              {idx < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="builder-content">
        {currentStep === 1 && renderProgrammeSelection()}
        {currentStep === 2 && renderDimensions()}
        {currentStep === 3 && renderCompetencies()}
        {currentStep === 4 && renderUploadAndMap()}
        {currentStep === 5 && renderPreview()}
      </div>
    </div>
  );
}

export default AssessmentBuilder;

