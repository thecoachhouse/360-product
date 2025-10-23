# 🎯 Assessment Builder - User Guide

## Overview

The Assessment Builder is a complete admin portal solution for creating and managing custom 360-degree leadership assessments. It allows admins to:

- ✅ Manage client organizations
- ✅ Create coaching programmes
- ✅ Design custom assessment structures
- ✅ Generate SurveyJS templates for self and peer assessments
- ✅ Save templates to Supabase for use by coachees and nominees

---

## 🚀 Getting Started

### Prerequisites
- Admin account with proper role (`user_metadata.role === 'admin'`)
- Supabase connection configured in `frontend/.env`
- Dev server running: `npm run dev` in the `frontend/` directory

### Access the Admin Portal
1. Navigate to `http://localhost:5173`
2. Log in with admin credentials (email/password)
3. You'll see the admin dashboard with a new sidebar

---

## 📋 Workflow: Complete Setup Process

### **Step 1: Create a Client**

Clients represent the companies/organizations you work with.

1. Click **"Clients"** in the sidebar
2. Click **"+ New Client"**
3. Fill in:
   - **Client Name**: e.g., "Acme Corporation"
   - **Expected Cohort Size** (optional): e.g., 20
4. Click **"Create Client"**

**Features:**
- View all clients in a table
- Edit client details (click edit icon)
- Delete clients (click delete icon - **warning: deletes all associated programmes**)

---

### **Step 2: Create a Programme**

Programmes are instances of coaching initiatives for specific clients.

1. Click **"Programmes"** in the sidebar
2. Click **"+ New Programme"**
3. Fill in:
   - **Client**: Select from dropdown
   - **Programme Name**: e.g., "Leadership Development Q1 2025"
   - **Cohort Size** (optional): e.g., 15
   - **Min. Managers**: Default 1
   - **Min. Peers**: Default 2
   - **Min. Direct Reports**: Default 2
4. Click **"Create Programme"**

**Features:**
- View all programmes with client info, coachee counts, and template status
- Edit programme details
- Delete programmes (⚠️ **deletes all coachees, nominations, and assessments**)
- Green "Build Assessment" icon appears for programmes without templates

---

### **Step 3: Build Assessment (The Core Feature!)**

This is where you design the custom assessment structure.

#### **Option A: From Programmes Page**
1. In the Programmes table, find a programme without templates
2. Click the green **"Build Assessment"** icon (layers icon)

#### **Option B: Direct Access**
1. Click **"Assessment Builder"** in the sidebar
2. Select a programme from the list

---

## 🏗️ Assessment Builder Wizard

The builder uses a 5-step wizard interface with visual progress tracking.

### **Step 1: Select Programme** 📋

- View all programmes without existing templates
- Click a card to select it
- Click **"Next: Define Dimensions"**

---

### **Step 2: Define Dimensions** 🎯

Dimensions are high-level assessment categories (e.g., Strategic Thinking, People Leadership).

**How to use:**
1. Click **"+ Add Dimension"**
2. Enter:
   - **Dimension Name**: e.g., "Strategic Thinking"
   - **Description** (optional): Brief explanation
3. Repeat for all dimensions (typically 3-5)
4. Remove dimensions with the X button if needed
5. Click **"Next: Define Competencies"**

**Example:**
```
Dimension 1: Strategic Thinking
Description: Ability to make sense of complexity and translate it into clear priorities

Dimension 2: People Leadership
Description: Capability to inspire, develop, and empower teams

Dimension 3: Communication & Influence
Description: Skill in articulating vision and driving alignment

Dimension 4: Execution Excellence
Description: Capacity to deliver results and drive accountability
```

---

### **Step 3: Define Competencies** ⭐

Competencies are specific skills within each dimension.

**How to use:**
1. Click **"+ Add Competency"**
2. Select **Dimension** from dropdown
3. Enter:
   - **Competency Name**: e.g., "Vision & Direction"
   - **Description** (optional)
4. Repeat for all competencies (typically 8-15 total, 2-4 per dimension)
5. The dimension badge shows which dimension each competency belongs to
6. Remove competencies with the X button if needed
7. Click **"Next: Write Questions"**

