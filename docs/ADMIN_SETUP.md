# Admin Dashboard Setup Guide

This guide explains how to access and use the YoForex admin dashboard.

## Prerequisites

1. A Replit account
2. Access to the database (production or development)

## Granting Admin Access

### Method 1: Database Access (Development)

If you have direct database access, you can promote a user to admin using SQL:

```sql
-- Find your user ID first
SELECT id, username, email, role FROM users WHERE email = 'your-email@example.com';

-- Promote user to admin
UPDATE users SET role = 'admin' WHERE id = 'your-user-id';
```

### Method 2: Using the SQL Tool (Replit)

1. In Replit, navigate to the Database tab
2. Run the following query to find your user:
   ```sql
   SELECT id, username, email, role FROM users WHERE email = 'your-email@example.com';
   ```
3. Copy your user ID and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE id = 'your-user-id';
   ```

## Accessing the Admin Dashboard

1. **Log in to the platform** at `/api/login`
2. **Log out and log back in** to refresh your session with the new role
3. Navigate to `/admin` or `/admin/brokers` to access the dashboard

## Admin Features

### Broker Management (`/admin/brokers`)

- **View All Brokers**: See complete list with filters
- **Add Broker**: Create new broker profiles
- **Edit Broker**: Update broker information
- **Verify Broker**: Mark brokers as verified/trusted
- **Scam Warning**: Flag brokers as suspicious
- **Delete Broker**: Soft-delete broker profiles

### Scam Reports (`/admin/brokers` → Scam Reports tab)

- Review and moderate scam reports
- Approve or dismiss reports
- Set severity levels (low, medium, high, critical)

### Broker Reviews (`/admin/brokers` → Reviews tab)

- Moderate user-submitted broker reviews
- Approve legitimate reviews
- Reject spam or inappropriate reviews

## Role Hierarchy

- **member**: Regular users (default)
- **moderator**: Can moderate content
- **admin**: Full access to admin dashboard
- **superadmin**: Highest level (future use)

## Troubleshooting

### "Authentication Required" Error

- Make sure you're logged in via `/api/login`
- Check that your user has the `admin` role in the database
- Log out and log back in to refresh your session

### "Access Denied" Error

- Your account exists but doesn't have admin privileges
- Contact a system administrator or use the database to grant yourself admin access

### API Endpoints Return 401

- Your session expired - log out and log back in
- You're not logged in - navigate to `/api/login`

## Security Notes

- Admin access should only be granted to trusted users
- Always use strong authentication
- Monitor admin actions via the Audit Logs page
- Regularly review user roles and permissions

## Support

For issues or questions, contact the development team or check the platform documentation.
