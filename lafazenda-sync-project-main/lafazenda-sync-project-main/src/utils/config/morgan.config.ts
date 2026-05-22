import { Request, Response } from 'express';
import * as morgan from 'morgan';
import { LoggerService } from '../logger.service';

export const morganMiddleware = morgan( function (
  tokens: any,
  req: Request,
  res: Response
) {
  return [
    LoggerService.debug(
      `${tokens.method( req, res )} ${tokens.status( req, res )} ${tokens.url(
        req,
        res
      )} ${tokens['response-time']( req, res ) + ' ms'} ${
        '@ ' + tokens.date( req, res )
      }`,
      'REQUEST'
    )
  ].join();
});
