# SkillSwap Backend API

A comprehensive backend API for the SkillSwap platform built with Express.js, MongoDB, and Node.js.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth integration
  - Role-based access control (Student, Instructor, Admin)
  - Password hashing with bcrypt

- **User Management**
  - User registration and login
  - Profile management
  - User following system
  - Public/private profiles

- **Course Management**
  - Create, read, update, delete courses
  - Course enrollment system
  - Course reviews and ratings
  - Course publishing workflow
  - Curriculum management

- **Skill Management**
  - Personal skill tracking
  - Skill progress monitoring
  - Milestone system
  - Skill teaching capabilities
  - Resource management

- **Marketplace**
  - Course and skill browsing
  - Advanced filtering and search
  - Category management
  - Trending content
  - Statistics and analytics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer + Cloudinary

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillswap/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/skillswap
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB locally
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/skills` - Get user's skills
- `GET /api/users/:id/courses` - Get user's courses
- `POST /api/users/:id/follow` - Follow/unfollow user
- `DELETE /api/users/:id` - Delete user account

### Courses
- `GET /api/courses` - Get all courses (with filtering)
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course (Instructor)
- `PUT /api/courses/:id` - Update course (Instructor)
- `PATCH /api/courses/:id/publish` - Publish course
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:id/reviews` - Add course review
- `DELETE /api/courses/:id` - Delete course

### Skills
- `GET /api/skills` - Get all skills (with filtering)
- `GET /api/skills/:id` - Get skill by ID
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:id` - Update skill
- `PATCH /api/skills/:id/progress` - Update skill progress
- `POST /api/skills/:id/milestones` - Add milestone
- `POST /api/skills/:id/notes` - Add note
- `POST /api/skills/:id/enroll` - Enroll in skill
- `DELETE /api/skills/:id` - Delete skill

### Marketplace
- `GET /api/marketplace` - Get marketplace data
- `GET /api/marketplace/featured` - Get featured content
- `GET /api/marketplace/categories` - Get categories with counts
- `GET /api/marketplace/search/suggestions` - Get search suggestions
- `GET /api/marketplace/stats` - Get marketplace statistics
- `GET /api/marketplace/trending` - Get trending content

## Database Models

### User
- Basic profile information
- Authentication data
- Skills and courses
- Preferences and settings
- Social features (following/followers)

### Course
- Course details and metadata
- Instructor information
- Curriculum and content
- Enrollment and reviews
- Analytics and statistics

### Skill
- Skill information and progress
- Teaching capabilities
- Resources and milestones
- Reviews and ratings
- Analytics

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Comprehensive validation
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **XSS Protection**: Input sanitization

## Error Handling

- Centralized error handling middleware
- Detailed error messages
- HTTP status codes
- Development vs production error details

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Code Structure
```
backend/
├── config/          # Configuration files
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── server.js        # Main server file
└── package.json     # Dependencies
```

## Deployment

### Environment Variables
Make sure to set all required environment variables in production:

- `NODE_ENV=production`
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Strong secret for JWT
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `FRONTEND_URL` - Frontend application URL

### Database
- Use MongoDB Atlas for production
- Set up proper indexes for performance
- Configure backup and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
