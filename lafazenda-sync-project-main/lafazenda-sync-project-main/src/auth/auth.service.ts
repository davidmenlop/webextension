import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { CONFIG } from '../utils/config/enviroment.config';

@Injectable()
export class AuthService {

  constructor (
    private jwtService: JwtService
  ) {}

  async validateUser ( username: string, pass: string ): Promise<any> {
    const user = { username: CONFIG.bullBoardAuth.username, password: CONFIG.bullBoardAuth.password };
    if ( user && user.password === pass ) {
      delete user.password;
      return { user, token: this.generateToken( instanceToPlain( user ) ) };
    }
    return null;
  }

  private generateToken ( payload: Partial<any> ): string {
    return this.jwtService.sign( payload );
  }
}
