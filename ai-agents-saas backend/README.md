# AI Agents SaaS Backend

Complete backend solution for the AI Agents SaaS platform built with Node.js, Express.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables:**
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. **Start MongoDB** (if running locally):
\`\`\`bash
mongod
\`\`\`

4. **Seed admin user:**
\`\`\`bash
npm run seed
\`\`\`

5. **Start the server:**
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/usage-stats` - Get usage statistics
- `POST /api/users/change-password` - Change password

### AI Tools
- `GET /api/ai-tools` - Get available tools
- `POST /api/ai-tools/:toolId/generate` - Generate content
- `GET /api/ai-tools/usage-history` - Get usage history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - Platform analytics

## 🔧 Configuration

### Environment Variables
\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-agents-saas
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
\`\`\`

### Default Admin Credentials
- **Email:** admin@aiagents.com
- **Password:** Admin123!@#

## 🛡️ Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers

## 📊 Database Models

### User Model
- Personal information
- Subscription details
- Usage tracking
- Role-based access

### AI Tool Usage Model
- Usage logging
- Performance metrics
- Cost tracking

### Subscription Model
- Plan management
- Billing information
- Trial tracking

## 🔄 Subscription Plans

1. **Free Trial** (7 days)
   - 2 tools: SEO Audit + Social Media Generator
   - Limited generations

2. **Starter** ($29/month)
   - 5 tools access
   - 30 generations/month

3. **Pro** ($69/month)
   - All 13 tools
   - 100 generations/month

4. **Agency** ($149/month)
   - Unlimited usage
   - White-label features

## 🚀 Deployment

### Using PM2
\`\`\`bash
npm install -g pm2
pm2 start server.js --name "ai-agents-api"
\`\`\`

### Using Docker
\`\`\`bash
docker build -t ai-agents-backend .
docker run -p 5000:5000 ai-agents-backend
\`\`\`

## 📝 API Usage Examples

### Register User
\`\`\`javascript
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "company": "My Company"
}
\`\`\`

### Use AI Tool
\`\`\`javascript
POST /api/ai-tools/social-media/generate
Authorization: Bearer <token>
{
  "input": {
    "contentGoals": "lead generation",
    "brandVoice": "professional",
    "postFrequency": "daily"
  }
}
\`\`\`

## 🔍 Monitoring

- Health check: `GET /api/health`
- Usage analytics in admin panel
- Error logging and monitoring

## 📞 Support

For technical support or questions about the backend implementation, please refer to the API documentation or contact the development team.
