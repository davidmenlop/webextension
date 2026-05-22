import { Module } from '@nestjs/common';
import { SapService } from './sap.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SAP_HUBSPOT_BPS_2 } from './models/empresas.model';
import { SapController } from './sap.controller';
import { HubspotModule } from '../hubspot/hubspot.module';
import { UtilsModule } from '../utils/utils.module';
import { SAP_HUBSPOT_REPORTE_VENTAS } from './models/ventas.model';

@Module({
  imports: [
    TypeOrmModule.forFeature( [
      SAP_HUBSPOT_BPS_2,
      SAP_HUBSPOT_REPORTE_VENTAS
    ], 'FAZENDA' ),
    HubspotModule,
    UtilsModule
  ],
  providers: [ SapService ],
  controllers: [ SapController ]
})
export class SapModule {}
