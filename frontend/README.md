# Turning Point 360 - Frontend Application

A complete web application for managing and completing 360° coaching assessments for The Coach House's Turning Point program.

## Features

### Admin Portal (`/admin/*`)
- **Admin Login**: Email/password authentication
- **Admin Dashboard**: Manage assessments, track progress
- **Sticky Navbar**: Always-visible white navbar with profile dropdown
- **Left Sidebar**: Navigation panel with "Manage Assessments" section

### User Portal (`/user/*`)
- **User Login**: Magic link authentication (placeholder)
- **Assessment Dashboard**: View assigned assessments with due dates
- **SurveyJS Integration**: Embedded 360° assessment surveys
- **Clean Interface**: Minimalist design with #f8f9fa background

## Tech Stack

- React 18
- Vite
- React Router DOM
- SurveyJS (survey-react-ui)
- Vanilla CSS

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Routes

### User Routes (Default)
- `/` → redirects to `/user/login`
- `/user/login` - User login page
- `/user/dashboard` - Assessment list
- `/user/assessment/:id` - Complete assessment

### Admin Routes
- `/admin/login` - Admin login page
- `/admin/dashboard` - Management dashboard

## Temporary Authentication

**Admin**: Enter any email/password combination  
**User**: Enter any email address

Supabase authentication will be integrated in the next phase.

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Shared navbar (admin & user)
│   ├── Navbar.css
│   ├── Sidebar.jsx             # Admin sidebar
│   ├── Sidebar.css
│   ├── UserSidebar.jsx         # User sidebar
│   └── SurveyComponent.jsx     # SurveyJS integration
├── pages/
│   ├── Login.jsx               # Admin login
│   ├── Login.css
│   ├── Dashboard.jsx           # Admin dashboard
│   ├── Dashboard.css
│   ├── UserLogin.jsx           # User login
│   ├── UserDashboard.jsx       # User assessment list
│   ├── UserDashboard.css
│   ├── AssessmentPage.jsx      # Survey completion
│   └── AssessmentPage.css
├── data/
│   └── surveyConfig.js         # SurveyJS configuration
├── App.jsx                     # Routing for both portals
├── App.css
└── index.css
```

## Documentation

- [USER_PORTAL.md](./USER_PORTAL.md) - Detailed user portal documentation

## Next Steps

1. ✅ Basic frontend with admin and user portals
2. ✅ SurveyJS integration for assessments
3. 🔄 Integrate Supabase authentication
4. 📋 Connect to real data sources
5. 📊 Populate "Manage Assessments" with functionality
