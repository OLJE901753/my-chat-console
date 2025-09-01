# 🔐 Admin User Setup Guide

## Overview
This guide will help you set up Oliver Jensen as the admin user for the Farm Management System. Only pre-approved users in the Supabase database will be able to log in.

## 🚨 **Security Notice**
- **No mock authentication** - Only database users can log in
- **Strict access control** - No unauthorized access possible
- **Admin privileges** - Oliver Jensen will have full system access

## 📋 **Prerequisites**
1. Supabase project created and running
2. Database schema applied (from `supabase/migrations/001_initial_schema.sql`)
3. Supabase project URL and anon key

## 🔧 **Step-by-Step Setup**

### **Step 1: Create Environment Variables**
Create a `.env` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these values from:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

### **Step 2: Create Admin User in Supabase Auth**

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Users**

2. **Add New User**
   - Click **"Add User"**
   - **Email**: `oliver.jensen@shoretech.no`
   - **Password**: `Bank901753`
   - **Email Confirm**: ✅ (check this box)
   - Click **"Create User"**

3. **Copy the User ID**
   - After creation, you'll see a UUID
   - Copy this UUID (e.g., `12345678-1234-1234-1234-123456789abc`)

### **Step 3: Update the Setup Script**

1. **Open** `supabase/setup_admin_user.sql`
2. **Replace** the placeholder UUID with the actual UUID:
   ```sql
   '12345678-1234-1234-1234-123456789abc' -- REPLACE WITH ACTUAL UUID
   ```

### **Step 4: Run the Setup Script**

1. **Go to Supabase Dashboard**
   - Navigate to **SQL Editor**
   - Create a new query
   - Paste the contents of `supabase/setup_admin_user.sql`
   - Click **"Run"**

### **Step 5: Verify Setup**

The script will show a SELECT result confirming the user was created:
```sql
id                                    | email                           | role   | created_at           | last_login
--------------------------------------|--------------------------------|--------|---------------------|------------
12345678-1234-1234-1234-123456789abc | oliver.jensen@shoretech.no     | admin  | 2025-08-31 14:30:00 | null
```

## 🧪 **Testing the Login**

1. **Start your dev server**: `npm run dev`
2. **Open** `http://localhost:8080`
3. **Login with**:
   - **Email**: `oliver.jensen@shoretech.no`
   - **Password**: `Bank901753`
4. **Expected result**: Successful login and redirect to dashboard

## 🔒 **Security Features Active**

- ✅ **Database-only authentication** - No mock users
- ✅ **Row Level Security** - Data access controlled by role
- ✅ **Input validation** - All inputs sanitized and validated
- ✅ **CSRF protection** - Forms protected against attacks
- ✅ **XSS prevention** - Input sanitization active
- ✅ **Role-based access** - Admin has full system access

## 🚨 **Troubleshooting**

### **"Authentication system not configured" Error**
- Check your `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart your dev server after adding environment variables

### **"User profile not found" Error**
- Ensure you ran the setup script
- Check the UUID in the script matches the user ID from Supabase Auth
- Verify the `users` table exists and has the correct schema

### **"Invalid credentials" Error**
- Double-check email: `oliver.jensen@shoretech.no`
- Double-check password: `Bank901753`
- Ensure the user was created in Supabase Auth

## 📚 **Next Steps**

After successful admin login:

1. **Set up additional users** through the admin interface
2. **Configure farm zones** and sensor networks
3. **Set up GPS fencing** for autonomous vehicles
4. **Configure weather stations** and monitoring systems

## 🆘 **Need Help?**

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set
3. Ensure the Supabase project is running
4. Check that the database schema was applied correctly

---

**Remember**: Only users explicitly added to the Supabase database can access the system. This ensures maximum security for your farm management operations.
