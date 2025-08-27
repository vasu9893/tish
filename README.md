# InstantChat - Phase 1 MVP

A real-time chat application built with React, Node.js, and Socket.io. This is the MVP version for testing and validation.

## 🚀 Features

- **Real-time messaging** using Socket.io
- **User authentication** with JWT tokens
- **Responsive design** with Tailwind CSS
- **MongoDB integration** for message persistence
- **Modern React** with hooks and functional components
- **Clean architecture** ready for future expansions

## 📁 Project Structure

```
instantchat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Socket.io Client** - Real-time communication
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time WebSocket library
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd instantchat
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/instantchat
JWT_SECRET=your_super_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. Start the Application
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Status**: http://localhost:5000/

## 🔐 Authentication

For MVP testing, the application uses **dummy authentication**:
- Any username/password combination will work
- JWT tokens are generated but not strictly validated
- User data is stored in localStorage

**Production Notes**: 
- Implement proper password hashing
- Add JWT verification middleware
- Use secure session management

## 💬 Real-time Chat

### How it Works
1. User logs in and receives JWT token
2. Frontend connects to Socket.io server
3. Messages are sent via WebSocket events
4. Server broadcasts messages to all connected clients
5. Messages are stored in MongoDB for persistence

### Socket Events
- `sendMessage` - Client sends message to server
- `message` - Server broadcasts message to all clients
- `getMessageHistory` - Client requests message history
- `messageHistory` - Server sends message history

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String,      // Unique username
  email: String,         // Unique email
  password: String,      // Hashed password
  avatar: String,        // Profile picture URL
  isOnline: Boolean,     // Online status
  lastSeen: Date         // Last activity timestamp
}
```

### Message Model
```javascript
{
  sender: String,        // Username of sender
  content: String,       // Message content
  userId: String,        // User ID
  timestamp: Date,       // Message timestamp
  room: String,          // Chat room (default: 'general')
  messageType: String,   // Type of message
  isEdited: Boolean,     // Edit status
  editedAt: Date         // Edit timestamp
}
```

## 🔧 Development

### Available Scripts

**Backend (server/)**
```bash
npm run dev      # Start with nodemon (development)
npm start        # Start production server
```

**Frontend (client/)**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Structure
- **Components**: Reusable UI elements
- **Pages**: Main application views
- **Routes**: API endpoints and middleware
- **Models**: Database schemas and validation
- **Utils**: Helper functions and services

## 🚧 Future Enhancements (Phase 2+)

- **User Management**: Registration, profiles, avatars
- **Private Messaging**: Direct messages between users
- **Chat Rooms**: Multiple conversation channels
- **File Sharing**: Image and document uploads
- **Push Notifications**: Real-time alerts
- **Message Encryption**: End-to-end encryption
- **User Status**: Online/offline indicators
- **Message Reactions**: Emoji reactions and responses
- **Search**: Message and user search functionality
- **Mobile App**: React Native mobile application

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Verify your connection string in `.env`
- Check network access and IP whitelist
- Ensure database user has proper permissions

**Socket.io Connection Issues**
- Verify CORS settings in server configuration
- Check that frontend URL matches `CLIENT_URL` in `.env`
- Ensure both frontend and backend are running

**Build Errors**
- Clear `node_modules` and reinstall dependencies
- Check Node.js version compatibility
- Verify all environment variables are set

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=socket.io:* npm run dev  # Socket.io debugging
NODE_ENV=development npm run dev  # General debugging
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Message Endpoints
- `GET /api/messages` - Get all messages
- `GET /api/messages/:room` - Get messages by room
- `POST /api/messages` - Create new message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Chatting! 🎉**
