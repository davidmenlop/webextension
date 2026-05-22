import { Module } from '@nestjs/common';
import { SdkService } from './sdk.service';
import { SdkController } from './sdk.controller';

@Module({
  providers: [ SdkService ],
  controllers: [ SdkController ]
})
export class SdkModule {}
