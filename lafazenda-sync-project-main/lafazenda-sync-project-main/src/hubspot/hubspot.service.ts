import { Injectable } from '@nestjs/common';
import { LoggerService } from '../utils/logger.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CONFIG } from '../utils/config/enviroment.config';
import { EmpresaSecundariaService } from './empresa_secundaria.service';
import { CompanyService } from './empresa.service';
import { InjectRepository } from '@nestjs/typeorm';
import { SecondaryCompanyQueue } from './models/empresa_secundaria_queue.model';
import { Repository } from 'typeorm';
import { NegocioService } from './negocio.service';
import { DealQueue } from './models/negocio_queue.model';
import { EmpresaPrimariaService } from './empresa_primaria.service';
import { PrimaryCompanyQueue } from './models/empresa_primaria_queue.model';

@Injectable()
export class HubspotService {
  constructor (
    @InjectQueue( CONFIG.integrations.hubspotQueue.empresaPrimaria )
    private empresaPrimariaQueue: Queue,
    private empresaPrimariaService: EmpresaPrimariaService,
    @InjectRepository( PrimaryCompanyQueue )
    private _primaryCompanyQueueRepository: Repository<PrimaryCompanyQueue>,
    @InjectQueue( CONFIG.integrations.hubspotQueue.empresaSecundaria )
    private empresaSecundariaQueue: Queue,
    private empresaSecundariaService: EmpresaSecundariaService,
    private companyService: CompanyService,
    @InjectRepository( SecondaryCompanyQueue )
    private _secondaryCompanyQueueRepository: Repository<SecondaryCompanyQueue>,
    @InjectRepository( DealQueue )
    private _negocioQueueRepository: Repository<DealQueue>,
    @InjectQueue( CONFIG.integrations.hubspotQueue.negocio )
    private negocioQueue: Queue,
    private negocioService: NegocioService,
    private logger: LoggerService
  ) { }

  async updateQueueHubspotPrimaryCompanies () {
    const countQueue = await this.empresaPrimariaQueue.getWaitingCount();
    if ( countQueue > 0 ) {
      return;
    }
    const results = await this.empresaPrimariaService.obtenerEmpresasPrimariasParaColas();
    for ( const item of results ) {
      await this.queueEmpresaPrimaria( item, item.COD_CLIENTE );
      await this.empresaPrimariaService.eliminarEmpresasPrimarias( item.COD_CLIENTE );
    }
  }

  async queueEmpresaPrimaria ( data: any, objectId: string ) {
    this.logger.log( '[EXTERNAL] Encolando!!', 'queueEmpresaPrimaria' );
    await this.empresaPrimariaQueue.add( objectId, data, { delay: 5000 });
    return {
      status: 'ok',
      data
    };
  }

  async processEmpresaPrimaria ( data: any ) {
    console.warn( 'ACCION DE PROCESAR EMPRESAS PRIMARIAS' );
    // {
    //   COD_CLIENTE: '0100003949',
    //   NOMBRE: '19-60 SAS',
    //   CANAL_VENTA: '1C',
    //   CONDICION_PAGO: 'D000',
    //   CREACION_BP: null,
    //   CREACION_DM: null,
    //   DESC_CANAL: 'Canal Institucional',
    //   DESC_FRECUENCIA: 'Norte',
    //   DESC_TIPOLOGIA: 'RESTAURANTE GOURMET',
    //   DEST_POBLACION: 'Bogota',
    //   FRECUENCIA: '01',
    //   GRUPO_VENDEDORES: 'P65',
    //   IDENTIFICACION: '9012348370',
    //   LISTA_PRECIOS: 'B2',
    //   OFICINA_VENTAS: 'P002',
    //   ORG_VENTAS: '1100',
    //   POBLACION: 'Bogota',
    //   TELEOPERADOR: '',
    //   TIPOLOGIA: '13'
    // }

    try {
      function formatDate ( dateString: string ): string {
        if ( !dateString ) return null;
        const year = dateString.substring( 0, 4 );
        const month = dateString.substring( 4, 6 );
        const day = dateString.substring( 6, 8 );
        return `${year}-${month}-${day}`;
      }

      const properties = {
        ...data
      };
      properties.CREACION_BP = formatDate( properties.CREACION_BP );
      properties.CREACION_DM = formatDate( properties.CREACION_DM );

      const currentCompany = await this.companyService.findCompanyByCodCliente( data.COD_CLIENTE );

      if ( currentCompany ) {
        await this.companyService.updateCompany( this.convalidarPropiedades( properties ), currentCompany.id );
      } else {
        await this.companyService.createCompany( this.convalidarPropiedades( properties ) );

      }

      await this._primaryCompanyQueueRepository.save({
        cod_cliente: properties.COD_CLIENTE,
        is_processed: true,
        body: properties,
        error: null
      });

    } catch ( error ) {
      let errorData: any;

      if ( error.isAxiosError && error.response && error.response.data ) {
        errorData = error.response.data;
      } else {
        errorData = { message: error.message, stack: error.stack };
      }

      await this._primaryCompanyQueueRepository.save({
        cod_cliente: data.COD_CLIENTE,
        is_processed: false,
        body: data,
        error: errorData
      });
      throw error;
    }
    return ;
  }

