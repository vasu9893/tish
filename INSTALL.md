
# 🚀 InstantChat Quick Installation Guide

## Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account (or local MongoDB)
- Git (optional)

## ⚡ Quick Start (Windows)

### Option 1: Using the provided scripts
1. **Double-click** `start.bat` or run `start.ps1` in PowerShell
2. The script will automatically:
   - Install dependencies for both client and server
   - Start the backend server on port 5000
   - Start the frontend server on port 3000

### Option 2: Manual installation
```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Install frontend dependencies
cd ../client
npm install

# 3. Start backend (Terminal 1)
cd server
npm run dev

# 4. Start frontend (Terminal 2)
cd client
npm run dev
```

## 🔧 Environment Setup

1. **Copy the environment template:**
   ```bash
   copy env.example .env
   ```

2. **Edit `.env` with your MongoDB credentials:**
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/instantchat
   JWT_SECRET=your_super_secret_key_here
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Status**: http://localhost:5000/

## 🔐 Authentication System

InstantChat now uses **real JWT authentication** with secure user management:

### **User Registration & Login**
- **Secure registration** with username, email, and password
- **Password hashing** using bcrypt
- **JWT token generation** for authenticated sessions
- **Token verification** on all protected endpoints

### **Security Features**
- **Password validation** (minimum 6 characters)
- **Email uniqueness** checking
- **Username uniqueness** checking
- **JWT expiration** (24 hours)
- **Secure middleware** for protected routes

### **Getting Started**
1. **Create an account** using the signup form
2. **Login** with your credentials
3. **Receive JWT token** for API access
4. **Connect Instagram** using your authenticated session

## 📱 Features to Test

1. **User Registration** - Create secure accounts
2. **User Login** - Authenticate with JWT tokens
3. **Instagram Integration** - Connect with real authentication
4. **Real-time Chat** - Send messages with user context
5. **Message History** - Load conversations for authenticated users
6. **Responsive Design** - Works on desktop and mobile

## 🐛 Troubleshooting

### Common Issues:

**Port already in use:**
```bash
# Kill processes on ports 3000 and 5000
netstat -ano | findstr :3000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**MongoDB connection failed:**
- Check your MongoDB Atlas connection string
- Verify IP whitelist includes your IP address
- Ensure database user has proper permissions

**Authentication errors:**
- Verify JWT_SECRET is set in environment
- Check MongoDB connection for user data
- Ensure proper token format in Authorization header

**Instagram connection issues:**
- Use the Instagram Connection Fix Tool
- Verify user authentication before connecting
- Check Instagram app permissions and webhook setup

## 🔒 Security Notes

- **JWT_SECRET** should be a strong, unique key
- **MongoDB** should use SSL connections in production
- **Environment variables** should never be committed to version control
- **User passwords** are automatically hashed and never stored in plain text
