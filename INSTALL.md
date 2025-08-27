
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

## 🔐 Login Credentials

For MVP testing, **any username and password combination will work**:
- Username: `testuser`
- Password: `password123`

## 📱 Features to Test

1. **Login** - Use any username/password
2. **Real-time Chat** - Send messages and see them appear instantly
3. **Message History** - Messages are loaded when you connect
4. **Responsive Design** - Works on desktop and mobile
5. **Socket Connection** - Real-time updates across multiple browser tabs

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
- Check your connection string in `.env`
- Verify IP whitelist in MongoDB Atlas
- Check network connectivity

**Dependencies not found:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

After successful installation:
1. Test the basic chat functionality
2. Open multiple browser tabs to test real-time messaging
3. Check the browser console for any errors
4. Review the code structure for future enhancements

## 📚 Documentation

- **README.md** - Comprehensive project documentation
- **Code comments** - Inline documentation throughout the codebase
- **API endpoints** - RESTful API documentation in routes

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
