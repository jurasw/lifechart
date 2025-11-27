import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { InvestmentsModule } from './investments/investments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/lifechart',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TasksModule,
    InvestmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

