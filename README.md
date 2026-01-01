# AI-Powered Social Media Automation Tool

An end-to-end automation platform that generates high-quality social media content using AI (ChatGPT or Gemini) and automatically posts to LinkedIn, Facebook, X (Twitter), and Instagram.

## 🎯 Features

- **AI Content Generation**: Choose between ChatGPT or Gemini for content creation
- **Multi-Platform Posting**: Automatically post to LinkedIn, Facebook, X (Twitter), and Instagram
- **Flexible Scheduling**: 
  - **Today**: Single post scheduling
  - **Weekly**: Bulk planning via Excel/CSV/DOCX upload
  - **Monthly**: AI-generated monthly content plans
- **Image Generation**: AI-generated images using DALL-E
- **Platform-Optimized Content**: Each platform gets content tailored to its audience
- **User Dashboard**: Track posts, schedules, and usage statistics
- **Automated Posting**: Background scheduler handles all scheduled posts

## 🏗️ Architecture

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** authentication
- **Node-cron** for scheduling
- **Multer** for file uploads
- **OpenAI API** (ChatGPT & DALL-E)
- **Google Gemini API**

### Frontend
- React (to be implemented)
- Modern, responsive UI

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- API Keys:
  - OpenAI API key (for ChatGPT)
  - Google Gemini API key
  - Social media OAuth credentials (LinkedIn, Facebook, Twitter, Instagram)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   cd n8n-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys and configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/social-media-automation
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   JWT_SECRET=your-secret-key
   # ... other social media API keys
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Start the server**
   ```bash
   npm run server
   ```

   The server will run on `http://localhost:5000`

## 📁 Project Structure

```
n8n-flow/
├── server/
│   ├── index.js                 # Main server file
│   ├── models/                  # MongoDB models
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Schedule.js
│   │   └── SocialAccount.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── schedules.js
│   │   ├── social.js
│   │   ├── upload.js
│   │   └── dashboard.js
│   ├── services/                # Business logic
│   │   ├── aiService.js         # AI content generation
│   │   ├── fileProcessor.js    # File parsing (Excel, CSV, DOCX)
│   │   ├── socialMediaService.js # Social media posting
│   │   └── scheduler.js         # Automated scheduling
│   └── middleware/
│       └── auth.js              # JWT authentication
├── client/                       # Frontend (to be implemented)
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update AI preference

### Posts
- `POST /api/posts/generate` - Generate AI content
- `POST /api/posts/:id/schedule` - Schedule a post
- `POST /api/posts/:id/publish` - Publish immediately
- `GET /api/posts` - Get user's posts
- `GET /api/posts/:id` - Get single post
- `DELETE /api/posts/:id` - Delete post

### Schedules
- `POST /api/schedules/today` - Schedule post for today
- `POST /api/schedules/weekly` - Create weekly schedule
- `POST /api/schedules/monthly` - Create monthly schedule
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/:id` - Get single schedule
- `PUT /api/schedules/:id/toggle` - Toggle schedule active status

### Social Accounts
- `GET /api/social/accounts` - Get connected accounts
- `POST /api/social/accounts` - Connect account
- `DELETE /api/social/accounts/:id` - Disconnect account
- `GET /api/social/auth/:platform` - Get OAuth URL

### Upload
- `POST /api/upload/file` - Upload file (Excel, CSV, DOCX)
- `GET /api/upload/template` - Download Excel template

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/upcoming` - Get upcoming posts

## 📝 Weekly Schedule File Format

### Excel/CSV Template

| Day       | Topic                  | Short Explanation                     | Platform           |
|-----------|------------------------|---------------------------------------|--------------------|
| Monday    | AI in Healthcare       | How AI improves diagnosis accuracy    | LinkedIn, Twitter  |
| Tuesday   | Startup Growth         | Tips for early-stage founders         | Twitter            |
| Wednesday | Digital Marketing      | Latest trends in social media         | LinkedIn, Facebook |

**Download template**: `GET /api/upload/template`

## 🔄 How It Works

### 1. Today (Single Post)
1. User provides topic and explanation
2. Selects platforms and AI model
3. System generates platform-specific content
4. Optionally generates image
5. Schedules for specific time
6. Scheduler automatically posts at scheduled time

### 2. Weekly (Bulk Planning)
1. User uploads Excel/CSV/DOCX file with weekly schedule
2. System parses file and extracts topics for each day
3. For each day, generates content for selected platforms
4. Creates scheduled posts for the week
5. Scheduler processes daily posts automatically

### 3. Monthly (Smart Automation)
1. User provides:
   - Industry
   - Target audience
   - Content goal (branding/leads/engagement)
2. AI generates 30 unique topics with explanations
3. System creates scheduled posts for the month
4. Scheduler processes daily posts automatically

## 🤖 AI Content Generation

### Platform-Specific Prompts

Each platform receives content optimized for its audience:

- **LinkedIn**: Professional, 150-300 words, industry insights
- **Facebook**: Conversational, 100-200 words, engaging
- **Twitter/X**: Concise, max 280 characters, punchy
- **Instagram**: Visual, 150-300 words, emoji-friendly

### Model Selection

Users can choose:
- **ChatGPT** (GPT-4) - Default
- **Gemini** (Gemini Pro)

## 🔐 Social Media Integration

### OAuth Flow

1. User clicks "Connect [Platform]"
2. System generates OAuth URL
3. User authorizes on platform
4. Callback receives access token
5. Token stored securely in database
6. Posts use stored tokens

### Supported Platforms

- ✅ LinkedIn
- ✅ Facebook
- ✅ X (Twitter)
- ✅ Instagram

## ⚙️ Configuration

### Environment Variables

See `.env.example` for all required variables:

- Database: `MONGODB_URI`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- AI: `OPENAI_API_KEY`, `GEMINI_API_KEY`
- Social Media: Platform-specific OAuth credentials
- Server: `PORT`, `NODE_ENV`, `FRONTEND_URL`

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 📊 Usage Tracking

The system tracks:
- Posts generated
- Images generated
- API calls made
- Subscription tier

## 🚧 Future Enhancements

- [ ] Frontend React application
- [ ] Content library management
- [ ] Media library for images
- [ ] Analytics and insights
- [ ] A/B testing for content
- [ ] Team collaboration features
- [ ] Content approval workflow
- [ ] Multi-language support

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for content creators and social media managers**

