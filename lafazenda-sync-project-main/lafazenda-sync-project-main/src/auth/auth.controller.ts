import { Body, Controller, Post, Session } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller( 'auth' )
export class AuthController {

  constructor (
    private readonly authService: AuthService
  ) {}

  @Post( 'login_queues' )
  async loginQueues ( @Body() body: any, @Session() session: any ) {
    const result = await this.authService.validateUser( body.username, body.password );
    session.authenticated = true;
    session.token = result.token;
    return result;
  }

}
