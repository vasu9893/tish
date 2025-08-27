# 🚀 **InstantChat Deployment Guide: Vercel + Netlify**

## 📋 **Overview**

This guide will help you deploy InstantChat to:
- **Backend**: Vercel (API + Webhooks)
- **Frontend**: Netlify (React App)
- **Database**: MongoDB Atlas (already configured)

## 🔧 **Step 1: Deploy Backend to Vercel**

### **1.1 Install Vercel CLI**
```bash
npm install -g vercel
```

### **1.2 Login to Vercel**
```bash
vercel login
```

### **1.3 Deploy Backend**
```bash
cd instantchat
vercel --prod
```

### **1.4 Configure Environment Variables in Vercel**

After deployment, go to your Vercel dashboard and set these environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://krish:krish123@cluster0.cjpqzax.mongodb.net/instantchat?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
CLIENT_URL=https://your-app-name.netlify.app
META_APP_ID=3985570981773309
META_APP_SECRET=fdc9777a12e89faf55dc61eba1a71904
META_VERIFY_TOKEN=instantchat_webhook_2024_secure_token
META_GRAPH_URL=https://graph.facebook.com/v19.0
```

### **1.5 Get Your Vercel URL**
After deployment, you'll get a URL like:
`https://instantchat-backend.vercel.app`

## 🌐 **Step 2: Deploy Frontend to Netlify**

### **2.1 Build Frontend**
```bash
cd instantchat/client
npm run build
```

### **2.2 Deploy to Netlify**
1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/Login**
3. **Drag & drop** your `dist` folder
4. **Or connect** your GitHub repository

### **2.3 Configure Environment Variables**
In Netlify dashboard, set:
```env
VITE_API_URL=https://your-vercel-backend.vercel.app
```

### **2.4 Get Your Netlify URL**
You'll get a URL like:
`https://instantchat-frontend.netlify.app`

## 🔗 **Step 3: Update Meta App Webhook**

### **3.1 Update Webhook URL**
In your Meta app dashboard:
- **Webhook URL**: `https://your-vercel-backend.vercel.app/webhook/instagram`
- **Verify Token**: `instantchat_webhook_2024_secure_token`

### **3.2 Update Client URL**
In your Vercel environment variables:
- **CLIENT_URL**: `https://your-netlify-app.netlify.app`

## 📱 **Step 4: Test Deployment**

### **4.1 Test Backend API**
```bash
curl https://your-vercel-backend.vercel.app/
```

### **4.2 Test Webhook Endpoint**
```bash
curl https://your-vercel-backend.vercel.app/webhook/test
```

### **4.3 Test Instagram Connection**
1. **Visit** your Netlify app
2. **Login** to InstantChat
3. **Go to** "Connect Instagram"
4. **Test** OAuth flow

## 🎯 **Expected URLs After Deployment**

### **Backend (Vercel)**
- **API Base**: `https://instantchat-backend.vercel.app`
- **Webhook**: `https://instantchat-backend.vercel.app/webhook/instagram`
- **API Routes**: `https://instantchat-backend.vercel.app/api/*`

### **Frontend (Netlify)**
- **App URL**: `https://instantchat-frontend.netlify.app`
- **Login**: `https://instantchat-frontend.netlify.app/login`
- **Dashboard**: `https://instantchat-frontend.netlify.app/dashboard`

## 🔒 **Security Considerations**

### **Environment Variables**
- ✅ **Never commit** `.env` files to Git
- ✅ **Use Vercel/Netlify** environment variable settings
- ✅ **Rotate secrets** regularly in production

### **CORS Configuration**
- ✅ **Backend** allows your Netlify domain
- ✅ **Frontend** calls your Vercel API
- ✅ **Webhooks** accessible from Meta servers

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. CORS Errors**
- Check `CLIENT_URL` in Vercel environment variables
- Ensure frontend URL matches exactly

#### **2. Webhook Validation Fails**
- Verify webhook URL is accessible
- Check verify token matches exactly
- Ensure HTTPS is used

#### **3. Database Connection Fails**
- Verify MongoDB URI in Vercel environment
- Check MongoDB Atlas network access

#### **4. Instagram OAuth Fails**
- Verify redirect URI in Meta app
- Check app permissions and scopes

### **Debug Commands**
```bash
# Test backend locally
curl http://localhost:5000/

# Test webhook locally
curl http://localhost:5000/webhook/test

# Check Vercel deployment
vercel ls

# Check Netlify deployment
netlify status
```

## 🎉 **Success Indicators**

### **Backend Working**
- ✅ Vercel deployment successful
- ✅ API endpoints responding
- ✅ Webhook endpoint accessible
- ✅ Database connection working

### **Frontend Working**
- ✅ Netlify deployment successful
- ✅ App loads without errors
- ✅ Can login and access dashboard
- ✅ Instagram connection page accessible

### **Instagram Integration Working**
- ✅ Webhook verified in Meta app
- ✅ OAuth flow completes successfully
- ✅ Can connect Instagram account
- ✅ Webhook receives messages

## 📚 **Next Steps After Deployment**

1. **Test complete user flow**
2. **Monitor webhook delivery**
3. **Test Instagram message sending**
4. **Set up monitoring and logging**
5. **Plan Phase 3 features**

---

## 🎯 **Quick Deployment Checklist**

- [ ] **Backend deployed** to Vercel
- [ ] **Environment variables** set in Vercel
- [ ] **Frontend built** and deployed to Netlify
- [ ] **Webhook URL updated** in Meta app
- [ ] **Client URL updated** in Vercel
- [ ] **All endpoints tested** and working
- [ ] **Instagram connection** tested successfully

---

**🚀 Ready to deploy? Let's get InstantChat running in production!**
