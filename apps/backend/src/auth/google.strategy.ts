import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const port = configService.get<string>('PORT') || '3000';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || `http://localhost:${port}/auth/google/callback`;
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    
    console.log('Google OAuth Config:');
    console.log('  Client ID:', clientID ? `${clientID.substring(0, 20)}...` : 'MISSING');
    console.log('  Client Secret:', clientSecret ? 'SET' : 'MISSING');
    console.log('  Callback URL:', callbackURL);
    
    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth credentials are missing. Check your .env file.');
    }
    
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}

