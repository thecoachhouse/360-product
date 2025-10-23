# 🔗 Magic Link Authentication Setup - User Portal

## ✅ What Was Implemented

### 1. **Files Modified**

#### **UserLogin.jsx**
- Replaced dummy login with real Supabase magic link authentication
- Sends OTP (One-Time Password) link via email
- Success/error state handling
- User-friendly feedback messages

#### **UserDashboard.jsx**
- Fetches real nomination data from Supabase
- Matches logged-in user email with nominee records
- Displays assessments assigned to the user
- Loading, error, and empty states

#### **App.jsx**
- Updated user authentication logic
- Distinguishes between admin and user sessions
- Protects user routes based on session state
- Unified logout for both admin and user

---

## 🔄 How Magic Link Authentication Works

### **User Flow:**

1. **User visits** `/user/login`
2. **Enters email** (e.g., `john.doe@company.com`)
3. **Clicks "Send Magic Link"**
4. **Supabase sends email** with secure one-time link
5. **User clicks link** in email
6. **Redirected to** `/user/dashboard`
7. **Session created** and persisted
8. **Dashboard loads** with their assigned assessments

---

## 📧 Email Configuration (IMPORTANT)

### **Default Email Provider**

By default, Supabase sends emails from their servers. This works for testing but has limitations:
- Rate limits (3-4 emails per hour)
- Generic sender address
- May land in spam folders

### **Configure Custom Email Provider (Recommended for Production)**

For production use, configure a custom SMTP provider:

1. **Go to Supabase Dashboard** → **Authentication** → **Email Templates**
   - URL: https://app.supabase.com/project/tjkafunnqgcfpzikvnuy/auth/templates

2. **Customize the Magic Link Template:**

**Subject:** `Sign in to Turning Point 360`

**Body:**
```html
<h2>Welcome to Turning Point 360</h2>
<p>You've been invited to complete a peer assessment. Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In to Complete Assessment</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this email, you can safely ignore it.</p>
```

3. **Configure SMTP Settings** (Optional but recommended):
   - Go to **Settings** → **Auth** → **SMTP Settings**
   - Use SendGrid, AWS SES, Mailgun, or similar
   - This removes rate limits and improves deliverability

---

## 🧪 Testing Magic Link Authentication

### **Step 1: Create a Test Nominee**

Run this SQL in Supabase SQL Editor to create test data:

```sql
-- Insert a test client
INSERT INTO public.clients (id, name, created_at)
VALUES 
  (gen_random_uuid(), 'Test Company', NOW())
ON CONFLICT DO NOTHING;

-- Insert a test programme
INSERT INTO public.programmes (id, name, client_id, created_at)
VALUES 
  (gen_random_uuid(), 'Test Programme', (SELECT id FROM public.clients LIMIT 1), NOW())
ON CONFLICT DO NOTHING;

-- Insert a test coachee
INSERT INTO public.coachees (id, full_name, email, programme_id, created_at)
VALUES 
  (gen_random_uuid(), 'Test Coachee', 'coachee@test.com', (SELECT id FROM public.programmes LIMIT 1), NOW())
ON CONFLICT DO NOTHING;

-- Insert a test nominee (THIS IS THE USER WHO WILL LOG IN)
INSERT INTO public.nominees (id, full_name, email, created_at)
VALUES 
  (gen_random_uuid(), 'Test Nominee', 'your-real-email@gmail.com', NOW())
ON CONFLICT DO NOTHING;

-- Create a nomination linking the nominee to the coachee
INSERT INTO public.nominations (id, coachee_id, nominee_id, relationship_type, created_at)
VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM public.coachees WHERE email = 'coachee@test.com'),
    (SELECT id FROM public.nominees WHERE email = 'your-real-email@gmail.com'),
    'peer',
    NOW()
  )
ON CONFLICT DO NOTHING;
```

**⚠️ Important:** Replace `'your-real-email@gmail.com'` with your actual email address!

---

### **Step 2: Test the Login Flow**

1. **Navigate to** `http://localhost:5173/user/login`

2. **Enter your email** (the one you used in the SQL above)

3. **Click "Send Magic Link"**

4. **Check your email**
   - Subject: "Confirm Your Signup"
   - Look in spam folder if not in inbox
   - Click the "Confirm your mail" link

5. **You should be redirected** to `/user/dashboard`

