import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const loggerDir = join( __dirname, '..', '..', 'logs' );

if ( !existsSync( loggerDir ) ) {
  mkdirSync( loggerDir );
}

const customFormat = format.printf( ({ timestamp, level, stack, message, context }) => {
  return `${timestamp} - [${level.toUpperCase().padEnd( 10 )}] - [${( context || 'GENERIC' ).toUpperCase().padEnd( 20 )}] - ${stack || message}`;
});

const options = {
  file: {
    filename: 'error.log',
    level: 'silly'
  },
  console: {
    level: 'silly'
  }
};

const devLogger = {
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new transports.Console( options.console ),
    new transports.DailyRotateFile({
      filename: `${loggerDir}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
};

const prodLogger = {
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console( options.console ),
    new transports.DailyRotateFile({
      level: 'silly',
      filename: `${loggerDir}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
};

const instanceLogger = ( process.env.NODE_ENV === 'production' ) ? prodLogger : devLogger;

export const instance = createLogger( instanceLogger );
