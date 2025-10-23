# 🎯 360 Assessment Complete Workflow Guide

## 📊 Updated Database Schema

### **Key Changes Applied:**

1. **`assessment_templates` table:**
   - ✅ `programme_id` - Links template to specific programme
   - ✅ `template_type` - 'self', 'peer', or 'manager'
   - ✅ RLS policies for coachees and nominees to view their templates

2. **`programmes` table:**
   - ✅ `cohort_size` - Expected number of coachees
   - ✅ `min_managers` - Minimum manager nominations required (default: 1)
   - ✅ `min_peers` - Minimum peer nominations required (default: 2)
   - ✅ `min_direct_reports` - Minimum direct report nominations required (default: 2)

---

## 🔄 Complete Workflow

### **Phase 1: Client & Programme Setup (Admin Portal)**

#### **Step 1.1: Create Client**

**Admin Action:**
- Navigate to Admin Dashboard → Clients → "Add New Client"
- Enter:
  - Company name: "Acme Corporation"
  - Cohort size: 15

**Database Result:**
```sql
INSERT INTO clients (name) VALUES ('Acme Corporation');
```

---

#### **Step 1.2: Create Programme**

**Admin Action:**
- Navigate to Clients → Select "Acme Corporation" → "Create Programme"
- Enter:
  - Programme name: "Leadership Development Q1 2025"
  - Cohort size: 15
  - Minimum requirements:
    - Managers: 1
    - Peers: 2
    - Direct Reports: 2

**Database Result:**
```sql
INSERT INTO programmes (
  client_id, 
  name, 
  cohort_size, 
  min_managers, 
  min_peers, 
  min_direct_reports
) VALUES (
  '<acme_client_id>', 
  'Leadership Development Q1 2025', 
  15, 
  1, 
  2, 
  2
);
```

---

#### **Step 1.3: Design Assessment Structure**

**Admin Action:**
- Navigate to Programme → "Configure Assessment"
- **Define Dimensions** (e.g., 4):
  1. Strategic Thinking
  2. People Leadership
  3. Communication
  4. Execution Excellence

- **Define Competencies** (e.g., 12 total):
  - **Strategic Thinking:**
    - Vision & Direction
    - Innovation & Creativity
    - Problem Solving
  - **People Leadership:**
    - Team Building
    - Coaching & Development
    - Empowerment
  - **Communication:**
    - Clear Communication
    - Active Listening
    - Influence
  - **Execution:**
    - Results Orientation
    - Accountability
    - Decision Making

- **Define Questions per Competency:**
  - **Self-Assessment:** 5 questions per competency (60 total)
  - **Peer-Assessment:** 3 questions per competency (36 total)

**Example Question Structure:**
```json
{
  "competency": "Vision & Direction",
  "dimension": "Strategic Thinking",
  "self_questions": [
    "I clearly articulate the vision for my team",
    "I align my team's goals with organizational strategy",
    "I inspire others with a compelling future vision",
    "I adjust strategic priorities based on changing conditions",
    "I ensure my team understands how their work connects to the bigger picture"
  ],
  "peer_questions": [
    "This person clearly articulates vision for their team",
    "This person aligns team goals with organizational strategy",
    "This person inspires others with a compelling future vision"
  ]
}
```

---

#### **Step 1.4: Generate Assessment Templates**

**System Action:**
- Convert dimensions/competencies/questions into SurveyJS JSON format
- Create **TWO** assessment templates:

**Template 1: Self-Assessment**
```sql
INSERT INTO assessment_templates (
  programme_id,
  template_type,
  name,
  survey_json
) VALUES (
  '<programme_id>',
  'self',
  'Acme Corp - Self Assessment',
  '<surveyjs_json_with_60_questions>'
);
```

**Template 2: Peer-Assessment**
```sql
INSERT INTO assessment_templates (
  programme_id,
  template_type,
  name,
  survey_json
) VALUES (
  '<programme_id>',
  'peer',
  'Acme Corp - Peer Assessment',
  '<surveyjs_json_with_36_questions>'
);
```

---

### **Phase 2: Coachee Onboarding (Admin Portal)**

#### **Step 2.1: Bulk Upload Coachees (CSV)**

**Admin Action:**
- Navigate to Programme → "Upload Coachees"
- Upload CSV file:
  ```csv
  full_name,email
  Sarah Johnson,sarah.johnson@acme.com
  Michael Chen,michael.chen@acme.com
  Emma Williams,emma.williams@acme.com
  ...
  ```

**Database Result:**
```sql
INSERT INTO coachees (programme_id, full_name, email) VALUES
  ('<programme_id>', 'Sarah Johnson', 'sarah.johnson@acme.com'),
  ('<programme_id>', 'Michael Chen', 'michael.chen@acme.com'),
  ('<programme_id>', 'Emma Williams', 'emma.williams@acme.com');
```

---

#### **Step 2.2: OR Manual Entry**

**Admin Action:**
- Navigate to Programme → "Add Coachee"
- Enter name and email manually
- Repeat for each coachee

---

#### **Step 2.3: Send Coachee Invitations**

