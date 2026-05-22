import { Body, Controller, Get, Post, Query, Redirect } from '@nestjs/common';
import { SdkService } from './sdk.service';
import { CONFIG } from '../utils/config/enviroment.config';
import { LoggerService } from '../utils/logger.service';

@Controller( 'sdk' )
export class SdkController {

  private readonly logger = new LoggerService( SdkService.name );

  constructor (
    private readonly sdkService: SdkService
  ) {}

  @Get()
  @Redirect( `${CONFIG.httpHost}/loading`, 301 )
  async homeApp ( @Query( 'code' ) code: any ) {
    await this.sdkService.sendAuthCode( code );
  }

  @Post( 'auth/callback' )
  async authSDK (
    @Body() data: any
  ) {
    await this.sdkService.validateAuthCodeAndApiKey( data );
  }

  @Get( 'fech-request' )
  getHello (
    @Query( ) data: any
  ) {
    this.logger.debug( `URL CRM CARD: ${CONFIG.httpHost}/?hs_object_id=${data.hs_object_id}` );
    return {
      'results': [
        {
          'objectId': data.hs_object_id,
          'title': 'Test SDK',
          'reported_by': 'm.rodrigo@cebra.la',
          'properties': [
            {
              'label': 'Mensaje',
              'dataType': 'STRING',
              'value': 'Bienvenido!'
            }
          ]
        }
      ],
      'primaryAction': {
        'type': 'IFRAME',
        'width': 350,
        'height': 550,
        'uri': `${CONFIG.httpHost}/?hs_object_id=${data.hs_object_id}`,
        'label': 'Abrir'
      }
    };
  }

}
