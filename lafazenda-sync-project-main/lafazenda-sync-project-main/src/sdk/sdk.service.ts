import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CONFIG } from '../utils/config/enviroment.config';
import axios from 'axios';
import * as https from 'https';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class SdkService {

  private httpsAgent: https.Agent;
  private readonly logger = new LoggerService( SdkService.name );

  constructor ( ) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  async sendAuthCode ( code: string ) {
    this.logger.log( `code: ${code}` );
    this.logger.log( `CONFIG.httpHost: ${CONFIG.httpHost}` );
    this.logger.log( `CONFIG.prefix: ${CONFIG.prefix}` );

    await axios.post( `${CONFIG.httpHost}/${CONFIG.prefix}/sdk/auth/callback`, {
      code
    }, {
      httpsAgent: this.httpsAgent
    });
  }

  async validateAuthCodeAndApiKey ( data: any ) {
    let response = null;
    try {
      response = await axios.post( `${CONFIG.integrations.hubspot.apiV1Oauth}/token`,
        {
          client_id: CONFIG.integrations.hubspotApp.clientId,
          code: data.code,
          redirect_uri: CONFIG.integrations.hubspotApp.redirectUri,
          client_secret: CONFIG.integrations.hubspotApp.clientSecret,
          grant_type: 'authorization_code'
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
          }
        }
      );
    } catch ( error ) {
      throw new UnauthorizedException( error.response.data );
    }
    try {
      await axios.post( `${CONFIG.integrations.hubspot.apiV3Url}/extensions/calling/${CONFIG.integrations.hubspotApp.appId}/settings?hapikey=${CONFIG.integrations.hubspotApp.appKey}`,
        {
          'name': 'Widget SDK',
          'url': CONFIG.integrations.hubspotApp.redirectUri,
          'height': 600,
          'width': 400,
          'isReady': true,
          'supportsCustomObjects': true,
          'supportsInboundCalling': true
        }
      );
    } catch ( error ) {
      if ( error.response.data.subCategory !== 'CallingSettingError.SETTINGS_ALREADY_EXISTS' ) {
        throw new BadRequestException( error.response.data );
      }
    }

    return response.data;
  }
}