**Admin Action:**
- Navigate to Programme → "Send Invitations"
- Select all coachees (or specific ones)
- Click "Send Email Invitations"

**Email Sent:**
```
Subject: Welcome to Acme Corp Leadership Development Programme

Hi Sarah,

You've been enrolled in our Leadership Development programme!

Next steps:
1. Click the link below to access your portal
2. Complete your self-assessment
3. Nominate your peers for 360 feedback

[Access Your Portal - Magic Link]

Best regards,
The Coach House Team
```

---

### **Phase 3: Self-Assessment & Nomination (Coachee Portal)**

#### **Step 3.1: Coachee Logs In**

**Coachee Action:**
- Clicks magic link in email
- Automatically authenticated and redirected to dashboard

**Query to Load Self-Assessment Template:**
```javascript
const { data: template } = await supabase
  .from('assessment_templates')
  .select('survey_json')
  .eq('programme_id', coachee.programme_id)
  .eq('template_type', 'self')
  .single();

// Load into SurveyJS
survey.fromJSON(template.survey_json);
```

---

#### **Step 3.2: Complete Self-Assessment**

**Coachee Action:**
- Answers all 60 questions (5 per competency × 12 competencies)
- Rates themselves on 1-5 scale
- Clicks "Submit Assessment"

**Database Result:**
```sql
INSERT INTO assessment_responses (
  assessment_template_id,
  coachee_id,
  respondent_email,
  raw_response_data,
  submitted_at
) VALUES (
  '<self_template_id>',
  '<coachee_id>',
  'sarah.johnson@acme.com',
  '<full_surveyjs_response_json>',
  NOW()
);
```

---

#### **Step 3.3: Nominate Peers**

**Coachee Action:**
- Navigate to "Nominate Peers" section
- Add nominees:

**Option A: Free-Text Entry**
```
Manager:
- Name: John Smith
- Email: john.smith@acme.com

Peers:
- Name: Alice Brown
- Email: alice.brown@acme.com
- Name: Bob Wilson  
- Email: bob.wilson@acme.com

Direct Reports:
- Name: Carol Davis
- Email: carol.davis@acme.com
- Name: David Lee
- Email: david.lee@acme.com
```

**System Validation:**
- ✅ At least 1 manager
- ✅ At least 2 peers
- ✅ At least 2 direct reports
- ❌ If requirements not met, show error

**Database Result:**
```sql
-- Create nominee records (if not exist)
INSERT INTO nominees (full_name, email) VALUES
  ('John Smith', 'john.smith@acme.com'),
  ('Alice Brown', 'alice.brown@acme.com'),
  ...
ON CONFLICT (email) DO NOTHING;

-- Create nominations
INSERT INTO nominations (coachee_id, nominee_id, relationship_type) VALUES
  ('<sarah_id>', '<john_id>', 'manager'),
  ('<sarah_id>', '<alice_id>', 'peer'),
  ('<sarah_id>', '<bob_id>', 'peer'),
  ('<sarah_id>', '<carol_id>', 'direct_report'),
  ('<sarah_id>', '<david_id>', 'direct_report');
```

**Note:** Emails are NOT sent yet - held for batch sending.

---

### **Phase 4: Review & Send Peer Assessments (Admin Portal)**

#### **Step 4.1: Review Nominations**

**Admin Action:**
- Navigate to Programme → "Review Nominations"
- See table of all nominees across all coachees
- Verify emails, relationships, duplicate checking

**Admin View:**
```
Nominee             | Email                    | Nominated By        | Relationship
--------------------|--------------------------|---------------------|---------------
John Smith          | john.smith@acme.com      | Sarah Johnson       | Manager
John Smith          | john.smith@acme.com      | Michael Chen        | Manager
Alice Brown         | alice.brown@acme.com     | Sarah Johnson       | Peer
...
```

---

#### **Step 4.2: Batch Send Invitations**

**Admin Action:**
- Click "Send All Peer Assessment Invitations"
- Confirm sending

**Email Sent to Each Nominee:**
```
Subject: You've Been Nominated to Provide Feedback for Sarah Johnson

Hi John,

Sarah Johnson has nominated you to provide 360-degree feedback as part of 
Acme Corp's Leadership Development programme.

Your input is valuable and confidential. The assessment takes about 15 minutes.

[Complete Assessment - Magic Link]

This link is unique to you and expires in 7 days.

Thank you for your participation!
```

---

### **Phase 5: Peer Assessments (Nominee Portal)**

#### **Step 5.1: Nominee Logs In**

**Nominee Action:**
- Clicks magic link in email
- Authenticated and redirected to dashboard

**Dashboard Shows:**
```
Your Pending Assessments:

[Card 1]
Assessment for: Sarah Johnson
Relationship: Manager
Status: Not Started
Due: Oct 30, 2025
[Start Assessment]

[Card 2]
Assessment for: Michael Chen
Relationship: Manager  
Status: Not Started
Due: Oct 30, 2025
[Start Assessment]
```

---

#### **Step 5.2: Complete Peer Assessment**