**Example:**
```
Strategic Thinking → Vision & Direction
Strategic Thinking → Innovation & Problem Solving
Strategic Thinking → Long-term Planning

People Leadership → Team Building
People Leadership → Coaching & Development
People Leadership → Empowerment & Delegation
```

---

### **Step 4: Write Questions** ❓

This is where you create the actual assessment questions.

**How to use:**
1. Click **"+ Add Question"**
2. Select **Competency** from dropdown
3. Enter **Question Text**: e.g., "I clearly articulate the vision for my team"
4. Choose **Assessment Type**:
   - **Self Only**: Question appears only in self-assessment
   - **Peer Only**: Question appears only in peer-assessment
   - **Both**: Question appears in both assessments ✅ (recommended for core questions)
5. Repeat for all questions
6. **Recommended structure:**
   - **Self-assessment**: 5 questions per competency (60 total for 12 competencies)
   - **Peer-assessment**: 3 questions per competency (36 total for 12 competencies)
   - Use "Both" for the most important questions, then add "Self Only" for deeper introspection
7. Remove questions with the X button if needed
8. Click **"Next: Preview & Save"**

**Tips:**
- Write questions from first-person perspective for self: "I clearly..."
- Write questions from third-person for peer: "This leader clearly..."
- Use consistent rating scale language (the system defaults to 0-5: "Strongly Disagree" to "Strongly Agree")
- Keep questions specific and actionable

**Example:**
```
Competency: Vision & Direction (Strategic Thinking)

Question 1: "I clearly articulate the vision for my team" [Both]
Question 2: "I translate strategic goals into actionable priorities" [Both]
Question 3: "I help others understand how their work contributes to the bigger picture" [Both]
Question 4: "I regularly reflect on whether our direction aligns with organizational strategy" [Self Only]
Question 5: "I seek input from diverse perspectives when setting direction" [Self Only]
```

---

### **Step 5: Preview & Save** ✅

Review your entire assessment structure before generating templates.

**What you'll see:**
- **Summary Cards**: Total counts of dimensions, competencies, self questions, peer questions
- **Structure Preview**: Hierarchical view showing:
  - Each dimension
  - Competencies within each dimension
  - Question counts per competency (Self/Peer split)

**Final checks:**
- ✅ All dimensions have competencies
- ✅ All competencies have questions
- ✅ Question counts are balanced (e.g., 3-5 per competency)
- ✅ Self-assessment has more questions than peer-assessment

**Click "✓ Generate & Save Templates"**

**What happens:**
1. System generates **TWO** SurveyJS JSON templates:
   - **Self-Assessment Template**: All questions tagged "self" or "both"
   - **Peer-Assessment Template**: All questions tagged "peer" or "both"
2. Both templates are saved to `assessment_templates` table with:
   - `programme_id`: Linked to your selected programme
   - `template_type`: 'self' or 'peer'
   - `survey_json`: The complete SurveyJS configuration
3. Success alert appears
4. You're redirected back to Programmes page

---

## 🗄️ Database Structure Created

After saving, the database contains:

```sql
-- Two new rows in assessment_templates table
{
  programme_id: <selected_programme_id>,
  name: "Leadership Development Q1 2025 - Self Assessment",
  template_type: "self",
  survey_json: { /* SurveyJS JSON with self questions */ }
}

{
  programme_id: <selected_programme_id>,
  name: "Leadership Development Q1 2025 - Peer Assessment",
  template_type: "peer",
  survey_json: { /* SurveyJS JSON with peer questions */ }
}
```

---

## 📊 SurveyJS JSON Structure Generated

The system converts your dimensions/competencies/questions into valid SurveyJS format:

