# 🚀 Questify - Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended for Socket.IO)

Railway is perfect for apps using Socket.IO due to WebSocket support.

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Set Environment Variables** (in Railway dashboard)
   ```
   NODE_ENV=production
   PORT=${{PORT}}
   ```

6. **Custom Domain** (optional)
   - Go to Railway dashboard
   - Click "Settings" → "Domains"
   - Add your custom domain

**Railway deployment works automatically with:**
- ✅ Custom server (server.js)
- ✅ Socket.IO WebSockets
- ✅ Auto-scaling
- ✅ HTTPS by default

### Option 2: Render.com

1. **Create account** at render.com

2. **New Web Service**
   - Connect your GitHub repo
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy**
   - Render will auto-deploy on git push

### Option 3: Heroku

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create App**
   ```bash
   heroku create your-app-name
   ```

3. **Add Procfile** (create in root)
   ```
   web: npm start
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

### Option 4: VPS (Digital Ocean, Linode, etc.)

1. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2**
   ```bash
   npm install -g pm2
   ```

4. **Clone & Setup**
   ```bash
   git clone your-repo-url
   cd questify
   npm install
   npm run build
   ```

5. **Start with PM2**
   ```bash
   pm2 start server.js --name questify
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx** (reverse proxy)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io/ {
           proxy_pass http://localhost:3000/socket.io/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

7. **SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔧 Pre-Deployment Checklist

- [ ] Test build locally: `npm run build && npm start`
- [ ] Environment variables configured
- [ ] Update CORS settings if needed
- [ ] Set NODE_ENV to "production"
- [ ] Test Socket.IO connection
- [ ] Add custom domain (optional)
- [ ] Configure SSL certificate
- [ ] Set up monitoring (optional)
- [ ] Configure analytics (optional)

## 📊 Environment Variables

### Required
```bash
NODE_ENV=production
PORT=3000  # or ${{PORT}} for Railway/Render
```

### Optional
```bash
SOCKET_CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
```

## ⚡ Performance Tips

1. **Enable Compression** (in server.js)
   ```javascript
   const compression = require('compression')
   app.use(compression())
   ```

2. **Add Rate Limiting** (prevent abuse)
   ```javascript
   const rateLimit = require('express-rate-limit')
   const limiter = rateLimit({
       windowMs: 15 * 60 * 1000,
       max: 100
   })
   app.use(limiter)
   ```

3. **Configure Caching**
   - Add `Cache-Control` headers for static assets
   - Use CDN for better global performance

4. **Monitor with PM2**
   ```bash
   pm2 monit
   pm2 logs questify
   ```

## 🔒 Security

1. **Update Dependencies**
   ```bash
   npm audit fix
   ```

2. **Set Secure Headers** (add to server.js)
   ```javascript
   const helmet = require('helmet')
   app.use(helmet())
   ```

3. **Limit Player Names** (already done)
   - maxLength: 20 characters
   - Validation on server

4. **Rate Limit Socket.IO** (add to server.js)
   ```javascript
   io.use((socket, next) => {
       // Add rate limiting logic
       next()
   })
   ```

## 📈 Monitoring (Optional)

### Option 1: PM2 Plus
```bash
pm2 link <secret> <public>
pm2 install pm2-logrotate
```

### Option 2: Sentry
```bash
npm install @sentry/node
```

Add to server.js:
```javascript
const Sentry = require('@sentry/node')
Sentry.init({ dsn: process.env.SENTRY_DSN })
```

### Option 3: LogRocket
For client-side monitoring and session replay.

## 🌍 Domain Setup

1. **Purchase Domain** (Namecheap, GoDaddy, etc.)

2. **DNS Configuration**
   - Add A record pointing to server IP
   - Or CNAME for platform-hosted domains

3. **Update Environment**
   ```bash
   NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
   ```

## 🧪 Testing Deployment

```bash
# Local production test
npm run build
NODE_ENV=production npm start

# Test endpoints
curl http://localhost:3000
curl http://localhost:3000/join
curl http://localhost:3000/present
```

## 🐛 Troubleshooting Deployment

### Socket.IO not connecting
- Ensure WebSocket support enabled on platform
- Check CORS configuration
- Verify PORT environment variable
- Check firewall rules

### Build fails
- Clear `.next` folder: `rm -rf .next`
- Check Node.js version: `node -v` (needs 18+)
- Verify all dependencies: `npm install`

### App crashes
- Check logs: `pm2 logs` or platform logs
- Verify environment variables
- Check memory limits
- Review error messages

## 🎯 Recommended Platform

**For beginners**: Railway.app
- Easiest deployment
- Great WebSocket support
- Auto-scaling
- Free tier available

**For production**: VPS with PM2
- Full control
- Cost-effective at scale
- Best performance
- Complete customization

## 📱 Mobile PWA (Future)

To make Questify installable as a mobile app:

1. Add `manifest.json`
2. Add service worker
3. Configure offline caching
4. Test with Lighthouse

---

## 🚀 One-Command Deploy (Railway)

```bash
railway login && railway init && railway up
```

That's it! Your app is live! 🎉
