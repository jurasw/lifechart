import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

let cachedApp: express.Application;

async function bootstrap(): Promise<express.Application> {
  if (!cachedApp) {
    try {
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
      cachedApp = expressApp;
    } catch (error) {
      console.error('Error initializing NestJS app:', error);
      throw error;
    }
  }
  
  return cachedApp;
}

export default async function handler(req: express.Request, res: express.Response) {
  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (error: any) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: error?.message });
    }
  }
}

