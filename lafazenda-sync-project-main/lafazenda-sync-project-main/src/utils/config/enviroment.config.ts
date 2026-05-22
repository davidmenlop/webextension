
import { EnviromentEnum } from '../models/enviroment.model';
import 'dotenv/config';

class Config {
  constructor () {}

  public projectName: string = process.env.PROYECT_NAME || process.env.PROJECT_NAME || '';

  public prefix = 'api/v1';

  public host: string = process.env.DOMAIN || '0.0.0.0';

  public httpHost: string = process.env.HTTP_HOST || 'http://localhost:3000';

  public httpPort: number = Number( process.env.PORT ) || 80;

  public enviroment: EnviromentEnum =
    ( process.env.NODE_ENV as EnviromentEnum ) || EnviromentEnum.DEVELOPMENT;

  public corsOrigins: string[] | string = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS?.split( ',' )
    : '*';

  public bullBoardAuth = {
    username: process.env.BULL_BOARD_USERNAME || 'admin',
    password: process.env.BULL_BOARD_PASSWORD || 'cebra2024'
  };

  public databases = {
    mysql: {
      type: 'mysql',
      host: process.env.MYSQL_HOSTNAME,
      port: Number( process.env.MYSQL_PORT ) || 3306,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      synchronize: true
    },
    mysqlfazenda: {
      type: 'mysql',
      host: process.env.FMYSQL_HOSTNAME,
      port: Number( process.env.FMYSQL_PORT ) || 3306,
      username: process.env.FMYSQL_USER,
      password: process.env.FMYSQL_PASSWORD,
      database: process.env.FMYSQL_DATABASE,
      synchronize: false
    },
    redis: {
      host: process.env.REDIS_HOSTNAME,
      password: process.env.REDIS_PASSWORD,
      port: Number( process.env.REDIS_PORT )
    }
  };

  public auth = {
    jwt: {
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      expiresIn: '1d'
    },
    externalSecretKey: process.env.JWT_EXTERNAL_SECRET || 'change-me-in-production',
    externalToken: process.env.EXTERNAL_TOKEN || 'change-me-in-production'
  };

  public integrations = {
    hubspotQueue: {
      // contacto: 'CONTACTO',
      empresaPrimaria: 'EMPRESA_PRIMARIA',
      empresaSecundaria: 'EMPRESA_SECUNDARIA',
      negocio: 'NEGOCIO',
      custom: 'CUSTOM'
    },
    hubspot: {
      apiKey: process.env.HUBSPOT_TOKEN,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
      apiV3Url: 'https://api.hubapi.com/crm/v3',
      apiV1Oauth: 'https://api.hubapi.com/oauth/v1'
    },
    hubspotApp: {
      appId: process.env.HUBSPOT_APP_ID,
      appKey: process.env.HUBSPOT_APP_APIKEY,
      clientId: process.env.HUBSPOT_APP_CLIENT_ID,
      redirectUri: process.env.HUBSPOT_APP_REDIRECT_URI,
      clientSecret: process.env.HUBSPOT_APP_CLIENT_SECRET
    }
  };
}

export const CONFIG = new Config();