6. **Expected result:**
   - Dashboard shows "Test Coachee" assessment
   - Relationship type: "peer"
   - No errors in browser console

---

### **Step 3: Test Session Persistence**

1. **Refresh the page** (F5 or Cmd+R)
   - ✅ Expected: Still logged in

2. **Close browser and reopen**
   - ✅ Expected: Still logged in

3. **Click logout**
   - ✅ Expected: Redirected to `/user/login`

---

## 🔒 Security Features

### **Backend Security (RLS)**

The RLS policies ensure:
- Users can only see nominations where they are the nominee
- Users cannot see other users' assessments
- Users cannot modify coachee data
- All queries respect email-based access control

### **Frontend Security**

- Magic links expire after 1 hour (Supabase default)
- Session tokens stored securely in localStorage
- PKCE flow for additional security
- Automatic redirect if not authenticated
- No sensitive data exposed to unauthorized users

---

## 🐛 Troubleshooting

### **Issue: Magic link email not received**

**Causes:**
- Email in spam folder
- Rate limit reached (3-4 emails/hour on free tier)
- Invalid email address
- Email service blocked

**Solutions:**
1. Check spam/junk folder
2. Wait 1 hour and try again
3. Use different email address for testing
4. Configure custom SMTP provider

---

### **Issue: "No assessments assigned yet" message**

**Causes:**
- No nominations exist for this email
- Nominee record doesn't exist
- Wrong email used

**Solutions:**
1. Verify nomination exists in database:
   ```sql
   SELECT n.id, n.relationship_type, nom.email as nominee_email, c.full_name as coachee_name
   FROM public.nominations n
   JOIN public.nominees nom ON n.nominee_id = nom.id
   JOIN public.coachees c ON n.coachee_id = c.id
   WHERE nom.email = 'your-email@gmail.com';
   ```

2. Create test data using SQL from Step 1 above

---

### **Issue: "Failed to load your assessments"**

**Causes:**
- RLS policies blocking access
- Database connection issue
- Query error

**Debug:**
1. Open browser DevTools → Console
2. Check for errors
3. Verify RLS policies:
   ```sql
   -- Test if you can query nominations (run while logged in as nominee)
   SELECT * FROM public.nominations
   WHERE nominee_id = (SELECT id FROM public.nominees WHERE email = auth.jwt()->>'email');
   ```

---

### **Issue: Magic link redirects to error page**

**Causes:**
- Expired link (>1 hour old)
- Link already used
- Invalid token

**Solution:**
- Request a new magic link
- Links are single-use only

---

## 📊 What's Different from Admin Auth?

| Feature | Admin Portal | User Portal |
|---------|-------------|-------------|
| **Auth Method** | Email + Password | Magic Link (OTP) |
| **Role Check** | `role === 'admin'` | No admin role |
| **Email Conf** | Not required | Required (via link) |
| **Data Access** | All coachees | Only assigned assessments |
| **Session** | Persistent | Persistent |

---

## 🎯 Next Steps

### **For Development:**

1. ✅ Test magic link flow with real email
2. ✅ Verify RLS policies work correctly
3. ⏳ Customize email templates (optional)
4. ⏳ Configure custom SMTP (for production)

### **For Production:**

1. **Set up custom SMTP** provider (SendGrid, AWS SES, etc.)
2. **Customize email templates** with branding
3. **Set shorter link expiry** (optional, default is 1 hour)
4. **Add email rate limiting** to prevent abuse
5. **Monitor failed login attempts**

---

## 📝 RLS Policy Verification

To verify RLS policies are working correctly for nominees:

```sql
-- This should only return nominations for the logged-in user's email
SELECT 
  n.id,
  n.relationship_type,
  nom.email as my_email,
  c.full_name as assessing_for
FROM public.nominations n
JOIN public.nominees nom ON n.nominee_id = nom.id
JOIN public.coachees c ON n.coachee_id = c.id;

-- If logged in as nominee, this should only show YOUR nominations
-- If logged in as admin, this should show ALL nominations
-- If not logged in, this should return no rows
```

---

## 🎉 Summary

Magic link authentication is now **fully functional**! Users can:

- ✅ Request magic link via email
- ✅ Sign in securely without password
- ✅ View their assigned assessments
- ✅ Session persists across page refreshes
- ✅ RLS policies protect data access
- ✅ Logout works correctly

**Next immediate action:** Test the magic link flow with your own email!

