# Supabase Setup Guide

Your application is now configured to use **Supabase Auth** with your custom schema. The app will authenticate users via Supabase Auth and then fetch their profile data from your `users` table joined with `departments` and `roles`.

## 1. Schema Requirements

Your existing schema should have:

### Users Table
- `id` (UUID, primary key, references auth.users)
- `name` (TEXT)
- `email` (TEXT)
- `dept_id` (UUID, foreign key to departments)
- `role_id` (UUID, foreign key to roles)
- Other fields: status, performance_score, joined_at, end_date, created_at

### Departments Table
- `id` (UUID)
- `slug` (TEXT) - e.g., 'ceo-office', 'tech', 'hr'
- `label` (TEXT)
- `is_active` (BOOLEAN)

### Roles Table
- `id` (UUID)
- `slug` (TEXT) - e.g., 'ceo', 'member', 'department_pod_lead'
- `label` (TEXT)
- `hierarchy_level` (TEXT)
- `is_active` (BOOLEAN)

## 2. Create Test Users in Supabase Auth

In your Supabase dashboard:
- Go to **Authentication** → **Users**
- Click **Add user**
- Create users with these emails (set any password, e.g., password123):

```
ceo.office@jcf.local
hr@jcf.local
psyconnect@jcf.local
tech@jcf.local
pr@jcf.local
carcinoma@jcf.local
medical@jcf.local
cgmp@jcf.local
```

Note the user ID (UUID) for each created user.

## 3. Add User Profiles

Go to **Table Editor** → Select **users** table → Click **Insert row**

For each test user, insert a row with:

| Column | Value | Example |
|--------|-------|---------|
| id | UUID from auth.users | (copy from step 2) |
| name | Full name | CEO Office |
| email | Email address | ceo.office@jcf.local |
| dept_id | Department UUID | (select from departments) |
| role_id | Role UUID | (select from roles) |
| status | Status | active |
| joined_at | Join date | 2024-01-01 |

## 4. Environment Variables

Your `.env` file is already configured with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 5. Using Supabase in Your App

```typescript
import { supabase } from '@/utils/supabase';

// Fetch data
const { data, error } = await supabase
  .from('users')
  .select('id, name, email, department:dept_id(slug, label), role:role_id(slug, label)');

// Insert data
const { data, error } = await supabase
  .from('users')
  .insert([{ id: userId, name: 'John Doe', email: '...', ... }]);

// Update data
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Jane Doe' })
  .eq('id', userId);
```

## 6. Authentication Context

The `useAuth()` hook now uses Supabase Auth with your schema:

```typescript
import { useAuth } from '@/auth/authContext';

export function MyComponent() {
  const { user, isLoading, login, logout, isAuthenticated } = useAuth();

  // user contains: id, email, firstName, lastName, department, role
}
```

**Login Example:**
```typescript
const { login } = useAuth();
await login('ceo.office@jcf.local', 'password123');
```

## Notes

- Passwords are managed by Supabase Auth (encrypted and secure)
- User profiles are fetched from your `users` table with department and role relations
- Auth state is automatically synced across tabs
- User data is cached in localStorage for offline access
- The app works offline if user is already logged in
