import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CONFIG } from '../utils/config/enviroment.config';
import { LoggerService } from '../utils/logger.service';
import { HubspotService } from './hubspot.service';

@Processor( CONFIG.integrations.hubspotQueue.negocio )
export class NegocioQueue extends WorkerHost {

  constructor (
    private logger: LoggerService,
    private hubspotService: HubspotService
  ) {
    super();
  }

  async process ( job: Job<any, any, string> ): Promise<any> {

    return await this.hubspotService.processNegocio( job.data );
  }

  @OnWorkerEvent( 'active' )
  onActive ( job: Job ) {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify( job.data )}...`,
      CONFIG.integrations.hubspotQueue.negocio );
  }

  @OnWorkerEvent( 'completed' )
  onCompleted ( job: Job ) {
    this.logger.debug(
      `Completed job ${job.id} of type ${job.name}`,
      CONFIG.integrations.hubspotQueue.negocio );
  }

  @OnWorkerEvent( 'failed' )
  onFailed ( job: Job ) {
    this.logger.debug(
      `Failed job ${job.id} of type ${job.name}`,
      CONFIG.integrations.hubspotQueue.negocio );
  }
}
