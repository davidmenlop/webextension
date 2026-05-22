import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CONFIG } from './utils/config/enviroment.config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { EnviromentEnum } from './utils/models/enviroment.model';
import { morganMiddleware } from './utils/config/morgan.config';
import { LoggerService } from './utils/logger.service';
import { WinstonModule } from 'nest-winston';
import { instance } from './utils/winston.logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';

async function bootstrap () {

  let options = {};

  if ( CONFIG.enviroment === EnviromentEnum.PRODUCTION ) {
    options = {
      logger: WinstonModule.createLogger({
        level: 'debug',
        instance: instance
      })
    };
  }

  const app = await NestFactory.create( AppModule, options );

  app.use( session({
    secret: CONFIG.auth.externalSecretKey,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }) );

  app.setGlobalPrefix( CONFIG.prefix );

  app.useGlobalPipes( new ValidationPipe() );

  app.useGlobalInterceptors( new ClassSerializerInterceptor( app.get( Reflector ) ) );

  if ( CONFIG.enviroment === EnviromentEnum.DEVELOPMENT ) {
    app.use( morganMiddleware );
  }

  if ( [
    EnviromentEnum.DEVELOPMENT,
    EnviromentEnum.STAGING
  ].includes( CONFIG.enviroment ) ) {
    const projectName = CONFIG.projectName.split( '_' ).join( ' ' ).toUpperCase();
    const options = new DocumentBuilder()
      .setTitle( `${projectName} API` )
      .setDescription( `The ${projectName} API description` )
      .setVersion( '1.0' )
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument( app, options );
    SwaggerModule.setup( `${CONFIG.prefix}/swagger`, app, document );
  }

  const logger = await app.resolve<LoggerService>( LoggerService );

  app.enableCors({
    origin: CONFIG.corsOrigins
  });

  await app.listen( CONFIG.httpPort );

  logger.log(
    `http://${CONFIG.host}:${CONFIG.httpPort}/${CONFIG.prefix}`,
    'HTTP API'
  );
  logger.log(
    `http://${CONFIG.host}:${CONFIG.httpPort}/${CONFIG.prefix}/swagger`,
    'SWAGGER DOC'
  );
  logger.log(
    `http://${CONFIG.host}:${CONFIG.httpPort}/${CONFIG.prefix}/queues`,
    'QUEUES'
  );
}
bootstrap();
