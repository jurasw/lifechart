import { Controller, Get, Req, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request) {
    const user = req.user as any;
    const dbUser = await this.authService.validateUser(
      user.googleId,
      user.email,
      user.name,
      user.picture,
    );
    const result = await this.authService.login(dbUser);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const script = `
      <script>
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          token: ${JSON.stringify(result.access_token)},
          user: ${JSON.stringify(result.user)}
        }, '${frontendUrl}');
        window.close();
      </script>
    `;
    return script;
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request) {
    try {
      const userFromToken = req.user as any;
      console.log('Request user from token:', userFromToken);
      
      const userId = userFromToken?.userId;
      if (!userId) {
        console.error('User ID not found in token. Token data:', userFromToken);
        throw new Error('User ID not found in token');
      }
      
      const user = await this.authService.findUserById(userId);
      if (!user) {
        console.error('User not found in database for ID:', userId);
        throw new Error('User not found');
      }
      
      const userData = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      };
      
      console.log('Returning user data:', { ...userData, picture: userData.picture ? 'SET' : 'NOT SET' });
      return userData;
    } catch (error) {
      console.error('Error in /auth/me:', error);
      throw error;
    }
  }
}