**Nominee Action:**
- Clicks "Start Assessment" for Sarah Johnson
- Answers 36 questions (3 per competency × 12 competencies)
- Rates Sarah on 1-5 scale
- Clicks "Submit"

**Query to Load Peer-Assessment Template:**
```javascript
const { data: template } = await supabase
  .from('assessment_templates')
  .select('survey_json')
  .eq('programme_id', coachee.programme_id)
  .eq('template_type', 'peer')
  .single();

survey.fromJSON(template.survey_json);
```

**Database Result:**
```sql
INSERT INTO assessment_responses (
  assessment_template_id,
  coachee_id,
  respondent_email,
  raw_response_data,
  submitted_at
) VALUES (
  '<peer_template_id>',
  '<sarah_id>',
  'john.smith@acme.com',
  '<full_surveyjs_response_json>',
  NOW()
);
```

---

### **Phase 6: Scoring & Reporting (Automated + Admin)**

#### **Step 6.1: Auto-Calculate Scores**

**Trigger:** When assessment_responses are submitted

**Calculation Logic:**
```javascript
// For each competency
// Group responses by relationship type (self, manager, peer, direct_report)
// Calculate average score per competency per relationship type

// Example for Sarah's "Vision & Direction" competency:
Self Average: 4.2
Manager Average: 4.0
Peer Average: 3.8
Direct Report Average: 4.5
Overall Average: 4.125
```

**Database Result:**
```sql
INSERT INTO calculated_scores (
  coachee_id, 
  competency_id, 
  relationship_type, 
  average_score
) VALUES
  ('<sarah_id>', '<vision_competency_id>', 'self', 4.2),
  ('<sarah_id>', '<vision_competency_id>', 'manager', 4.0),
  ('<sarah_id>', '<vision_competency_id>', 'peer', 3.8),
  ('<sarah_id>', '<vision_competency_id>', 'direct_report', 4.5);
```

---

#### **Step 6.2: Admin Monitors Progress**

**Admin Dashboard Shows:**
```
Programme: Leadership Development Q1 2025
Status: In Progress

Completion Summary:
- Self-Assessments: 15/15 (100%)
- Peer Assessments: 52/75 (69%)

Coachee Details:
Sarah Johnson
  ✅ Self-assessment complete
  📊 Peer feedback: 4/5 complete
  ⏱️  Pending: 1 peer (Bob Wilson)

Michael Chen
  ✅ Self-assessment complete
  📊 Peer feedback: 5/5 complete
  ✅ Ready for report
```

---

#### **Step 6.3: Generate Reports**

**Admin Action:**
- When coachee has sufficient responses (e.g., 80% completion)
- Click "Generate Report" for coachee

**Report Includes:**
- Dimension scores (aggregated from competencies)
- Competency breakdown
- Self vs Others comparison
- Strengths and development areas
- Verbatim comments (if collected)

---

## 🎯 Summary of Data Flow

```
Admin creates:
  Client → Programme → Assessment Templates (self + peer)
  
Admin adds:
  Coachees → Programme
  
Coachees complete:
  Self-Assessment (60 questions)
  Nominate Peers (min requirements validated)
  
Admin sends:
  Batch invitations to nominees
  
Nominees complete:
  Peer Assessment (36 questions per coachee)
  
System calculates:
  Scores per competency per relationship type
  
Admin generates:
  Reports for coaches/coachees
```

---

## 🔐 Security & Access Control

**RLS Policies Ensure:**

1. **Coachees can:**
   - ✅ View self-assessment template for their programme
   - ✅ Submit self-assessment responses
   - ✅ Nominate peers
   - ❌ Cannot see peer responses or scores

2. **Nominees can:**
   - ✅ View peer-assessment template for programmes they're assessing
   - ✅ View their assigned assessments
   - ✅ Submit peer-assessment responses
   - ❌ Cannot see other nominees' responses

3. **Admins can:**
   - ✅ Full CRUD on all tables
   - ✅ View all responses and scores
   - ✅ Generate reports

---

## 📝 Next Steps to Build

Now that the database is configured, we need to build:

1. **Admin UI - Client Management**
   - Create client form
   - List clients table

2. **Admin UI - Programme Setup**
   - Create programme form
   - Assessment builder (dimensions/competencies/questions)
   - Generate SurveyJS JSON

3. **Admin UI - Coachee Management**
   - CSV upload
   - Manual entry form
   - Send invitation emails

4. **Admin UI - Nomination Review**
   - View all nominations
   - Batch send peer invitations

5. **Admin UI - Progress Dashboard**
   - Completion tracking
   - Report generation

6. **Coachee Portal - Self-Assessment**
   - Load template from DB
   - SurveyJS integration
   - Submit responses

7. **Coachee Portal - Peer Nomination**
   - Form to add nominees
   - Validation against min requirements

8. **Nominee Portal - Peer Assessment**
   - Load template from DB
   - SurveyJS integration
   - Submit responses

9. **n8n Webhook Integration**
   - Receive assessment responses
   - Trigger score calculations
   - Store in database

10. **Reporting Engine**
    - Query calculated_scores
    - Generate PDF reports
    - Email to coaches

Ready to start building? Where would you like to begin? 🚀

