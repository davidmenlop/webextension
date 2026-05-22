import axios from 'axios';
import { CONFIG } from './enviroment.config';

class Integrations {
  constructor () {}

  public databaseProviders = [];

  public hubspot = {
    apiAuthV1: axios.create({
      baseURL: 'https://api.hubapi.com/oauth/v1',
      headers: {
        // Authorization: `Bearer ${CONFIG.integrations.hubspot.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    }),
    apiV1: axios.create({
      baseURL: 'https://api.hubapi.com/email/public/v1',
      headers: {
        Authorization: `Bearer ${CONFIG.integrations.hubspot.apiKey}`
      }
    }),
    apiV3: axios.create({
      baseURL: 'https://api.hubapi.com/crm/v3',
      headers: {
        Authorization: `Bearer ${CONFIG.integrations.hubspot.apiKey}`
      }
    }),
    apiFilesV3: axios.create({
      baseURL: 'https://api.hubapi.com/files/v3',
      headers: {
        Authorization: `Bearer ${CONFIG.integrations.hubspot.apiKey}`
      }
    }),
    apiV4: axios.create({
      baseURL: 'https://api.hubapi.com/crm/v4',
      headers: {
        Authorization: `Bearer ${CONFIG.integrations.hubspot.apiKey}`
      }
    })
  };

}

export const INTEGRATIONS = new Integrations();
