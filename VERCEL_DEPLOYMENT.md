# Vercel Deployment Guide for LifeChart

This guide explains how to deploy both the frontend and backend of LifeChart to Vercel.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account (for production database) or MongoDB connection string
3. Google OAuth credentials configured

## Deployment Steps

### 1. Backend Deployment

#### Step 1.1: Prepare Backend

1. Navigate to the backend directory:
```bash
cd apps/backend
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

#### Step 1.2: Deploy to Vercel

1. Install Vercel CLI (if not already installed):
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the backend:
```bash
cd apps/backend
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - What's your project's name? **lifechart-backend** (or your preferred name)
   - In which directory is your code located? **./**

5. After deployment, note the deployment URL (e.g., `https://lifechart-backend.vercel.app`)

#### Step 1.3: Configure Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url.vercel.app/auth/google/callback
FRONTEND_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your_jwt_secret_key
VERCEL_URL=your-backend-url.vercel.app
```

**Important Notes:**
- Replace `your-backend-url.vercel.app` with your actual backend Vercel URL
- Replace `your-frontend-url.vercel.app` with your actual frontend Vercel URL (you'll get this after deploying the frontend)
- Use MongoDB Atlas connection string for production
- Generate a secure JWT_SECRET (e.g., using `openssl rand -base64 32`)

4. Redeploy after adding environment variables:
```bash
vercel --prod
```

### 2. Frontend Deployment

#### Step 2.1: Prepare Frontend

1. Navigate to the frontend directory:
```bash
cd apps/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

#### Step 2.2: Deploy to Vercel

1. Deploy the frontend:
```bash
cd apps/frontend
vercel
```

2. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - What's your project's name? **lifechart-frontend** (or your preferred name)
   - In which directory is your code located? **./**

3. After deployment, note the deployment URL (e.g., `https://lifechart-frontend.vercel.app`)

#### Step 2.3: Configure Environment Variables

1. Go to your frontend Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:

```
VITE_API_URL=https://your-backend-url.vercel.app
```

**Important:** Replace `your-backend-url.vercel.app` with your actual backend Vercel URL from Step 1.2

4. Redeploy after adding environment variables:
```bash
vercel --prod
```

### 3. Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://your-backend-url.vercel.app/auth/google/callback`
5. Add authorized JavaScript origins:
   - `https://your-backend-url.vercel.app`
   - `https://your-frontend-url.vercel.app`

### 4. Update Backend Environment Variables

After deploying the frontend, update the backend's `FRONTEND_URL` environment variable:

1. Go to backend Vercel project → **Settings** → **Environment Variables**
2. Update `FRONTEND_URL` to your frontend URL
3. Redeploy:
```bash
cd apps/backend
vercel --prod
```

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository. To enable this:

1. Connect your repository to Vercel:
   - Go to project settings → **Git**
   - Connect your repository
   - Select the root directory for each project:
     - Backend: `apps/backend`
     - Frontend: `apps/frontend`

2. Configure build settings:
   - **Backend:**
     - Root Directory: `apps/backend`
     - Build Command: `npm run build`
     - Output Directory: (leave empty)
   - **Frontend:**
     - Root Directory: `apps/frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`

## Troubleshooting

### Backend Issues

1. **Serverless function timeout**: Increase timeout in Vercel project settings
2. **MongoDB connection issues**: Ensure MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0)
3. **CORS errors**: Check that `FRONTEND_URL` is correctly set in backend environment variables

### Frontend Issues

1. **API calls failing**: Verify `VITE_API_URL` is set correctly
2. **Build errors**: Check that all dependencies are in `package.json`
3. **OAuth not working**: Ensure callback URLs match in Google Console and backend environment variables

## Local Development

For local development, create `.env` files:

**Backend (`apps/backend/.env`):**
```
MONGODB_URI=mongodb://localhost:27017/lifechart
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_local_jwt_secret
PORT=3000
```

**Frontend (`apps/frontend/.env`):**
```
VITE_API_URL=http://localhost:3000
```

## Production Checklist

- [ ] MongoDB Atlas database configured
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] Google OAuth callback URLs updated
- [ ] CORS configured correctly
- [ ] JWT secret is secure and random
- [ ] Both projects connected to Git for auto-deployment