  async updateQueueHubspotSecondaryCompanies () {
    const countQueue = await this.empresaSecundariaQueue.getWaitingCount();
    if ( countQueue > 0 ) {
      return;
    }
    const results = await this.empresaSecundariaService.obtenerEmpresasSecundariasParaColas();
    for ( const item of results ) {
      await this.queueEmpresaSecundaria( item, item.DESTINATARIO );
      await this.empresaSecundariaService.eliminarEmpresasSecundarias( item.DESTINATARIO );
    }
  }

  async queueEmpresaSecundaria ( data: any, objectId: string ) {
    this.logger.log( '[EXTERNAL] Encolando!!', 'queueEmpresaSecundaria' );
    await this.empresaSecundariaQueue.add( objectId, data, { delay: 7000 });
    return {
      status: 'ok',
      data
    };
  }

  convalidarPropiedades ( data: any ) {
    return {
      cod_cliente: data.COD_CLIENTE,
      name: data.NOMBRE,
      canal_venta: data.CANAL_VENTA,
      condicion_pago: data.CONDICION_PAGO,
      creacion_bp: data.CREACION_BP,
      creacion_dm: data.CREACION_DM,
      desc_canal: data.DESC_CANAL,
      desc_frecuencia: data.DESC_FRECUENCIA,
      desc_tipologia: data.DESC_TIPOLOGIA,
      dest_poblacion: data.DEST_POBLACION,
      destinatario: data.DESTINATARIO || null,
      frecuencia: data.FRECUENCIA,
      grupo_vendedores: data.GRUPO_VENDEDORES,
      identificacion: data.IDENTIFICACION,
      lista_precios: data.LISTA_PRECIOS,
      oficina_ventas: data.OFICINA_VENTAS,
      org_ventas: data.ORG_VENTAS,
      poblacion: data.POBLACION,
      teleoperador: data.TELEOPERADOR,
      tipologia: data.TIPOLOGIA
    };
  }

  async processEmpresaSecundaria ( data: any ) {
    console.warn( 'ACCION DE PROCESAR EMPRESAS SECUNDARIAS' );
    // {
    //   COD_CLIENTE: '0100003949',
    //   NOMBRE: '19-60 SAS',
    //   CANAL_VENTA: '1C',
    //   CONDICION_PAGO: 'D000',
    //   CREACION_BP: null,
    //   CREACION_DM: null,
    //   DESC_CANAL: 'Canal Institucional',
    //   DESC_FRECUENCIA: 'Norte',
    //   DESC_TIPOLOGIA: 'RESTAURANTE GOURMET',
    //   DEST_POBLACION: 'Bogota',
    //   DESTINATARIO: '0030000001',
    //   FRECUENCIA: '01',
    //   GRUPO_VENDEDORES: 'P65',
    //   IDENTIFICACION: '9012348370',
    //   LISTA_PRECIOS: 'B2',
    //   OFICINA_VENTAS: 'P002',
    //   ORG_VENTAS: '1100',
    //   POBLACION: 'Bogota',
    //   TELEOPERADOR: '',
    //   TIPOLOGIA: '13'
    // }

    try {
      const obtenerEmpresaPrincipal = await this.companyService.findCompanyByCodCliente( data.COD_CLIENTE );

      if ( !obtenerEmpresaPrincipal ) {
        this.logger.error( 'No se encontro la empresa principal' );
        await this._secondaryCompanyQueueRepository.save({
          cod_cliente: data.COD_CLIENTE,
          destinatario: data.DESTINATARIO,
          is_processed: false,
          body: data,
          error: { message: 'No se encontro la empresa principal' }
        });
        return;
      }

      function formatDate ( dateString: string ): string {
        if ( !dateString ) return null;
        const year = dateString.substring( 0, 4 );
        const month = dateString.substring( 4, 6 );
        const day = dateString.substring( 6, 8 );
        return `${year}-${month}-${day}`;
      }

      const properties = {
        ...data
      };
      properties.CREACION_BP = formatDate( properties.CREACION_BP );
      properties.CREACION_DM = formatDate( properties.CREACION_DM );

      const currentCompany = await this.companyService.findCompanyByCodClienteAndDestinatario( properties.COD_CLIENTE, properties.DESTINATARIO );

      if ( currentCompany ) {
        await this.companyService.updateCompany( this.convalidarPropiedades( properties ), currentCompany.id );
      } else {
        const createdCompany = await this.companyService.createCompany( this.convalidarPropiedades( properties ) );
        await this.companyService.asociationCompanyToCompany( obtenerEmpresaPrincipal.id, createdCompany.id );
      }

      await this._secondaryCompanyQueueRepository.save({
        cod_cliente: properties.COD_CLIENTE,
        destinatario: properties.DESTINATARIO,
        is_processed: true,
        body: properties,
        error: null
      });

    } catch ( error ) {
      let errorData: any;

      if ( error.isAxiosError && error.response && error.response.data ) {
        errorData = error.response.data;
      } else {
        errorData = { message: error.message, stack: error.stack };
      }

      await this._secondaryCompanyQueueRepository.save({
        cod_cliente: data.COD_CLIENTE,
        destinatario: data.DESTINATARIO,
        is_processed: false,
        body: data,
        error: errorData
      });
      throw error;
    }
    return ;
  }

