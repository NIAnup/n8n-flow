# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
# Minimum required:
# - MONGODB_URI
# - JWT_SECRET
# - OPENAI_API_KEY (or GEMINI_API_KEY)
```

### 3. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 4. Run the Application

```bash
# Option 1: Run both server and client together
npm run dev

# Option 2: Run separately
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📝 First Steps

1. **Register an Account**
   - Go to http://localhost:3000/register
   - Create your account

2. **Connect Social Media Accounts**
   - Navigate to "Social Accounts"
   - Click "Connect" for each platform
   - Complete OAuth flow

3. **Create Your First Post**
   - Go to "Automation Posts"
   - Select "Today" tab
   - Fill in topic and explanation
   - Select platforms
   - Schedule your post

## 🔑 API Keys Setup

### OpenAI (ChatGPT)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `.env`: `GEMINI_API_KEY=...`

### Social Media OAuth
Each platform requires OAuth app setup:
- **LinkedIn**: https://www.linkedin.com/developers/apps
- **Facebook**: https://developers.facebook.com/apps
- **Twitter**: https://developer.twitter.com/en/portal/dashboard
- **Instagram**: https://developers.facebook.com/apps (uses Facebook Graph API)

## 🧪 Test the API

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore the API endpoints
- Customize the AI prompts in `server/services/aiService.js`
- Connect your social media accounts
- Start scheduling posts!

## 🆘 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### API Key Errors
- Verify API keys are correct in `.env`
- Check API key permissions
- Ensure sufficient API credits

### Port Already in Use
- Change `PORT` in `.env` (backend)
- Change port in `client/vite.config.js` (frontend)

---

**Need Help?** Check the main README.md or open an issue.

