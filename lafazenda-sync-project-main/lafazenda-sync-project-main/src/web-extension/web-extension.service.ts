import { Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { INTEGRATIONS } from '../utils/config/integrations.config';
import { LoggerService } from '../utils/logger.service';

export interface CompanyResult {
  id: string;
  name: string;
  cod_cliente: string | null;
}

export interface AllCompaniesResponse {
  companies: CompanyResult[];
  total: number;
  syncedAt: string;
}

export interface PaginatedResponse {
  results: CompanyResult[];
  paging?: {
    next?: { after?: string };
  };
}

@Injectable()
export class WebExtensionService {
  private readonly apiHbV3: AxiosInstance;

  constructor ( private readonly logger: LoggerService ) {
    this.apiHbV3 = INTEGRATIONS.hubspot.apiV3;
  }

  async getCompanies ( limit = 100, after?: string ): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    params.set( 'properties', 'name,cod_cliente' );
    params.set( 'limit', String( limit ) );
    if ( after ) params.set( 'after', after );

    const url = `/objects/companies?${params.toString()}`;
    this.logger.debug( `Fetching companies: ${url}` );

    const response = await this.apiHbV3.get( url );
    const results: CompanyResult[] = ( response.data.results || [] ).map( ( r: any ) => ({
      id: r.id,
      name: r.properties.name || '',
      cod_cliente: r.properties.cod_cliente || null
    }) );

    return { results, paging: response.data.paging };
  }

  async getAllCompanies ( maxTotal?: number ): Promise<AllCompaniesResponse> {
    const allCompanies: CompanyResult[] = [];
    let after: string | undefined;
    let pageCount = 0;

    do {
      const { results, paging } = await this.getCompanies( 100, after );
      allCompanies.push( ...results );
      after = paging?.next?.after;
      pageCount++;
      this.logger.debug( `Page ${pageCount}: ${results.length} companies (total so far: ${allCompanies.length})` );
      if ( maxTotal && allCompanies.length >= maxTotal ) {
        this.logger.log( `Reached maxTotal limit of ${maxTotal} after ${pageCount} pages` );
        break;
      }
    } while ( after );

    this.logger.log( `Loaded all ${allCompanies.length} companies in ${pageCount} pages` );

    return {
      companies: allCompanies,
      total: allCompanies.length,
      syncedAt: new Date().toISOString()
    };
  }

  async searchCompanies ( term: string ): Promise<{ results: CompanyResult[] }> {
    this.logger.debug( `Searching companies with term: "${term}"` );

    const searchBy = async ( propertyName: string ) => {
      try {
        const response = await this.apiHbV3.post( '/objects/companies/search', {
          filterGroups: [
            {
              filters: [ { propertyName, operator: 'CONTAINS_TOKEN', value: term } ]
            }
          ],
          properties: [ 'name', 'cod_cliente' ],
          limit: 50
        });
        return response.data.results || [];
      } catch ( err: any ) {
        if ( err.response?.status === 400 ) {
          this.logger.debug( `CONTAINS_TOKEN not supported on "${propertyName}" for term "${term}", skipping` );
          return [];
        }
        throw err;
      }
    };

    const searchTasks = [ searchBy( 'name' ) ];
    if ( /\d/.test( term ) ) {
      searchTasks.push( searchBy( 'cod_cliente' ) );
    }

    const allResults = await Promise.all( searchTasks );

    const seen = new Set<string>();
    const results: CompanyResult[] = [];

    for ( const companyResults of allResults ) {
      for ( const r of companyResults ) {
        if ( !seen.has( r.id ) ) {
          seen.add( r.id );
          results.push({
            id: r.id,
            name: r.properties.name || '',
            cod_cliente: r.properties.cod_cliente || null
          });
        }
      }
    }

    return { results };
  }
}
