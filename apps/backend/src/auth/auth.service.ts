import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(googleId: string, email: string, name: string, picture?: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({ googleId }).exec();
    
    if (!user) {
      user = await this.userModel.findOne({ email }).exec();
      if (user) {
        user.googleId = googleId;
        if (picture) user.picture = picture;
        await user.save();
      }
    }

    if (!user) {
      user = new this.userModel({
        googleId,
        email,
        name,
        picture,
      });
      await user.save();
    } else {
      if (name && user.name !== name) {
        user.name = name;
      }
      if (picture && user.picture !== picture) {
        user.picture = picture;
      }
      await user.save();
    }

    return user;
  }

  async login(user: UserDocument) {
    const payload = { email: user.email, sub: user._id.toString() };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  }

  async findUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }
}

