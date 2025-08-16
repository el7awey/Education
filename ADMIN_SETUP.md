# Admin Dashboard Setup Guide

This guide will help you set up the Admin Dashboard for your Teach Hub Plus application.

## Prerequisites

- Supabase project with the database schema already set up
- Admin user account (you'll create this)
- Access to Supabase dashboard

## Step 1: Database Migration

Run the following SQL migration in your Supabase SQL editor:

```sql
-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update existing profiles to have 'user' role if not set
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add check constraint to ensure valid roles
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_valid_role 
CHECK (role IN ('user', 'teacher', 'admin'));
```

## Step 2: Create Admin User

1. **Sign up or sign in** to your application with your desired admin account
2. **Go to Supabase Dashboard** → Table Editor → `profiles` table
3. **Find your user record** and update the `role` column to `'admin'`
4. **Save the changes**

Alternatively, you can run this SQL command (replace `your-email@example.com` with your actual email):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Step 3: Access Admin Dashboard

1. **Sign in** to your application with the admin account
2. **Click on your profile** in the header
3. **Select "Admin Panel"** from the dropdown menu
4. **Navigate to `/admin`** in your browser

## Step 4: Verify Setup

The Admin Dashboard should now be accessible and include:

- **Dashboard Overview** - Platform statistics and quick actions
- **User Management** - View, edit, and manage user accounts and roles
- **Course Management** - Create, edit, and delete courses
- **Category Management** - Manage course categories
- **Enrollment Management** - View student enrollments and progress
- **Testimonial Management** - Approve and moderate student reviews

## Features

### User Management
- View all users with search and filtering
- Edit user profiles and roles
- Delete users (with safety checks)
- Role-based access control (user, teacher, admin)

### Course Management
- Full CRUD operations for courses
- Bulk course operations
- Category assignment
- Publishing controls

### Category Management
- Create and edit course categories
- Delete categories (only if no courses are assigned)
- Bilingual support (English/Arabic)

### Enrollment Management
- View all student enrollments
- Track progress and completion
- Filter by status and course
- Payment information display

### Testimonial Management
- Approve/reject student reviews
- Feature/unfeature testimonials
- Bulk moderation tools
- Quality control

## Security Features

- **Protected Routes** - Only admin users can access `/admin`
- **Role-based Access Control** - Different permissions for different user types
- **Input Validation** - All forms include validation and sanitization
- **Audit Trail** - All admin actions are logged in the database

## Troubleshooting

### Can't Access Admin Panel?
1. Verify your user has `role = 'admin'` in the profiles table
2. Check that you're signed in
3. Clear browser cache and cookies
4. Check browser console for errors

### Database Errors?
1. Ensure the migration has been run successfully
2. Check that all required tables exist
3. Verify RLS policies allow admin access
4. Check Supabase logs for detailed error messages

### Performance Issues?
1. Ensure database indexes are created
2. Check RLS policy performance
3. Monitor Supabase usage limits
4. Optimize queries if needed

## Customization

### Adding New Admin Sections
1. Create new component in `src/components/admin/`
2. Add to `AdminDashboard.tsx` navigation
3. Update routing and state management
4. Add to admin menu items

### Modifying Permissions
1. Update `ProtectedRoute.tsx` component
2. Modify role checks in components
3. Update RLS policies in Supabase
4. Test with different user roles

### Styling Changes
1. Modify Tailwind classes in components
2. Update theme variables
3. Add custom CSS if needed
4. Ensure RTL support for Arabic

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Review Supabase logs for database errors
3. Verify all migrations have been applied
4. Test with a fresh admin account
5. Check network requests in browser dev tools

## Next Steps

After setup, consider:

- Setting up automated backups
- Configuring monitoring and alerts
- Implementing audit logging
- Setting up user activity tracking
- Configuring email notifications for admin actions
