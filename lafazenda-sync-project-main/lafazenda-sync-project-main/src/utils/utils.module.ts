import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ConfigModule } from '@nestjs/config';
import { CONFIG } from './config/enviroment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ () => CONFIG ]
    })
  ],
  providers: [ LoggerService ],
  exports: [ LoggerService ]
})
export class UtilsModule {}
