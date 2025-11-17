# LifeChart Backend

NestJS backend API for LifeChart application with MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/lifechart
```

## Running the app

```bash
# development
npm run dev

# build
npm run build

# production mode
npm run start:prod
```

## API Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

## MongoDB Connection

The app connects to MongoDB using Mongoose. Make sure MongoDB is running before starting the application.

