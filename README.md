# InstaMini - Mini Instagram-Style Social Media App

A full-stack social media application built with Flask (Python) backend and React frontend, designed as a portfolio project for engineering recruitment drives and placement interviews.

![InstaMini](https://via.placeholder.com/800x400?text=InstaMini+Screenshot)

## 🎯 Project Overview

InstaMini is a simplified Instagram-style social media platform that demonstrates core web development concepts including:
- JWT-based authentication
- Many-to-many database relationships (follows, likes)
- RESTful API design
- Real-time UI updates
- Pagination
- Protected routes
- Responsive design

## ✨ Features

### Authentication
- User signup with email and username validation
- Secure login with JWT token-based authentication
- Password hashing using Werkzeug
- Protected routes with automatic token validation
- Client-side logout functionality

### Social Features
- **Follow System**: Follow/unfollow users with many-to-many relationship
- **Posts**: Create and delete posts with image URLs and captions
- **Likes**: Like/unlike posts with toggle functionality
- **Comments**: Add comments to posts with real-time updates
- **Feed**: Personalized feed showing posts from followed users and own posts
- **Profile**: View user profiles with posts grid, followers, and following counts
- **Profile Pictures**: Update profile picture via image URL or file upload from local computer, displayed across posts and comments with fallback avatars

### User Experience
- Clean, modern, responsive UI with Tailwind CSS
- Mobile-first design approach
- Real-time UI updates without page reloads
- Pagination for feed and user posts
- Error handling with toast notifications
- Loading states and optimistic UI updates

## 🛠️ Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database (easily switchable to PostgreSQL)
- **Flask-JWT-Extended** - JWT token management
- **Flask-CORS** - Cross-origin resource sharing
- **Werkzeug** - Password hashing utilities

### Frontend
- **React 18** - UI library with functional components and hooks
- **Vite** - Modern build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Toast notifications
- **JWT Decode** - Token decoding utility

## 📁 Project Structure

```
Instagram-Mini-Clone-
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── config.py              # Configuration settings
│   ├── models.py              # Database models (User, Post, Comment, etc.)
│   ├── extensions.py          # Flask extensions initialization
│   └── routes/
│       ├── __init__.py        # Blueprint registration
│       ├── auth.py            # Authentication routes
│       ├── users.py           # User profile and follow routes
│       └── posts.py           # Post, like, comment, and feed routes
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   └── CommentList.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── PostDetail.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── services/
│   │   │   └── api.js         # API service layer
│   │   ├── App.jsx            # Main app component with routing
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── requirements.txt           # Python dependencies
├── env.example               # Environment variables template
├── .gitignore
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r ../requirements.txt
   ```

5. **Set up environment variables:**
   - Copy `env.example` to `.env` in the root directory
   - Update `JWT_SECRET_KEY` with a secure random string

6. **Run the Flask server:**
   
   Option 1: Run from backend directory:
   ```bash
   python app.py
   ```
   
   Option 2: Run from root directory:
   ```bash
   cd ..
   python run_backend.py
   ```
   
   Or using Python module syntax:
   ```bash
   python -m backend.app
   ```
   
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Database Initialization

The database is automatically created when you first run the Flask app. The SQLite database file (`instamini.db`) will be created in the backend directory.

## 📸 Screenshots

### Login Page
![Login](https://via.placeholder.com/600x400?text=Login+Page)

### Feed
![Feed](https://via.placeholder.com/600x400?text=Feed+Page)

### Profile
![Profile](https://via.placeholder.com/600x400?text=Profile+Page)

### Create Post
![Create Post](https://via.placeholder.com/600x400?text=Create+Post+Page)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile-image` - Update user's profile picture via URL (protected)
- `POST /api/users/profile-image/upload` - Upload profile picture from local file (protected)
- `POST /api/users/follow/:user_id` - Follow a user
- `DELETE /api/users/unfollow/:user_id` - Unfollow a user
- `GET /api/users/:user_id/followers` - Get user's followers
- `GET /api/users/:user_id/following` - Get users that a user follows

### Posts
- `POST /api/posts` - Create a new post (protected)
- `GET /api/posts/:post_id` - Get post details
- `DELETE /api/posts/:post_id` - Delete a post (protected, owner only)
- `GET /api/posts/user/:user_id` - Get user's posts (paginated)
- `GET /api/posts/feed` - Get personalized feed (protected, paginated)

### Likes
- `POST /api/posts/:post_id/like` - Like a post (protected)
- `DELETE /api/posts/:post_id/like` - Unlike a post (protected)

### Comments
- `POST /api/posts/:post_id/comments` - Add a comment (protected)
- `GET /api/posts/:post_id/comments` - Get post comments

## 🎤 Interview Talking Points

### Architecture & Design Decisions

1. **Modular Backend Structure**
   - Used Flask blueprints to organize routes into logical modules (auth, users, posts)
   - Separated concerns: models, routes, configuration, and extensions
   - Application factory pattern for easy testing and configuration management

2. **JWT Authentication**
   - Implemented stateless authentication using JWT tokens
   - Tokens stored in localStorage on client side
   - Automatic token attachment via Axios interceptors
   - Token expiration handling with automatic logout

3. **Database Relationships**
   - **Many-to-Many for Follows**: Used association table to allow users to follow multiple users and be followed by multiple users
   - **Many-to-Many for Likes**: Efficient relationship between users and posts
   - **One-to-Many for Posts**: Each user can have multiple posts
   - **One-to-Many for Comments**: Each post can have multiple comments
   - Used `ondelete='CASCADE'` for data integrity

4. **Pagination**
   - Implemented server-side pagination for feed and user posts
   - Prevents loading too much data at once
   - Improves performance and user experience
   - Query parameters: `page` and `limit`

5. **Error Handling**
   - Consistent error responses from backend
   - Frontend error handling with user-friendly toast notifications
   - Axios interceptors for global error handling (401 redirects to login)

6. **State Management**
   - Used React Context API for authentication state (simpler than Redux for this scale)
   - Local state for component-specific data
   - Optimistic UI updates for better UX (likes, comments)

7. **Security Considerations**
   - Password hashing with Werkzeug (bcrypt-based)
   - JWT tokens for stateless authentication
   - Protected routes on both frontend and backend
   - Input validation on both client and server side
   - SQL injection prevention via SQLAlchemy ORM

8. **Performance Optimizations**
   - Database indexing on frequently queried fields (username, email, created_at)
   - Pagination to limit data transfer
   - Image lazy loading (can be added)
   - Efficient queries using SQLAlchemy relationships

9. **Code Quality**
   - Well-commented code explaining key decisions
   - Consistent naming conventions
   - Separation of concerns (API layer, components, pages)
   - Reusable components (PostCard, CommentList)

10. **Scalability Considerations**
    - Easy to switch from SQLite to PostgreSQL
    - Blueprint structure allows easy addition of new features
    - Modular frontend components for easy extension
    - Environment variables for configuration

### How to Explain in Interview

**Opening:**
"I built InstaMini as a full-stack social media application to demonstrate my understanding of modern web development. It's a simplified Instagram clone with core features like authentication, posts, likes, comments, and a follow system."

**Backend Explanation:**
"I used Flask for the backend because it's lightweight and perfect for RESTful APIs. I organized the code using blueprints for modularity - separate modules for authentication, user management, and posts. For authentication, I implemented JWT tokens which are stateless and scalable. The database uses SQLAlchemy ORM with SQLite, and I designed the relationships carefully - many-to-many for follows and likes, one-to-many for posts and comments. I also implemented pagination to handle large datasets efficiently."

**Frontend Explanation:**
"On the frontend, I used React with Vite for fast development. I chose the Context API for state management since it's simpler than Redux for this scale. I created reusable components like PostCard and CommentList, and used React Router for client-side routing with protected routes. The UI is built with Tailwind CSS for a modern, responsive design."

**Key Highlights:**
"I'm particularly proud of the follow system implementation - it uses a many-to-many relationship with proper constraints to prevent duplicate follows and self-follows. The feed is personalized, showing only posts from users you follow plus your own posts, with pagination. I also implemented optimistic UI updates for likes and comments to make the app feel more responsive."

**Challenges & Solutions:**
"One challenge was managing authentication state across the app - I solved this with a Context API provider that handles token storage and automatic token attachment to API requests. Another challenge was ensuring data consistency - I used database constraints and proper error handling to prevent issues like duplicate likes or follows."

## 🔮 Future Enhancements

- Image upload functionality (currently uses URLs)
- Real-time notifications using WebSockets
- Search functionality for users and posts
- Edit posts and comments
- Direct messaging between users
- Stories feature
- Hashtags and mentions
- Dark mode toggle
- Unit and integration tests

## 📝 License

This project is created for educational and portfolio purposes.

## 👤 Author

Built for engineering recruitment drives and placement interviews.

---

**Note:** This is an original implementation built from scratch. All code is production-quality, well-commented, and designed to demonstrate strong understanding of full-stack development principles.
