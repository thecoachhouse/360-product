/**
 * Utility functions for processing onboarding assessment responses
 * and extracting nominee information
 */

/**
 * Parse nominee names from onboarding response
 * Expected format:
 * {
 *   "peers": "Name One\nName Two\nName Three",
 *   "directReports": "Name One\nName Two",
 *   "seniorLeaders": "Name One"
 * }
 */
export function parseNomineesFromOnboarding(onboardingResponse) {
  const nominees = [];
  
  // Relationship type mapping
  const relationshipMap = {
    'peers': 'Peer',
    'directReports': 'Direct Report',
    'seniorLeaders': 'Senior Leader'
  };
  
  // Process each relationship type
  Object.keys(relationshipMap).forEach(key => {
    const relationshipType = relationshipMap[key];
    const namesText = onboardingResponse[key];
    
    if (!namesText || typeof namesText !== 'string') {
      return;
    }
    
    // Split by newline and filter out empty lines
    const names = namesText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // Create nominee entry for each name
    names.forEach(name => {
      nominees.push({
        name: name.trim(),
        relationshipType: relationshipType
      });
    });
  });
  
  return nominees;
}

/**
 * Validate nominee names before processing
 */
export function validateNomineeNames(nominees) {
  const errors = [];
  
  nominees.forEach((nominee, index) => {
    if (!nominee.name || nominee.name.trim().length === 0) {
      errors.push(`Nominee ${index + 1} has an empty name`);
    }
    
    if (nominee.name && nominee.name.length > 255) {
      errors.push(`Nominee ${index + 1} has a name that's too long (max 255 characters)`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
