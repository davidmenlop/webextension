import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module';
import { HubspotModule } from './hubspot/hubspot.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SdkModule } from './sdk/sdk.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { CONFIG } from './utils/config/enviroment.config';
import { AuthModule } from './auth/auth.module';
import { BasicAuthMiddleware } from './auth/basic.auth.service';
import { SapModule } from './sap/sap.module';
import { WebExtensionModule } from './web-extension/web-extension.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SAP_HUBSPOT_BPS_2 } from './sap/models/empresas.model';
import { EmpresaSecundaria } from './hubspot/models/empresa_secundaria.model';
import { SecondaryCompanyQueue } from './hubspot/models/empresa_secundaria_queue.model';
import { SAP_HUBSPOT_REPORTE_VENTAS } from './sap/models/ventas.model';
import { Negocio } from './hubspot/models/negocio.model';
import { DealQueue } from './hubspot/models/negocio_queue.model';
import { EmpresaPrimaria } from './hubspot/models/empresa_primaria.model';
import { PrimaryCompanyQueue } from './hubspot/models/empresa_primaria_queue.model';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...CONFIG.databases.mysql as Partial<TypeOrmModuleOptions>,
      entities: [
        EmpresaPrimaria,
        PrimaryCompanyQueue,
        EmpresaSecundaria,
        SecondaryCompanyQueue,
        Negocio,
        DealQueue
      ]
    }),
    TypeOrmModule.forRoot({
      ...CONFIG.databases.mysqlfazenda as Partial<TypeOrmModuleOptions>,
      name: 'FAZENDA',
      entities: [
        SAP_HUBSPOT_BPS_2,
        SAP_HUBSPOT_REPORTE_VENTAS
      ]
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join( __dirname, '..', 'client/dist/spa' )
    // }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: CONFIG.databases.redis
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter
      // middleware: BasicAuthMiddleware
    }),
    UtilsModule,
    HubspotModule,
    SdkModule,
    AuthModule,
    SapModule,
    WebExtensionModule
  ],
  controllers: [ ],
  providers: [ ]
})
export class AppModule {}
