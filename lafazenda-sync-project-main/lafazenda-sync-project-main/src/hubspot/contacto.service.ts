import { Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { INTEGRATIONS } from '../utils/config/integrations.config';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class ContactoService {
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
  async getContacts ( ) {
    const properties = 'firstname,rut,region_de_chile,que_tipo_de_atencion_necesita_';
    const response = await this.apiHbV3.get( `/objects/contacts?properties=${properties}&limit=100` );// &after=10
    return response.data;
  }

  async createContact ( properties: any ) {
    const response = await this.apiHbV3.post( `/objects/contacts`, { properties
    });
    return response.data;
  }

  async updateContact ( properties: any, id: string ) {
    const response = await this.apiHbV3.patch( `/objects/contacts/${id}`, { properties
    });
    return response.data;
  }

  async findContactByEmail ( email: string ) {
    const response = await this.apiHbV3.post( `/objects/contacts/search`, {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }
          ]
        }
      ]
    });
    return response.data?.results?.[0];
  }

}
