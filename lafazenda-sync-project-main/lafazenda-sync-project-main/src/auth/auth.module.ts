import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './localauth.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { CONFIG } from '../utils/config/enviroment.config';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: CONFIG.auth.jwt.secret,
      signOptions: { expiresIn: CONFIG.auth.jwt.expiresIn }
    })
  ],
  providers: [
    AuthService,
    LocalStrategy
  ],
  controllers: [ AuthController ],
  exports: [ AuthService ]
})
export class AuthModule {}