  async updateQueueHubspotDeals () {
    const countQueue = await this.negocioQueue.getWaitingCount();
    if ( countQueue > 0 ) {
      return;
    }
    const results = await this.negocioService.obtenerNegociosParaColas();
    for ( const item of results ) {
      await this.queueNegocio( item, `${item.DOC_FACTURACION}_${item.MATERIAL}` );
      // await this.negocioService.eliminarNegocio( item.DOC_FACTURACION, item.MATERIAL );
    }
  }

  async queueNegocio ( data: any, objectId: string ) {
    this.logger.log( '[EXTERNAL] Encolando!!', 'queueNegocio' );
    await this.negocioQueue.add( objectId, data, { delay: 2000 });
    return {
      status: 'ok',
      data
    };
  }

  convalidarPropiedadesNegocio ( data: any ) {

    const facturas = [
      'ZDON',
      'ZKB',
      'ZKE',
      'ZNCM',
      'ZPOB',
      'ZPV0',
      'ZPV1',
      'ZPV2',
      'ZPV3',
      'ZPVS',
      'ZVPV'
    ];

    const notasCredito = [
      'ZAD1',
      'ZCVI',
      'ZKA',
      'ZKD',
      'ZNCP',
      'ZNCR',
      'ZNCV',
      'ZVDV'
    ];

    let dealstage: any;

    if ( facturas.includes( data.CLASE_FRA ) ) {
      dealstage = 981747307; // FACTURADO
    } else if ( notasCredito.includes( data.CLASE_FRA ) ) {
      dealstage = 988485921; // NOTA DE CREDITO
    } else {
      throw new Error( `No hay opción para la clase de documento: ${data.CLASE_FRA}` );
    }

    return {
      doc_facturacion: data.DOC_FACTURACION,
      clase_fra: data.CLASE_FRA,
      trans_fact: data.TRANS_FACT,
      fact_dian: data.FACT_DIAN,
      estado_tecn: data.ESTADO_TECN,
      estado_tecn_txt: data.ESTADO_TECN_TXT,
      fecha_doc: data.FECHA_DOC,
      nro_documento_fi: data.NRO_DOCUMENTO_FI,
      fecha_fact: data.FECHA_FACT,
      cod_cliente: data.COD_CLIENTE,
      dealname: `${data.DOC_FACTURACION} - ${data.DESC_DEST_MCIA} - ${data.DESC_MATERIAL}`,
      cod_dest_mcia: data.COD_DEST_MCIA,
      desc_dest_mcia: data.DESC_DEST_MCIA,
      org_ventas: data.ORG_VENTAS,
      desc_org_ventas: data.DESC_ORG_VENTAS,
      centro: data.CENTRO,
      descr_centro: data.DESCR_CENTRO,
      desc_of_ventas: data.DESC_OF_VENTAS,
      gru_vendedores: data.GRU_VENDEDORES,
      desc_grupo_vendedores: data.DESC_GRUPO_VENDEDORES,
      cod_teleoperador: data.COD_TELEOPERADOR,
      cond_pago: data.COND_PAGO,
      desc_cond_pago: data.DESC_COND_PAGO,
      material: data.MATERIAL,
      desc_material: data.DESC_MATERIAL,
      cant: data.CANT,
      und: data.UND,
      cant_kg: data.CANT_KG,
      und_2: data.UND_2,
      valor_neto: data.VALOR_NETO,
      dscto: data.DSCTO,
      subtotal: data.SUBTOTAL,
      impuesto: data.IMPUESTO,
      // total: data.TOTAL,
      doc_region: data.DOC_REGION,
      region: data.REGION,
      pipeline: 668461849,
      imported_sap: 'DBSYNC',
      dealstage // 988485921 - NOTA DE CREDITO (FACTURACIÓN LAFAZENDA), 981747307 - FACTURADO (FACTURACIÓN LAFAZENDA), 988485922 - NOTA DE DEBITO (FACTURACIÓN LAFAZENDA)
    };
  }

