# 🚀 InstantChat Deployment Guide

**Complete deployment guide for the InstantChat Instagram automation platform.**

## 📋 Prerequisites

### **Required Accounts**
- [GitHub](https://github.com) - Source code repository
- [MongoDB Atlas](https://mongodb.com/atlas) - Database hosting
- [Meta Developer Console](https://developers.facebook.com) - Instagram API access

### **Deployment Platforms**
- **Frontend**: Netlify (recommended) or Vercel
- **Backend**: Railway (recommended) or Heroku
- **Database**: MongoDB Atlas (cloud)

### **Domain & SSL**
- Custom domain (optional but recommended)
- SSL certificate (automatic with deployment platforms)

## 🗄️ Database Setup (MongoDB Atlas)

### **1. Create MongoDB Atlas Cluster**
1. Sign up at [MongoDB Atlas](https://mongodb.com/atlas)
2. Create new project: `InstantChat`
3. Build new cluster:
   - **Provider**: AWS, Google Cloud, or Azure
   - **Region**: Choose closest to your users
   - **Cluster Tier**: M0 (free) for development, M10+ for production
   - **Cluster Name**: `instantchat-cluster`

### **2. Configure Database Access**
1. **Security** → **Database Access**
2. **Add New Database User**:
   - **Username**: `instantchat_user`
   - **Password**: Generate secure password
   - **Database User Privileges**: `Read and write to any database`
   - **Built-in Role**: `Atlas admin`

### **3. Configure Network Access**
1. **Security** → **Network Access**
2. **Add IP Address**:
   - **Development**: Your local IP
   - **Production**: `0.0.0.0/0` (allows all IPs)
   - **Comment**: `InstantChat deployment access`

### **4. Get Connection String**
1. **Clusters** → **Connect**
2. **Connect your application**
3. **Copy connection string**:
   ```
   mongodb+srv://instantchat_user:<password>@cluster0.xxxxx.mongodb.net/instantchat?retryWrites=true&w=majority
   ```

## 📱 Instagram API Setup (Meta Developer)

### **1. Create Meta App**
1. Go to [Meta Developer Console](https://developers.facebook.com)
2. **Create App** → **Consumer** → **Next**
3. **App Name**: `InstantChat`
4. **App Contact Email**: Your email
5. **Business Account**: Select or create

### **2. Add Instagram Basic Display**
1. **Add Product** → **Instagram Basic Display**
2. **Basic Display** → **Create New App**
3. **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:5000/api/instagram/auth/instagram/callback`
   - Production: `https://your-domain.com/api/instagram/auth/instagram/callback`

### **3. Configure App Settings**
1. **App Settings** → **Basic**:
   - **App Domains**: `your-domain.com`
   - **Privacy Policy URL**: `https://your-domain.com/privacy`
   - **Terms of Service URL**: `https://your-domain.com/terms`

2. **Instagram Basic Display** → **Basic Display**:
   - **Client OAuth Settings**:
     - **Valid OAuth Redirect URIs**: Add production URL
     - **Deauthorize Callback URL**: `https://your-domain.com/api/instagram/deauthorize`
     - **Data Deletion Request URL**: `https://your-domain.com/api/instagram/data-deletion`

### **4. Get App Credentials**
1. **App Settings** → **Basic**:
   - **App ID**: Copy this
   - **App Secret**: Copy this
2. **Instagram Basic Display** → **Basic Display**:
   - **Instagram App ID**: Copy this

### **5. Set Webhook**
1. **Instagram Basic Display** → **Basic Display** → **Webhooks**
2. **Add Callback URL**: `https://your-domain.com/api/webhook/instagram`
3. **Verify Token**: Generate secure token (e.g., `instantchat_webhook_2024_secure_token`)
4. **Fields**: Subscribe to `messages` and `messaging_postbacks`

## 🚀 Backend Deployment (Railway)

### **1. Prepare Backend Code**
1. **Environment Variables** - Create `.env` file:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=production
   
   # Database
   MONGO_URI=mongodb+srv://instantchat_user:<password>@cluster0.xxxxx.mongodb.net/instantchat?retryWrites=true&w=majority
   
   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   
   # Meta/Instagram
   META_APP_ID=your_meta_app_id
   META_APP_SECRET=your_meta_app_secret
   META_VERIFY_TOKEN=instantchat_webhook_2024_secure_token
   META_GRAPH_URL=https://graph.facebook.com/v18.0
   
   # Client Configuration
   CLIENT_URL=https://your-domain.com
   
   # Optional: Analytics
   SENTRY_DSN=your_sentry_dsn_if_using
   ```

2. **Update package.json** - Ensure scripts are correct:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js",
       "build": "echo 'No build step required for Node.js'"
     }
   }
   ```

### **2. Deploy to Railway**
1. **Connect GitHub**:
   - Go to [Railway](https://railway.app)
   - **New Project** → **Deploy from GitHub repo**
   - Select your `instantchat` repository
   - **Deploy Now**

2. **Configure Environment**:
   - **Variables** tab → Add all environment variables from `.env`
   - **Settings** tab → **Name**: `instantchat-backend`

3. **Deploy Settings**:
   - **Root Directory**: `server`
   - **Build Command**: Leave empty (no build step)
   - **Start Command**: `npm start`

4. **Get Domain**:
   - Railway will generate a domain like `instantchat-backend-production.up.railway.app`
   - Copy this for your frontend configuration

### **3. Verify Backend Deployment**
```bash
# Test health endpoint
curl https://instantchat-backend-production.up.railway.app/

# Test Instagram webhook verification
curl "https://instantchat-backend-production.up.railway.app/api/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=instantchat_webhook_2024_secure_token"
```

## 🌐 Frontend Deployment (Netlify)

### **1. Prepare Frontend Code**
1. **Update API Configuration** - Modify `client/src/utils/api.js`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://instantchat-backend-production.up.railway.app'
   ```

2. **Environment Variables** - Create `client/.env.production`:
   ```env
   VITE_API_URL=https://instantchat-backend-production.up.railway.app
   ```

3. **Build Configuration** - Ensure `client/vite.config.js`:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: 'dist',
       sourcemap: false
     }
   })
   ```

### **2. Deploy to Netlify**
1. **Connect GitHub**:
   - Go to [Netlify](https://netlify.com)
   - **New site from Git** → **GitHub**
   - Select your `instantchat` repository

2. **Build Settings**:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (or your project version)

3. **Environment Variables**:
   - **Site settings** → **Environment variables**
   - Add: `VITE_API_URL` = `https://instantchat-backend-production.up.railway.app`

4. **Deploy**:
   - **Deploy site**
   - Netlify will build and deploy automatically

### **3. Custom Domain (Optional)**
1. **Domain management** → **Add custom domain**
2. **Domain**: `your-domain.com`
3. **SSL/TLS**: Netlify will provision automatically

## 🔧 Production Configuration

### **1. Update Meta App Settings**
1. **App Domains**: Add your production domain
2. **Valid OAuth Redirect URIs**: Update with production URL
3. **Webhook URL**: Update with production webhook endpoint

### **2. Update Environment Variables**
1. **Railway Backend**:
   ```env
   CLIENT_URL=https://your-domain.com
   NODE_ENV=production
   ```

2. **Netlify Frontend**:
   ```env
   VITE_API_URL=https://instantchat-backend-production.up.railway.app
   ```

### **3. SSL & Security**
1. **HTTPS**: Both platforms provide automatic SSL
2. **Security Headers**: Add to Netlify `_headers` file:
   ```
   /*
     X-Frame-Options: DENY
     X-XSS-Protection: 1; mode=block
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
   ```

## 🧪 Testing Deployment

### **1. Backend Health Check**
```bash
# Test main endpoint
curl https://instantchat-backend-production.up.railway.app/

# Test API status
curl https://instantchat-backend-production.up.railway.app/api/status

# Test database connection
curl https://instantchat-backend-production.up.railway.app/api/health
```

### **2. Frontend Functionality**
1. **Open your domain** in browser
2. **Test user registration/login**
3. **Test Instagram connection**
4. **Test flow builder**
5. **Test message sending**

### **3. Instagram Integration Test**
1. **Connect Instagram account** via OAuth
2. **Send test message** from Instagram
3. **Verify webhook reception**
4. **Test automated responses**

## 📊 Monitoring & Maintenance

### **1. Railway Backend Monitoring**
- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and response times
- **Deployments**: Track deployment history and rollbacks

### **2. Netlify Frontend Monitoring**
- **Build logs**: Monitor build success/failures
- **Deploy previews**: Test changes before production
- **Form submissions**: Monitor contact forms (if any)

### **3. MongoDB Atlas Monitoring**
- **Performance**: Monitor query performance
- **Storage**: Track database growth
- **Connections**: Monitor connection pool usage

### **4. Health Check Script**
Create `healthcheck.js` for automated monitoring:
```javascript
const axios = require('axios')

async function healthCheck() {
  try {
    // Backend health
    const backendHealth = await axios.get('https://instantchat-backend-production.up.railway.app/')
    console.log('✅ Backend:', backendHealth.status)
    
    // Frontend accessibility
    const frontendHealth = await axios.get('https://your-domain.com')
    console.log('✅ Frontend:', frontendHealth.status)
    
    // Database connection
    const dbHealth = await axios.get('https://instantchat-backend-production.up.railway.app/api/health')
    console.log('✅ Database:', dbHealth.status)
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    process.exit(1)
  }
}

healthCheck()
```

## 🚨 Troubleshooting

### **Common Issues**

**1. Backend Won't Start**
```bash
# Check logs in Railway dashboard
# Verify environment variables
# Check MongoDB connection string
```

**2. Frontend Build Fails**
```bash
# Check Node.js version compatibility
# Verify all dependencies are installed
# Check for TypeScript/ESLint errors
```

**3. Instagram Connection Fails**
```bash
# Verify Meta app settings
# Check redirect URIs match exactly
# Ensure webhook verification token matches
```

**4. Database Connection Issues**
```bash
# Verify MongoDB Atlas IP whitelist
# Check connection string format
# Ensure database user has correct permissions
```

### **Debug Commands**
```bash
# Check backend logs
railway logs

# Check frontend build
cd client && npm run build

# Test API endpoints
curl -v https://your-backend-url.com/api/health

# Verify environment variables
railway variables
```

## 🔄 Continuous Deployment

### **1. Automatic Deployments**
- **Railway**: Auto-deploys on `main` branch push
- **Netlify**: Auto-deploys on `main` branch push
- **Database**: No automatic changes (manual migrations)

### **2. Deployment Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Railway CLI deployment commands
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        run: |
          # Netlify CLI deployment commands
```

## 📈 Scaling Considerations

### **1. Backend Scaling**
- **Railway**: Auto-scales based on traffic
- **Database**: MongoDB Atlas M10+ for production
- **CDN**: Consider Cloudflare for global distribution

### **2. Frontend Scaling**
- **Netlify**: Automatic global CDN
- **Image Optimization**: Automatic image compression
- **Caching**: Aggressive caching for static assets

### **3. Database Scaling**
- **Read Replicas**: For high-read workloads
- **Sharding**: For very large datasets
- **Backup Strategy**: Point-in-time recovery

## 🔒 Security Checklist

- [ ] **HTTPS**: All endpoints use SSL/TLS
- [ ] **Environment Variables**: No secrets in code
- [ ] **CORS**: Proper cross-origin configuration
- [ ] **Rate Limiting**: API abuse protection
- [ ] **Input Validation**: Sanitize all user inputs
- [ ] **JWT Security**: Secure token handling
- [ ] **Database Security**: IP whitelisting enabled
- [ ] **Webhook Security**: Verification token validation

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Meta Developer Documentation](https://developers.facebook.com/docs)

---

**For deployment support, contact: devops@instantchat.com**
