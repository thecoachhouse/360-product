# ⚡ Quick Start - Assessment Builder

## 🎯 5-Minute Setup

### 1️⃣ Start the Dev Server
```bash
cd frontend
npm run dev
```

### 2️⃣ Log In as Admin
- Navigate to `http://localhost:5173`
- Use admin email/password credentials

### 3️⃣ Create Your First Assessment

**Step 1: Create Client** (30 seconds)
```
Sidebar → Clients → + New Client
Name: "Acme Corp"
Cohort Size: 20
→ Create Client
```

**Step 2: Create Programme** (30 seconds)
```
Sidebar → Programmes → + New Programme
Client: Acme Corp
Name: "Leadership Development Q1 2025"
Min Nominations: 1 manager, 2 peers, 2 direct reports
→ Create Programme
```

**Step 3: Build Assessment** (5 minutes)
```
Click green "Build Assessment" icon next to your programme
OR
Sidebar → Assessment Builder → Select Programme

Wizard Steps:
1. Select Programme ✅
2. Add 4 Dimensions (Strategic Thinking, People Leadership, Communication, Execution)
3. Add 12 Competencies (3 per dimension)
4. Add 60 Questions (5 per competency, tag as "Both" or "Self"/"Peer")
5. Preview & Save ✅
```

**Done!** ✨ Two assessment templates are now saved to Supabase.

---

## 📊 What Was Built?

### New Admin Pages
1. **Client Management** - CRUD for client organizations
2. **Programme Management** - CRUD for coaching programmes
3. **Assessment Builder** - 5-step wizard to design assessments

### Files Created
```
frontend/src/pages/
  ├── ClientManagement.jsx       (Client CRUD)
  ├── ClientManagement.css       (Shared styles)
  ├── ProgrammeManagement.jsx    (Programme CRUD)
  ├── AssessmentBuilder.jsx      (5-step wizard)
  └── AssessmentBuilder.css      (Wizard styles)

frontend/src/components/
  └── Sidebar.jsx                (Updated with 4 menu items)

frontend/src/pages/
  └── Dashboard.jsx              (Updated with section routing)

.taskmaster/docs/
  ├── assessment_builder_guide.md  (Complete guide)
  └── QUICK_START.md               (This file!)
```

---

## 🎨 User Experience Flow

```
Admin Dashboard
  ↓
Sidebar Menu
  ├─ 📊 Manage Assessments (existing coachee list)
  ├─ 👥 Clients (NEW!)
  ├─ 📅 Programmes (NEW!)
  └─ 🏗️ Assessment Builder (NEW!)
```

**From Programmes → Build Assessment:**
```
Programme without templates shows green "Build" icon
  ↓
Click icon → Opens Assessment Builder
  ↓
5-Step Wizard:
  1. Select Programme 📋
  2. Define Dimensions 🎯
  3. Define Competencies ⭐
  4. Write Questions ❓
  5. Preview & Save ✅
  ↓
Templates saved to Supabase
  ↓
Return to Programmes (now shows "✓ 2" templates badge)
```

---

## 📚 Key Features

### Client Management
- ✅ Create/Edit/Delete clients
- ✅ Track cohort size
- ✅ View programme counts per client
- ✅ Responsive table UI

### Programme Management
- ✅ Create/Edit/Delete programmes
- ✅ Link to clients
- ✅ Set minimum nomination requirements
- ✅ Track coachee counts
- ✅ Track template status (green badge if exists)
- ✅ Quick "Build Assessment" action for programmes without templates

### Assessment Builder Wizard
- ✅ Step-by-step interface with visual progress
- ✅ Add/edit/remove dimensions
- ✅ Add/edit/remove competencies (mapped to dimensions)
- ✅ Add/edit/remove questions (tagged self/peer/both)
- ✅ Live preview of structure
- ✅ Summary statistics (counts)
- ✅ Generates TWO SurveyJS templates (self + peer)
- ✅ Saves to Supabase `assessment_templates` table

---

## 🔍 What Gets Saved?

When you complete the wizard, the system creates:

### Database Records
```sql
-- assessment_templates table (2 rows)
Row 1: Self-Assessment Template
  programme_id: <your_programme_id>
  name: "Leadership Development Q1 2025 - Self Assessment"
  template_type: "self"
  survey_json: { ... SurveyJS config with self questions ... }

Row 2: Peer-Assessment Template
  programme_id: <your_programme_id>
  name: "Leadership Development Q1 2025 - Peer Assessment"
  template_type: "peer"
  survey_json: { ... SurveyJS config with peer questions ... }
```

### SurveyJS JSON Structure
Each template contains:
- Pages (one per dimension)
- Panels (one per competency)
- Questions (rating type, 0-5 scale)
- Metadata (dimension/competency structure)
- Progress bar, question numbers, completion message

---

## 🎯 Example Assessment Structure

```
Dimension: Strategic Thinking
  ├─ Competency: Vision & Direction
  │    ├─ Q1: "I clearly articulate the vision..." [Both]
  │    ├─ Q2: "I translate strategic goals..." [Both]
  │    ├─ Q3: "I help others understand..." [Both]
  │    ├─ Q4: "I regularly reflect on..." [Self Only]
  │    └─ Q5: "I seek input from..." [Self Only]
  │
  ├─ Competency: Innovation
  │    └─ ... (5 questions)
  │
  └─ Competency: Long-term Planning
       └─ ... (5 questions)

... (3 more dimensions)

Total: 4 dimensions, 12 competencies, 60 self questions, 36 peer questions
```

---

## ✅ Testing Checklist

- [ ] Create a test client
- [ ] Create a test programme for that client
- [ ] Build a simple assessment (2 dimensions, 4 competencies, 12 questions)
- [ ] Verify templates appear in Programmes table
- [ ] Check Supabase `assessment_templates` table for 2 new rows
- [ ] Inspect the `survey_json` field to see SurveyJS structure

---

## 🚀 Next Steps

After building assessment templates:
1. Add coachees to the programme (future feature)
2. Send self-assessment invitations (future feature)
3. Coachees nominate peers (future feature)
4. Send peer-assessment invitations (future feature)
5. Generate reports (future feature)

---

## 🐛 Common Issues

**"No programmes available"**
→ Create a programme first

**"Please create at least one client"**
→ Create a client first before programmes

**Can't save templates**
→ Check browser console, verify Supabase credentials in `.env`

**Templates not showing in database**
→ Check `assessment_templates` table in Supabase directly

---

## 📖 Full Documentation

See `assessment_builder_guide.md` for complete details, examples, and troubleshooting.

---

**Ready to build custom assessments!** 🎉

