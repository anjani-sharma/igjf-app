# 🌍 Global Deployment Guide - 100 Users Testing

## Overview
Deploy your IGJF app for **100 users globally** with **24/7 availability** (laptop off). Total cost: **$0-10/month**.

## 🚀 Quick Deployment (30 minutes)

### Step 1: Deploy Backend (Railway - Free)

1. **Create Railway Account**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   
   # Initialize Railway project
   railway init
   
   # Deploy backend
   railway up
   
   # Add PostgreSQL database
   railway add postgresql
   ```

3. **Set Environment Variables** in Railway Dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   CORS_ORIGIN=https://your-app-name.vercel.app
   PORT=3000
   ```

4. **Get your Railway URL**: `https://your-project-name.railway.app`

### Step 2: Deploy Frontend (Vercel - Free)

1. **Update API URL**:
   ```bash
   cd mobile-app
   
   # Edit vercel.json - replace with your Railway URL
   # "EXPO_PUBLIC_API_URL": "https://your-project-name.railway.app/api"
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   
   # Follow prompts:
   # - Project name: igjf-app
   # - Framework: Other
   # - Build command: npm run build:web
   # - Output directory: dist
   ```

3. **Get your Vercel URL**: `https://igjf-app.vercel.app`

### Step 3: Update CORS Settings

Update Railway environment variables:
```
CORS_ORIGIN=https://igjf-app.vercel.app
```

## 📊 Capacity & Performance

### Free Tier Limits (Perfect for 100 users):
- **Railway**: 500 hours/month, 1GB RAM, 1GB storage
- **Vercel**: 100GB bandwidth/month, unlimited requests
- **PostgreSQL**: 1GB database storage

### Expected Performance:
- **Response Time**: <500ms globally
- **Uptime**: 99.9%
- **Concurrent Users**: 50-100 users
- **Data Transfer**: 10GB/month (well within limits)

## 🔧 Production Configuration

### Backend Environment Variables (Railway):
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-key-here
CORS_ORIGIN=https://igjf-app.vercel.app
DATABASE_URL=postgresql://... (auto-provided by Railway)

# Optional: Email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Environment Variables (Vercel):
```env
EXPO_PUBLIC_API_URL=https://your-project-name.railway.app/api
```

## 📱 Mobile App Distribution

### For 100 Users Testing:

1. **Web App** (Primary):
   - Share: `https://igjf-app.vercel.app`
   - Works on all devices with browsers
   - No installation required

2. **Android APK** (Secondary):
   ```bash
   # Build APK
   cd mobile-app
   npx expo build:android
   
   # Share APK file via:
   # - Google Drive
   # - Dropbox
   # - Direct download link
   ```

3. **iOS TestFlight** (Optional):
   ```bash
   # Requires Apple Developer Account ($99/year)
   eas build --platform ios --profile preview
   eas submit --platform ios --latest
   ```

## 📈 Analytics & Monitoring (Free)

### 1. Google Analytics (Web):
```bash
cd mobile-app
npm install @react-native-google-analytics/google-analytics
```

### 2. Railway Metrics:
- CPU/Memory usage
- Request count
- Response times
- Error rates

### 3. Vercel Analytics:
- Page views
- User sessions
- Performance metrics
- Geographic distribution

## 🔒 Security for 100 Users

### 1. Rate Limiting (Already configured):
```javascript
// 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

### 2. CORS Protection:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### 3. JWT Authentication:
- Secure token-based auth
- 24-hour token expiry
- Refresh token mechanism

## 💰 Cost Breakdown

### Free Tier (0-100 users):
- **Railway**: $0/month
- **Vercel**: $0/month
- **PostgreSQL**: $0/month
- **Total**: **$0/month**

### If You Exceed Free Limits:
- **Railway Pro**: $5/month (500 hours → unlimited)
- **Vercel Pro**: $20/month (100GB → 1TB bandwidth)
- **Total**: **$5-25/month**

## 🚀 Deployment Commands

### Quick Deploy Script:
```bash
#!/bin/bash
echo "🚀 Deploying IGJF App..."

# Deploy Backend
cd backend
railway up
echo "✅ Backend deployed"

# Deploy Frontend
cd ../mobile-app
vercel --prod
echo "✅ Frontend deployed"

echo "🎉 Deployment complete!"
echo "Backend: https://your-project-name.railway.app"
echo "Frontend: https://igjf-app.vercel.app"
```

## 📊 User Testing Strategy

### Phase 1: Internal Testing (10 users)
- Share with team/friends
- Test all features
- Fix critical bugs

### Phase 2: Beta Testing (50 users)
- Share with target audience
- Collect feedback via Google Forms
- Monitor performance

### Phase 3: Public Testing (100 users)
- Share publicly
- Implement analytics
- Prepare for scaling

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   ```bash
   # Update Railway CORS_ORIGIN
   railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app
   ```

2. **Database Connection**:
   ```bash
   # Check Railway database URL
   railway variables
   ```

3. **Build Failures**:
   ```bash
   # Clear cache and rebuild
   npm run build:web
   vercel --prod --force
   ```

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Expo Docs**: https://docs.expo.dev
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## 🎯 Success Metrics

Track these KPIs for 100-user testing:
- **Daily Active Users (DAU)**
- **User Retention Rate**
- **Feature Usage**
- **Performance Metrics**
- **Error Rates**
- **User Feedback Scores**

---

## ✅ Ready to Deploy?

1. **Backend**: Railway deployment (~10 minutes)
2. **Frontend**: Vercel deployment (~5 minutes)
3. **Testing**: Share URLs with users (~immediate)
4. **Monitoring**: Set up analytics (~15 minutes)

**Total Time**: ~30 minutes for global deployment! 🌍

**Your app will be available 24/7 globally, even when your laptop is off!** 🎊