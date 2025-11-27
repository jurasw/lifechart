# Fixing 404 NOT_FOUND Error on Vercel

If you're getting a 404 error, follow these steps:

## 1. Check Vercel Project Settings

In your Vercel dashboard for the **backend** project:

1. Go to **Settings** → **General**
2. Verify **Root Directory** is set to: `apps/backend`
3. Verify **Build Command** is: `npm run build`
4. Verify **Output Directory** is: (leave empty)

## 2. Verify API File Location

Make sure the file exists at: `apps/backend/api/index.ts`

## 3. Check Environment Variables

Ensure all required environment variables are set:
- `MONGODB_URI`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`
- `JWT_SECRET`
- `VERCEL_URL` (auto-set by Vercel)

## 4. Redeploy

After making changes:

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger auto-deployment

## 5. Check Function Logs

1. Go to **Deployments** → Click on a deployment
2. Click **Functions** tab
3. Check for any errors in the logs

## 6. Test the API

Try accessing:
- `https://your-backend.vercel.app/` (should return hello message)
- `https://your-backend.vercel.app/health` (should return health status)

## Common Issues

### Issue: "Cannot find module"
**Solution**: Make sure `api/index.ts` is in the correct location and all dependencies are in `package.json`

### Issue: Build succeeds but 404 on all routes
**Solution**: 
- Check that `vercel.json` has the correct rewrite rule
- Verify the handler is exported as `default export`
- Check that the API file is in the `api` folder at the root of `apps/backend`

### Issue: Timeout errors
**Solution**: 
- Increase function timeout in Vercel settings (Settings → Functions)
- Check MongoDB connection string is correct
- Verify database is accessible from Vercel IPs

## Alternative: Use Vercel CLI to Debug

```bash
cd apps/backend
vercel dev
```

This will run locally and show you any errors before deploying.

