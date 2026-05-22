import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotController } from './hubspot.controller';
import { UtilsModule } from '../utils/utils.module';
import { BullModule } from '@nestjs/bullmq';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { CONFIG } from '../utils/config/enviroment.config';
import { EmpresaSecundariaConsumerQueue } from './empresa_secundaria.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaSecundaria } from './models/empresa_secundaria.model';
import { EmpresaSecundariaService } from './empresa_secundaria.service';
import { ContactoService } from './contacto.service';
import { SecondaryCompanyQueue } from './models/empresa_secundaria_queue.model';
import { CompanyService } from './empresa.service';
import { Negocio } from './models/negocio.model';
import { NegocioService } from './negocio.service';
import { NegocioQueue } from './negocio.processor';
import { DealQueue } from './models/negocio_queue.model';
import { EmpresaPrimariaConsumerQueue } from './empresa_primaria.processor';
import { EmpresaPrimaria } from './models/empresa_primaria.model';
import { EmpresaPrimariaService } from './empresa_primaria.service';
import { PrimaryCompanyQueue } from './models/empresa_primaria_queue.model';

@Module({
  imports: [
    TypeOrmModule.forFeature( [
      EmpresaPrimaria,
      PrimaryCompanyQueue,
      EmpresaSecundaria,
      SecondaryCompanyQueue,
      Negocio,
      DealQueue
    ] ),
    BullModule.registerQueue(
      ...Object.keys( CONFIG.integrations.hubspotQueue ).map( ( key ) => ({ name: CONFIG.integrations.hubspotQueue[key], defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true
      } }) )
    ),
    BullBoardModule.forFeature(
      ...Object.keys( CONFIG.integrations.hubspotQueue ).map( ( key ) => ({ name: CONFIG.integrations.hubspotQueue[key], adapter: BullMQAdapter }) )
    ),
    UtilsModule
  ],
  providers: [
    HubspotService,
    ContactoService,
    CompanyService,
    EmpresaPrimariaConsumerQueue,
    EmpresaPrimariaService,
    EmpresaSecundariaConsumerQueue,
    EmpresaSecundariaService,
    NegocioService,
    NegocioQueue
  ],
  controllers: [ HubspotController ],
  exports: [
    EmpresaPrimariaService,
    EmpresaSecundariaService,
    NegocioService
  ]
})
export class HubspotModule {}
