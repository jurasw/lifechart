import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import serverless from 'serverless-http';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    
    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.some(allowed => {
          if (!allowed) return false;
          try {
            const originUrl = new URL(origin);
            const allowedUrl = new URL(allowed);
            return originUrl.hostname === allowedUrl.hostname || 
                   originUrl.hostname.endsWith('.vercel.app') ||
                   origin.includes('localhost') ||
                   origin.includes('127.0.0.1');
          } catch {
            return origin.includes(allowed) || allowed.includes(origin);
          }
        })) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Content-Type', 'Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
    cachedApp = serverless(expressApp, {
      binary: ['image/*', 'application/json'],
    });
  }
  
  return cachedApp;
}

export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const app = await bootstrap();
  return app(event, context);
};

