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
    const userFromToken = req.user as any;
    const userId = userFromToken?.userId;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    
    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }
}

