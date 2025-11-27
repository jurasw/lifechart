# Quick Vercel Setup Guide

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Backend Setup

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com and sign in
   - Click "Add New..." → "Project"

2. **Import Backend Repository**
   - Import your Git repository
   - **Root Directory**: Set to `apps/backend`
   - **Framework Preset**: Select "Other" or "Node.js"
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (not needed for serverless)
   - **Install Command**: `npm install`

3. **Configure Environment Variables**
   Click "Environment Variables" and add:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=https://your-backend-name.vercel.app/auth/google/callback
   FRONTEND_URL=https://your-frontend-name.vercel.app
   JWT_SECRET=generate_a_random_secret_key_here
   VERCEL_URL=your-backend-name.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - **Copy the deployment URL** (e.g., `https://lifechart-backend.vercel.app`)

### Frontend Setup

1. **Add New Project**
   - In Vercel Dashboard, click "Add New..." → "Project"
   - Import the same Git repository

2. **Configure Frontend**
   - **Root Directory**: Set to `apps/frontend`
   - **Framework Preset**: Select "Vite"
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install`

3. **Configure Environment Variables**
   Add this variable:
   ```
   VITE_API_URL=https://your-backend-name.vercel.app
   ```
   ⚠️ **Important**: Replace `your-backend-name.vercel.app` with your actual backend URL from step 4 above

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - **Copy the frontend URL** (e.g., `https://lifechart-frontend.vercel.app`)

### Update Backend with Frontend URL

1. Go back to your **Backend project** in Vercel
2. Go to **Settings** → **Environment Variables**
3. Update `FRONTEND_URL` to your frontend URL:
   ```
   FRONTEND_URL=https://your-frontend-name.vercel.app
   ```
4. Go to **Deployments** tab
5. Click the "..." menu on the latest deployment → **Redeploy**

### Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. **Authorized redirect URIs**: Add
   ```
   https://your-backend-name.vercel.app/auth/google/callback
   ```
5. **Authorized JavaScript origins**: Add both
   ```
   https://your-backend-name.vercel.app
   https://your-frontend-name.vercel.app
   ```

---

## Option 2: Deploy via Vercel CLI

### Install Vercel CLI
```bash
npm i -g vercel
```

### Deploy Backend

```bash
cd apps/backend
vercel
```

Follow prompts:
- Set up and deploy? **Yes**
- Link to existing project? **No** (first time)
- Project name: `lifechart-backend`
- Directory: `./`

After deployment, add environment variables:
```bash
vercel env add MONGODB_URI
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_CALLBACK_URL
vercel env add FRONTEND_URL
vercel env add JWT_SECRET
vercel env add VERCEL_URL
```

Then deploy to production:
```bash
vercel --prod
```

### Deploy Frontend

```bash
cd apps/frontend
vercel
```

Follow prompts:
- Set up and deploy? **Yes**
- Link to existing project? **No** (first time)
- Project name: `lifechart-frontend`
- Directory: `./`

Add environment variable:
```bash
vercel env add VITE_API_URL
```

Then deploy to production:
```bash
vercel --prod
```

---

## Important Notes

### MongoDB Setup
- Use **MongoDB Atlas** (free tier available)
- Get connection string from Atlas dashboard
- Format: `mongodb+srv://username:password@cluster.mongodb.net/lifechart?retryWrites=true&w=majority`
- Add `0.0.0.0/0` to Network Access (allow all IPs) or add Vercel IPs

### JWT Secret
Generate a secure secret:
```bash
openssl rand -base64 32
```

### Environment Variables Priority
Vercel uses environment variables in this order:
1. Production (always use for production deployments)
2. Preview (for pull requests)
3. Development (for local dev)

Make sure to set variables for **Production** environment.

### Custom Domains (Optional)
1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Troubleshooting

### Backend not working?
- Check Vercel function logs: **Deployments** → Click deployment → **Functions** tab
- Verify all environment variables are set
- Check MongoDB connection string is correct
- Ensure `VERCEL_URL` matches your backend URL

### Frontend can't connect to backend?
- Verify `VITE_API_URL` is set correctly
- Check backend CORS settings allow your frontend URL
- Look at browser console for CORS errors

### OAuth not working?
- Verify callback URL in Google Console matches backend URL
- Check `GOOGLE_CALLBACK_URL` environment variable
- Ensure both frontend and backend URLs are in authorized origins

### Build fails?
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles without errors locally first

---

## Quick Checklist

- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set in both projects
- [ ] MongoDB Atlas connection string configured
- [ ] Google OAuth callback URLs updated
- [ ] `FRONTEND_URL` in backend matches frontend URL
- [ ] `VITE_API_URL` in frontend matches backend URL
- [ ] Both projects redeployed after setting environment variables

