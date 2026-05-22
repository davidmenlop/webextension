import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { WebExtensionService } from './web-extension.service';

@Controller( 'web-extension' )
export class WebExtensionController {

  constructor ( private readonly service: WebExtensionService ) {}

  @Get( 'companies' )
  async getCompanies (
    @Query( 'limit' ) limit?: string,
    @Query( 'after' ) after?: string
  ) {
    const parsedLimit = limit ? parseInt( limit, 10 ) : 100;
    return this.service.getCompanies(
      isNaN( parsedLimit ) ? 100 : parsedLimit,
      after
    );
  }

  @Get( 'companies/all' )
  async getAllCompanies () {
    return this.service.getAllCompanies();
  }

  @Get( 'companies/search' )
  async searchCompanies ( @Query( 'q' ) q?: string ) {
    if ( !q || !q.trim() ) {
      throw new BadRequestException( 'Query parameter "q" is required' );
    }
    return this.service.searchCompanies( q.trim() );
  }
}