```json
{
  "title": "Leadership Self-Assessment",
  "description": "Assess your own leadership capabilities",
  "completedHtml": "Thank you for completing the assessment.",
  "pages": [
    {
      "name": "strategic_thinking_page",
      "title": "Strategic Thinking",
      "description": "Ability to make sense of complexity...",
      "elements": [
        {
          "type": "panel",
          "name": "vision_direction_panel",
          "title": "Vision & Direction",
          "elements": [
            {
              "type": "rating",
              "name": "strategic_thinking_vision_direction_q1",
              "title": "I clearly articulate the vision for my team",
              "isRequired": true,
              "rateCount": 6,
              "rateMin": 0,
              "rateMax": 5,
              "minRateDescription": "Strongly Disagree",
              "maxRateDescription": "Strongly Agree",
              "displayMode": "buttons"
            }
          ]
        }
      ]
    }
  ],
  "showQuestionNumbers": "on",
  "showProgressBar": true,
  "progressBarLocation": "top",
  "metadata": {
    "dimensions": [...],
    "competencies": [...],
    "questionCount": 60
  }
}
```

---

## ✅ What's Next After Building Assessment?

Once templates are created, you can:

1. **Add Coachees**: Upload participants to the programme
2. **Send Self-Assessment Links**: Coachees complete their self-assessment
3. **Coachees Nominate Peers**: They select colleagues to provide feedback
4. **Admin Reviews Nominations**: Approve and send invitations
5. **Nominees Complete Peer Assessments**: Anonymous feedback
6. **Generate Reports**: Compare self vs peer scores per competency

*(Future features - not yet implemented)*

---

## 🎨 UI Features

### **Sidebar Navigation**
- 📊 Manage Assessments (coachee list - existing)
- 👥 Clients (new)
- 📅 Programmes (new)
- 🏗️ Assessment Builder (new)

### **Visual Design**
- Clean, modern interface with Bootstrap-inspired styling
- Responsive tables and forms
- Icon buttons for actions
- Loading states and error handling
- Empty states with helpful hints
- Color-coded badges (green for "has templates", yellow for "none")

### **Step Indicator**
The Assessment Builder shows a visual progress bar with 5 steps:
- 📋 Select Programme
- 🎯 Dimensions
- ⭐ Competencies
- ❓ Questions
- ✅ Preview & Save

Active step is highlighted in blue, completed steps in green.

---

## 🔒 Security & RLS

All database operations respect existing RLS policies:

- ✅ Only admins can create/edit/delete clients, programmes, and templates
- ✅ Coachees can only view templates for their own programme
- ✅ Nominees can only view templates for programmes they're assessing

---

## 🐛 Troubleshooting

### "No programmes available without templates"
- You need to create a programme first
- Or the programme already has templates (you can delete them via Supabase UI if testing)

### "Please create at least one client before creating programmes"
- Create a client first in the Clients section

### Can't save templates
- Check browser console for errors
- Verify Supabase connection in `.env`
- Ensure admin role is set correctly in user_metadata

### Templates not appearing in database
- Check the `assessment_templates` table in Supabase
- Look for rows with your `programme_id`
- Both `self` and `peer` templates should be created together

---

## 📝 Example Complete Assessment

Here's a sample structure to get started:

**Dimensions: 4**
1. Strategic Thinking
2. People Leadership
3. Communication & Influence
4. Execution Excellence

**Competencies: 12** (3 per dimension)
- Strategic Thinking: Vision & Direction, Innovation, Long-term Planning
- People Leadership: Team Building, Coaching, Empowerment
- Communication: Clarity, Active Listening, Influence
- Execution: Accountability, Decision Making, Results Focus

**Questions: 60 self, 36 peer**
- 5 questions per competency (self)
- 3 questions per competency (peer)
- Most important questions tagged "Both"

---

## 🎉 Success Criteria

By the end of this workflow, you should have:

✅ Created a client organization
✅ Created a programme for that client
✅ Designed a custom assessment structure with dimensions, competencies, and questions
✅ Generated and saved TWO assessment templates (self + peer) to Supabase
✅ Seen the templates appear in the Programmes table with a green "✓ 2" badge

---

## 📚 Related Documentation

- `schema_changes_summary.md` - Database structure
- `assessment_workflow_guide.md` - Overall 6-phase workflow
- `magic_link_auth_guide.md` - User authentication

---

## 🚀 Ready to Build!

Start by creating your first client, then programme, then use the Assessment Builder to design a custom 360° assessment. The wizard interface will guide you through each step! 🎯

