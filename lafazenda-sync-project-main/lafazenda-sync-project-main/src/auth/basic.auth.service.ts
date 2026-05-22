import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CONFIG } from '../utils/config/enviroment.config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  private readonly username: string;

  constructor (
    private jwtService: JwtService
  ) {
    this.username = CONFIG.bullBoardAuth.username;
  }

  async use ( req: Request, res: Response, next: NextFunction ): Promise<void> {

    const token = ( req as any ).session.token;

    if ( !token ) {
      res.redirect( '/signin/queues' );
      return;
    }

    try {
      const decodeJwt = await this.jwtService.verify( token );

      if ( !decodeJwt ) {
        res.redirect( '/signin/queues' );
        return;
      }

      if ( decodeJwt.username !== this.username ) {
        return res.redirect( '/signin/queues' );
      }
    } catch ( error ) {
      return res.redirect( '/signin/queues' );;
    }

    next();
  }

  private sendUnauthorizedResponse ( res: Response ): void {
    res.setHeader( 'WWW-Authenticate', 'Basic realm="Restricted Area", charset="UTF-8"' );
    res.sendStatus( 401 );
  }
}
