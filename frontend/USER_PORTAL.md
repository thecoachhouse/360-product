# Turning Point 360 - User Portal

## Overview

The User Portal allows nominees to log in, view their assigned assessments, and complete 360° feedback surveys for their colleagues.

## Routes

### User Routes
- `/user/login` - User login page (magic link placeholder)
- `/user/dashboard` - User dashboard with assessment list
- `/user/assessment/:id` - Assessment completion page with SurveyJS

### Admin Routes
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin management dashboard

## User Flow

1. **Login** (`/user/login`)
   - Nominee enters their email
   - "Send Magic Link" button (currently just validates email for demo)
   - Future: Will send actual magic link via email

2. **Dashboard** (`/user/dashboard`)
   - List of 5 pending assessments (currently dummy data)
   - Each assessment shows:
     - Assessment name: "Turning Point 360 Assessment"
     - Coachee name (person being reviewed)
     - Due date
     - "Start Assessment" button
   - Left sidebar with "Dashboard" section
   - Persistent white navbar with profile dropdown

3. **Assessment** (`/user/assessment/:id`)
   - SurveyJS embedded assessment
   - Back button to return to dashboard
   - Survey loads from SurveyJS API based on surveyId
   - Results posted to SurveyJS API on completion

## Features

### User Dashboard
- **Assessment Cards**: Clean, card-based layout showing pending assessments
- **User Icons**: Visual indicators for coachee and due date
- **Responsive Design**: Works on desktop and mobile
- **Color Scheme**: Consistent #f8f9fa background with white panels

### SurveyJS Integration
- **Survey Configuration**: Located in `src/data/surveyConfig.js`
- **API Integration**: Loads surveys from SurveyJS API
- **Result Submission**: Posts completed surveys back to API
- **Error Handling**: Displays appropriate messages for loading/saving states

## Dummy Data

Current dummy assessments in `UserDashboard.jsx`:
1. Sarah Johnson - Due Oct 20, 2025
2. Michael Chen - Due Oct 22, 2025
3. Emma Williams - Due Oct 25, 2025
4. David Martinez - Due Oct 27, 2025
5. Lisa Anderson - Due Oct 30, 2025

## SurveyJS Configuration

Located in `src/data/surveyConfig.js`:
```javascript
{
  "surveyId": "35413d81-ae06-40ae-aed6-c6b3ff716b38",
  "surveyPostId": "4c371c89-a222-4999-9ccf-997bd412ad21"
}
```

To change the survey:
1. Create/configure your survey at https://surveyjs.io
2. Update the `surveyId` and `surveyPostId` in `surveyConfig.js`

## Next Steps

### Phase 1: Authentication
- [ ] Integrate Supabase for magic link authentication
- [ ] Replace dummy login with real email verification
- [ ] Add proper session management

### Phase 2: Real Data
- [ ] Connect to Supabase to fetch real assessment data
- [ ] Filter assessments by logged-in user
- [ ] Track assessment completion status
- [ ] Update UI based on actual due dates

### Phase 3: Survey Integration
- [ ] Store survey responses in Supabase
- [ ] Link responses to specific assessments
- [ ] Add progress saving (allow partial completion)
- [ ] Add completion confirmation page

## File Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Shared navbar (admin & user)
│   ├── UserSidebar.jsx         # User navigation sidebar
│   └── SurveyComponent.jsx     # SurveyJS integration
├── pages/
│   ├── UserLogin.jsx           # User login page
│   ├── UserDashboard.jsx       # Assessment list
│   ├── UserDashboard.css
│   ├── AssessmentPage.jsx      # Survey completion page
│   └── AssessmentPage.css
├── data/
│   └── surveyConfig.js         # SurveyJS configuration
└── App.jsx                     # Routing for admin & user
```

## Testing

### Test User Flow
1. Navigate to `http://localhost:5173` (redirects to `/user/login`)
2. Enter any email address
3. Click "Send Magic Link"
4. View dummy assessment list on dashboard
5. Click "Start Assessment" on any item
6. Complete the SurveyJS assessment
7. Submit and return to dashboard

### Test Admin Flow
1. Navigate to `http://localhost:5173/admin/login`
2. Enter any email and password
3. View admin dashboard with "Manage Assessments" section

## API Integration Points

### SurveyJS API
- **Load Survey**: `GET https://api.surveyjs.io/public/v1/Survey/getSurvey?surveyId={id}`
- **Post Results**: `POST https://api.surveyjs.io/public/v1/Survey/post/`

### Future Supabase Integration
- User authentication (magic links)
- Assessment data retrieval
- Response storage
- Progress tracking

