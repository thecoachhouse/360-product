# 📊 Database Schema Changes Summary

## ✅ Migrations Applied (2025-10-23)

### **1. Assessment Templates → Programme Link**

**File:** `add_programme_to_assessment_templates.sql`

**Changes:**
```sql
ALTER TABLE assessment_templates 
ADD COLUMN programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
ADD COLUMN template_type TEXT CHECK (template_type IN ('self', 'peer', 'manager'));
```

**Purpose:**
- Link each assessment template to a specific programme
- Differentiate between self-assessment (60 questions) and peer-assessment (36 questions)
- Future-proof for manager assessments

**RLS Policies Added:**
- Admins: Full access
- Coachees: Can view templates for their own programme
- Nominees: Can view templates for programmes they're assessing

---

### **2. Programme Configuration Fields**

**File:** `add_programme_configuration.sql`

**Changes:**
```sql
ALTER TABLE programmes 
ADD COLUMN cohort_size INTEGER,
ADD COLUMN min_managers INTEGER DEFAULT 1,
ADD COLUMN min_peers INTEGER DEFAULT 2,
ADD COLUMN min_direct_reports INTEGER DEFAULT 2;
```

**Purpose:**
- Track expected cohort size for planning
- Enforce minimum nomination requirements per relationship type
- Validate coachee nominations before allowing completion

---

## 🗂️ Updated Schema Structure

### **Hierarchy:**
```
clients (company)
  ↓
programmes (instance of coaching programme)
  ↓
  ├─→ assessment_templates (self + peer, stored as SurveyJS JSON)
  └─→ coachees (participants)
       ↓
       ├─→ assessment_responses (self-assessment)
       └─→ nominations
            ↓
            └─→ nominees
                 ↓
                 └─→ assessment_responses (peer-assessments)
```

### **Key Relationships:**

**Programme owns:**
- Multiple coachees
- Two assessment templates (self + peer)
- Configuration (cohort size, min requirements)

**Coachee belongs to:**
- One programme
- Completes one self-assessment
- Nominates multiple peers

**Nominee can:**
- Be nominated by multiple coachees
- Complete multiple peer-assessments
- Assess coachees across different programmes

---

## 🔍 How to Query

### **Get Self-Assessment Template for a Coachee:**
```sql
SELECT at.survey_json
FROM assessment_templates at
JOIN coachees c ON c.programme_id = at.programme_id
WHERE c.id = $coachee_id
AND at.template_type = 'self';
```

### **Get Peer-Assessment Template for a Nomination:**
```sql
SELECT at.survey_json
FROM assessment_templates at
JOIN nominations n ON n.coachee_id IN (
  SELECT id FROM coachees WHERE programme_id = at.programme_id
)
WHERE n.id = $nomination_id
AND at.template_type = 'peer';
```

### **Validate Nomination Requirements:**
```sql
-- Check if coachee has met minimum requirements
SELECT 
  p.min_managers,
  p.min_peers,
  p.min_direct_reports,
  COUNT(CASE WHEN n.relationship_type = 'manager' THEN 1 END) as manager_count,
  COUNT(CASE WHEN n.relationship_type = 'peer' THEN 1 END) as peer_count,
  COUNT(CASE WHEN n.relationship_type = 'direct_report' THEN 1 END) as direct_report_count
FROM programmes p
JOIN coachees c ON c.programme_id = p.id
LEFT JOIN nominations n ON n.coachee_id = c.id
WHERE c.id = $coachee_id
GROUP BY p.id, p.min_managers, p.min_peers, p.min_direct_reports;
```

---

## 📋 What's NOT Changing

We're **keeping** these tables for now (but not actively using them for assessment structure):

- `dimensions` - Can be repurposed for analytics/reporting later
- `competencies` - Can be repurposed for analytics/reporting later
- `questions` - Can be repurposed for analytics/reporting later

**Why keep them?**
- Test data is already there
- Might be useful for cross-programme analytics
- Could build a "question library" feature later
- Calculated_scores still references competencies table

**Current approach:**
- All assessment structure is in `assessment_templates.survey_json`
- Dimensions, competencies, questions are embedded in the JSON
- More flexible, easier to customize per client

---

## 🎯 Example Data Structure

### **Assessment Template JSON Structure:**
```json
{
  "title": "Leadership Development Self-Assessment",
  "pages": [
    {
      "name": "strategic_thinking",
      "title": "Strategic Thinking",
      "elements": [
        {
          "type": "panel",
          "name": "vision_direction",
          "title": "Vision & Direction",
          "questions": [
            {
              "type": "rating",
              "name": "vision_q1",
              "title": "I clearly articulate the vision for my team",
              "rateMax": 5,
              "minRateDescription": "Strongly Disagree",
              "maxRateDescription": "Strongly Agree"
            },
            // ... 4 more questions for this competency
          ]
        },
        // ... more competencies in this dimension
      ]
    },
    // ... more dimensions
  ],
  "metadata": {
    "dimensions": ["Strategic Thinking", "People Leadership", "Communication", "Execution"],
    "competencies": {
      "Strategic Thinking": ["Vision & Direction", "Innovation", "Problem Solving"],
      "People Leadership": ["Team Building", "Coaching", "Empowerment"],
      // ... etc
    }
  }
}
```

---

## ✅ Ready for Implementation

Database is now configured to support:
- [x] Multiple clients
- [x] Multiple programmes per client
- [x] Custom assessment templates per programme
- [x] Self and peer assessments with different question counts
- [x] Flexible nomination requirements
- [x] RLS policies for secure data access

**Next:** Build the admin UI to create clients, programmes, and assessment templates!

