import { Injectable } from '@nestjs/common';
import { LoggerService } from '../utils/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Negocio } from './models/negocio.model';
import { AxiosInstance } from 'axios';
import { INTEGRATIONS } from '../utils/config/integrations.config';

@Injectable()
export class NegocioService {
  readonly apiHbV3: AxiosInstance;
  readonly apiHbV4: AxiosInstance;
  readonly apiFilesV3: AxiosInstance;

  constructor (
    @InjectRepository( Negocio )
    private readonly _negocioRepository: Repository<Negocio>,
    private logger: LoggerService
  ) {
    this.apiHbV3 = INTEGRATIONS.hubspot.apiV3;
    this.apiHbV4 = INTEGRATIONS.hubspot.apiV4;
    this.apiFilesV3 = INTEGRATIONS.hubspot.apiFilesV3;
  }

  async obtenerCantidadNegocios () {

    try {
      return await this._negocioRepository.count();
    } catch ( error ) {
      this.logger.error( error );
    }

  }

  async guardarNegocios ( negocios: Negocio[] ) {
    try {
      await this._negocioRepository.save( negocios );
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async eliminarNegocio ( DOC_FACTURACION: string, MATERIAL: string ) {
    try {
      await this._negocioRepository.delete({
        DOC_FACTURACION,
        MATERIAL
      });
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async obtenerNegociosParaColas () {
    try {
      return await this._negocioRepository.find({
        take: 1
      });
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async findDealByDocFacturacion ( DOC_FACTURACION: string, MATERIAL: string ) {
    const response = await this.apiHbV3.post( `/objects/deals/search`, {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'doc_facturacion',
              value: DOC_FACTURACION,
              operator: 'EQ'
            },
            {
              propertyName: 'material',
              value: MATERIAL,
              operator: 'EQ'
            }
          ]
        },
        {
          filters: [
            {
              propertyName: 'doc_facturacion',
              value: Number( DOC_FACTURACION ),
              operator: 'EQ'
            },
            {
              propertyName: 'material',
              value: MATERIAL,
              operator: 'EQ'
            }
          ]
        }
      ]
    });
    return response.data?.results?.[0];
  }

  async updateDeal ( properties: any, id: string ) {
    const response = await this.apiHbV3.patch( `/objects/deals/${id}`, { properties });
    console.warn( response.data );
    return response.data;
  }

  async createDeal ( properties: any ) {
    const response = await this.apiHbV3.post( `/objects/deals`, { properties });
    return response.data;
  }

  async asociationDealToCompany ( id: string, idCompany: string ) {
    await this.apiHbV4.put( `/objects/companies/${idCompany}/associations/deals/${id}`, [
      {
        associationCategory: 'HUBSPOT_DEFINED',
        associationTypeId: 342
      }
    ] );
  }
}
