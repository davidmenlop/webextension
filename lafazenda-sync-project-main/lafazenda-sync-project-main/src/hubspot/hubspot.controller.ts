import { Controller, Get } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { Cron } from '@nestjs/schedule';

@Controller( 'hubspot' )
export class HubspotController {

  constructor (
    private hubspotService: HubspotService
  ) { }

  // @Cron( '*/1 * * * *' )
  async updateQueueHubspotPrimaryCompanies () {
    await this.hubspotService.updateQueueHubspotPrimaryCompanies();
  }

  // @Cron( '*/1 * * * *' )
  async updateQueueHubspotSecondaryCompanies () {
    await this.hubspotService.updateQueueHubspotSecondaryCompanies();
  }

  // @Cron( '*/1 * * * *' )
  async updateQueueHubspotDeals () {
    await this.hubspotService.updateQueueHubspotDeals();
  }

  @Get( 'health' )
  async health (
  ) {
    return {
      status: 'ok'
    };
  }

}
