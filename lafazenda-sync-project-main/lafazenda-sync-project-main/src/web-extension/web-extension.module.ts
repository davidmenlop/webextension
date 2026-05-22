import { Module } from '@nestjs/common';
import { WebExtensionService } from './web-extension.service';
import { WebExtensionController } from './web-extension.controller';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [ UtilsModule ],
  providers: [ WebExtensionService ],
  controllers: [ WebExtensionController ]
})
export class WebExtensionModule {}
