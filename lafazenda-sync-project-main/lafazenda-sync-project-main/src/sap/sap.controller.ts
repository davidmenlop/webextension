import { Controller } from '@nestjs/common';
import { SapService } from './sap.service';
import { Cron } from '@nestjs/schedule';

@Controller( 'sap' )
export class SapController {

  constructor (
    private readonly sapService: SapService
  ) { }

  // @Cron( '*/1 * * * *' )
  async queueSapEmpresasPrimarias () {
    await this.sapService.queueSapEmpresasPrimarias();
  }

  // @Cron( '*/1 * * * *' )
  async queueSapEmpresasSencundarias () {
    await this.sapService.queueSapEmpresasSecundarias();
  }

  // @Cron( '*/1 * * * *' )
  async queueSapVentas () {
    await this.sapService.queueSapVentas();
  }

}
