# Supabase Database Setup

To ensure the application can sync user profiles, please execute the following SQL in your Supabase SQL Editor:

```sql
-- Create the users table
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Stores Firebase UID
  email TEXT UNIQUE,
  name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the authorized_admins table for strict pre-verification whitelist checks
CREATE TABLE authorized_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pre-seed main trusted admins (super admin user)
INSERT INTO authorized_admins (email, name)
VALUES 
  ('ruhandharpurkayastha@gmail.com', 'Super Admin'),
  ('admin@googlydelivery.in', 'Admin'),
  ('shyam.support@googly.com', 'Support Shyam'),
  ('reema.ops@googly.com', 'Ops Reema'),
  ('devlina.sen@yahoo.com', 'Devlina')
ON CONFLICT (email) DO NOTHING;

-- Optional: Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE authorized_admins;
```

## Environment Variables
Ensure the following are set in your AI Studio Secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_CONFIG` (JSON string from Firebase Console Settings)