  async processNegocio ( data: any ) {
    console.warn( 'ACCION DE PROCESAR NEGOCIOS', data );

    // {
    //   DOC_FACTURACION: '0090000198',
    //   CLASE_FRA: 'ZPV1',
    //   TRANS_FACT: 'VF01',
    //   FACT_DIAN: '105010',
    //   ESTADO_TECN: 'EE',
    //   ESTADO_TECN_TXT: 'Emitido electrónicamente',
    //   FECHA_DOC: '2023-05-04',
    //   NRO_DOCUMENTO_FI: '3300000015',
    //   FECHA_FACT: '2023-05-04',
    //   COD_CLIENTE: '0100000891',
    //   NOMBRE: 'CARNES VENADO GRIS S.A.S.',
    //   COD_DEST_MCIA: '0030004616',
    //   DESC_DEST_MCIA: 'CN-DE-CARNES VENADO GRIS S.A.S',
    //   ORG_VENTAS: '1100',
    //   DESC_ORG_VENTAS: 'PORCICULTURA',
    //   CENTRO: '1050',
    //   DESCR_CENTRO: 'DISTRIBUIDORA BOGOTA',
    //   DESC_OF_VENTAS: 'OFELIA MOLINA',
    //   GRU_VENDEDORES: 'P06',
    //   DESC_GRUPO_VENDEDORES: 'EYDI ROJAS',
    //   COD_TELEOPERADOR: '02',
    //   COND_PAGO: 'D000',
    //   DESC_COND_PAGO: 'Pago Contado',
    //   MATERIAL: '250100',
    //   DESC_MATERIAL: 'BRAZO SIN GARRA Y SIN HUESO',
    //   CANT: 16,
    //   UND: 'UN',
    //   CANT_KG: 68,
    //   UND_2: 'KG',
    //   VALOR_NETO: '1202212',
    //   DSCTO: '0',
    //   SUBTOTAL: '1202212',
    //   IMPUESTO: '0',
    //   TOTAL: '1202212',
    //   DOC_REGION: 'CO0005',
    //   REGION: 'Bogotá'
    // }

    // TODO: AQUI ASOCIAR A LA EMPRESA SECUNDARIA CON LOS CAMPOS DESTINATARIO Y COD_DEST_MCIA

    try {

      const obtenerEmpresaSecundaria = await this.companyService.findCompanyByCodClienteAndDestinatario( data.COD_CLIENTE, data.COD_DEST_MCIA );

      if ( !obtenerEmpresaSecundaria ) {
        this.logger.error( 'No se encontro la empresa secundaria' );
        await this._negocioQueueRepository.save({
          doc_facturacion: data.DOC_FACTURACION,
          material: data.MATERIAL,
          is_processed: false,
          body: data,
          bodyHb: null,
          error: { message: 'No se encontro la empresa secundaria' }
        });
        return;
      }

      const obtenerNegocio = await this.negocioService.findDealByDocFacturacion( data.DOC_FACTURACION, data.MATERIAL );

      const properties = this.convalidarPropiedadesNegocio( data );

      if ( obtenerNegocio ) {
        await this.negocioService.updateDeal( properties, obtenerNegocio.id );
      } else {
        const dealCreated = await this.negocioService.createDeal( properties );
        await this.negocioService.asociationDealToCompany( dealCreated.id, obtenerEmpresaSecundaria.id );
      }

      await this._negocioQueueRepository.save({
        doc_facturacion: data.DOC_FACTURACION,
        material: data.MATERIAL,
        is_processed: true,
        body: data,
        bodyHb: properties,
        error: null
      });

    } catch ( error ) {
      let errorData: any;

      if ( error.isAxiosError && error.response && error.response.data ) {
        errorData = error.response.data;
      } else {
        errorData = { message: error.message, stack: error.stack };
      }

      await this._negocioQueueRepository.save({
        doc_facturacion: data.DOC_FACTURACION,
        material: data.MATERIAL,
        is_processed: false,
        body: data,
        bodyHb: null,
        error: errorData
      });
      throw error;
    }
  }
}
