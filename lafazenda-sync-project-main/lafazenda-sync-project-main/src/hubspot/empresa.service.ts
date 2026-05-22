import { Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { INTEGRATIONS } from '../utils/config/integrations.config';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class CompanyService {
  readonly apiHbV3: AxiosInstance;
  readonly apiHbV4: AxiosInstance;
  readonly apiFilesV3: AxiosInstance;

  constructor (
    private logger: LoggerService
  ) {
    this.apiHbV3 = INTEGRATIONS.hubspot.apiV3;
    this.apiHbV4 = INTEGRATIONS.hubspot.apiV4;
    this.apiFilesV3 = INTEGRATIONS.hubspot.apiFilesV3;
  }

  // todos los contactos
  async getCompany ( ) {
    const properties = 'name,phone,website';
    const response = await this.apiHbV3.get( `/objects/companies?properties=${properties}&limit=100` );// &after=10
    return response.data;
  }

  async createCompany ( properties: any ) {
    const response = await this.apiHbV3.post( `/objects/companies`, { properties
    });
    return response.data;
  }

  async updateCompany ( properties: any, id: string ) {
    const response = await this.apiHbV3.patch( `/objects/companies/${id}`, { properties
    });
    return response.data;
  }

  async asociationCompanyToCompany ( id: string, idCompany: string ) {
    await this.apiHbV4.put( `/objects/companies/${id}/associations/companies/${idCompany}`, [
      {
        associationCategory: 'HUBSPOT_DEFINED',
        associationTypeId: 450
      }
    ] );
  }

  async findCompanyByCodCliente ( cod_cliente: string ) {
    const response = await this.apiHbV3.post( `/objects/companies/search`, {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'cod_cliente',
              value: cod_cliente,
              operator: 'EQ'
            },
            {
              propertyName: 'destinatario',
              operator: 'NOT_HAS_PROPERTY'
            }
          ]
        }
      ]
    });
    return response.data?.results?.[0];
  }

  async findCompanyByCodClienteAndDestinatario ( cod_cliente: string, destinatario: string ) {
    const response = await this.apiHbV3.post( `/objects/companies/search`, {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'cod_cliente',
              value: cod_cliente,
              operator: 'EQ'
            },
            {
              propertyName: 'destinatario',
              value: destinatario,
              operator: 'EQ'
            }
          ]
        }
      ]
    });
    return response.data?.results?.[0];
  }

}
