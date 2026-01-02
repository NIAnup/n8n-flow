# MongoDB Atlas Connection Setup Guide

## Getting Your Connection String

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Select your cluster** (automation-flow)
3. **Click "Connect"** button
4. **Choose "Connect your application"**
5. **Select "Node.js"** as the driver
6. **Copy the connection string** - it will look like:
   ```
   mongodb+srv://<username>:<password>@automation-flow.en7izco.mongodb.net/?retryWrites=true&w=majority
   ```

## Updating Your .env File

1. Replace `<username>` with your database username
2. Replace `<password>` with your database user password
3. Add your database name before the `?`:
   ```
   mongodb+srv://username:password@automation-flow.en7izco.mongodb.net/social-media-automation?retryWrites=true&w=majority
   ```

## Creating a Database User (if needed)

1. In MongoDB Atlas, go to **"Database Access"** (under Security)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username and password
5. Set user privileges to **"Atlas admin"** (or specific database permissions)
6. Click **"Add User"**
7. Use these credentials in your connection string

## Common Issues

### Authentication Failed
- Verify username and password are correct
- Make sure the database user exists in "Database Access"
- If password contains special characters, URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `:` → `%3A`
  - `/` → `%2F`
  - `?` → `%3F`
  - `=` → `%3D`

### IP Not Whitelisted
- Go to "Network Access" in MongoDB Atlas
- Click "Add IP Address"
- Click "Add Current IP Address"
- Wait 1-2 minutes for changes to propagate

