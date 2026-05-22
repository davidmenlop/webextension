import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SAP_HUBSPOT_BPS_2 } from './models/empresas.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EmpresaSecundaria } from '../hubspot/models/empresa_secundaria.model';
import { EmpresaSecundariaService } from '../hubspot/empresa_secundaria.service';
import { LoggerService } from '../utils/logger.service';
import { SAP_HUBSPOT_REPORTE_VENTAS } from './models/ventas.model';
import { NegocioService } from '../hubspot/negocio.service';
import { Negocio } from '../hubspot/models/negocio.model';
import { EmpresaPrimariaService } from '../hubspot/empresa_primaria.service';
import { EmpresaPrimaria } from '../hubspot/models/empresa_primaria.model';

@Injectable()
export class SapService {

  constructor (
    @InjectRepository( SAP_HUBSPOT_BPS_2, 'FAZENDA' )
    private readonly _sapHbBpsRepository: Repository<SAP_HUBSPOT_BPS_2>,
    @InjectRepository( SAP_HUBSPOT_REPORTE_VENTAS, 'FAZENDA' )
    private readonly _sapHbVentasRepository: Repository<SAP_HUBSPOT_REPORTE_VENTAS>,
    private readonly _empresaSecundariaService: EmpresaSecundariaService,
    private readonly _empresaPrimariaService: EmpresaPrimariaService,
    private readonly _negocioService: NegocioService,
    private logger: LoggerService
  ) { }

  async queueSapEmpresasPrimarias () {
    this.logger.log( 'Queueing SAP empresas primarias' );

    const countEmpresasPrimarias = await this._empresaPrimariaService.obtenerCantidadEmpresasPrimarias();

    if ( countEmpresasPrimarias > 0 ) {
      return;
    }

    const results = await this._sapHbBpsRepository.createQueryBuilder( 'empresa' )
      .select( [
        'empresa.COD_CLIENTE',
        'empresa.NOMBRE',
        'empresa.CANAL_VENTA',
        'empresa.CONDICION_PAGO',
        'empresa.CREACION_BP',
        'empresa.CREACION_DM',
        'empresa.DESC_CANAL',
        'empresa.DESC_FRECUENCIA',
        'empresa.DESC_TIPOLOGIA',
        'empresa.DEST_POBLACION',
        'empresa.FRECUENCIA',
        'empresa.GRUPO_VENDEDORES',
        'empresa.IDENTIFICACION',
        'empresa.LISTA_PRECIOS',
        'empresa.OFICINA_VENTAS',
        'empresa.ORG_VENTAS',
        'empresa.POBLACION',
        'empresa.TELEOPERADOR',
        'empresa.TIPOLOGIA'
      ] )
      .groupBy( 'empresa.COD_CLIENTE' )
      .getMany();

    console.warn( results.length );

    const empresasPrimarias = results.map( result => {
      const empresa = new EmpresaSecundaria();
      empresa.COD_CLIENTE = result.COD_CLIENTE;
      empresa.NOMBRE = result.NOMBRE;
      empresa.CANAL_VENTA = result.CANAL_VENTA;
      empresa.CONDICION_PAGO = result.CONDICION_PAGO;
      empresa.CREACION_BP = result.CREACION_BP;
      empresa.CREACION_DM = result.CREACION_DM;
      empresa.DESC_CANAL = result.DESC_CANAL;
      empresa.DESC_FRECUENCIA = result.DESC_FRECUENCIA;
      empresa.DESC_TIPOLOGIA = result.DESC_TIPOLOGIA;
      empresa.DEST_POBLACION = result.DEST_POBLACION;
      empresa.FRECUENCIA = result.FRECUENCIA;
      empresa.GRUPO_VENDEDORES = result.GRUPO_VENDEDORES;
      empresa.IDENTIFICACION = result.IDENTIFICACION;
      empresa.LISTA_PRECIOS = result.LISTA_PRECIOS;
      empresa.OFICINA_VENTAS = result.OFICINA_VENTAS;
      empresa.ORG_VENTAS = result.ORG_VENTAS;
      empresa.POBLACION = result.POBLACION;
      empresa.TELEOPERADOR = result.TELEOPERADOR;
      empresa.TIPOLOGIA = result.TIPOLOGIA;
      return empresa;
    });

    console.warn( empresasPrimarias.length );

    const guardarEmpresasPrimariasEnLotes = async ( empresasPrimarias: EmpresaPrimaria[], batchSize: number = 1000 ): Promise<void> => {
      for ( let i = 0; i < empresasPrimarias.length; i += batchSize ) {
        const batch = empresasPrimarias.slice( i, i + batchSize );
        await this._empresaPrimariaService.guardarEmpresasPrimarias( batch );
      }
    };

    const processAndSaveEmpresasPrimarias = async ( empresasPrimarias: EmpresaPrimaria[] ): Promise<void> => {
      await guardarEmpresasPrimariasEnLotes( empresasPrimarias );
    };

    await processAndSaveEmpresasPrimarias( empresasPrimarias );
  }

  async queueSapEmpresasSecundarias () {
    this.logger.log( 'Queueing SAP empresas secundarias' );

    const countEmpresasSecundarias = await this._empresaSecundariaService.obtenerCantidadEmpresasSecundarias();

    if ( countEmpresasSecundarias > 0 ) {
      return;
    }

    const results = await this._sapHbBpsRepository.createQueryBuilder( 'empresa' )
      .select( [
        'empresa.COD_CLIENTE',
        'empresa.NOMBRE',
        'empresa.CANAL_VENTA',
        'empresa.CONDICION_PAGO',
        'empresa.CREACION_BP',
        'empresa.CREACION_DM',
        'empresa.DESC_CANAL',
        'empresa.DESC_FRECUENCIA',
        'empresa.DESC_TIPOLOGIA',
        'empresa.DEST_POBLACION',
        'empresa.DESTINATARIO',
        'empresa.FRECUENCIA',
        'empresa.GRUPO_VENDEDORES',
        'empresa.IDENTIFICACION',
        'empresa.LISTA_PRECIOS',
        'empresa.OFICINA_VENTAS',
        'empresa.ORG_VENTAS',
        'empresa.POBLACION',
        'empresa.TELEOPERADOR',
        'empresa.TIPOLOGIA'
      ] )
      .where( 'empresa.COD_CLIENTE <> empresa.DESTINATARIO' )
      .groupBy( 'empresa.DESTINATARIO' )
      .getMany();

    console.warn( results.length );

    const empresasSecundarias = results.map( result => {
      const empresa = new EmpresaSecundaria();
      empresa.COD_CLIENTE = result.COD_CLIENTE;
      empresa.NOMBRE = result.NOMBRE;
      empresa.CANAL_VENTA = result.CANAL_VENTA;
      empresa.CONDICION_PAGO = result.CONDICION_PAGO;
      empresa.CREACION_BP = result.CREACION_BP;
      empresa.CREACION_DM = result.CREACION_DM;
      empresa.DESC_CANAL = result.DESC_CANAL;
      empresa.DESC_FRECUENCIA = result.DESC_FRECUENCIA;
      empresa.DESC_TIPOLOGIA = result.DESC_TIPOLOGIA;
      empresa.DEST_POBLACION = result.DEST_POBLACION;
      empresa.DESTINATARIO = result.DESTINATARIO;
      empresa.FRECUENCIA = result.FRECUENCIA;
      empresa.GRUPO_VENDEDORES = result.GRUPO_VENDEDORES;
      empresa.IDENTIFICACION = result.IDENTIFICACION;
      empresa.LISTA_PRECIOS = result.LISTA_PRECIOS;
      empresa.OFICINA_VENTAS = result.OFICINA_VENTAS;
      empresa.ORG_VENTAS = result.ORG_VENTAS;
      empresa.POBLACION = result.POBLACION;
      empresa.TELEOPERADOR = result.TELEOPERADOR;
      empresa.TIPOLOGIA = result.TIPOLOGIA;
      return empresa;
    });

    console.warn( empresasSecundarias.length );

    const guardarEmpresasSecundariasEnLotes = async ( empresasSecundarias: EmpresaSecundaria[], batchSize: number = 1000 ): Promise<void> => {
      for ( let i = 0; i < empresasSecundarias.length; i += batchSize ) {
        const batch = empresasSecundarias.slice( i, i + batchSize );
        await this._empresaSecundariaService.guardarEmpresasSecundarias( batch );
      }
    };

    const processAndSaveEmpresasSecundarias = async ( empresasSecundarias: EmpresaSecundaria[] ): Promise<void> => {
      await guardarEmpresasSecundariasEnLotes( empresasSecundarias );
    };

    await processAndSaveEmpresasSecundarias( empresasSecundarias );
  }

  async queueSapVentas () {
    this.logger.log( 'Queueing SAP ventas' );

    const countNegocios = await this._negocioService.obtenerCantidadNegocios();

    if ( countNegocios > 0 ) {
      return;
    }

    const results = await this._sapHbVentasRepository.createQueryBuilder( 'facturacion' )
      .select( [
        'facturacion.DOC_FACTURACION',
        'facturacion.CLASE_FRA',
        'facturacion.TRANS_FACT',
        'facturacion.FACT_DIAN',
        'facturacion.ESTADO_TECN',
        'facturacion.ESTADO_TECN_TXT',
        'facturacion.FECHA_DOC',
        'facturacion.NRO_DOCUMENTO_FI',
        'facturacion.FECHA_FACT',
        'facturacion.COD_CLIENTE',
        'facturacion.NOMBRE',
        'facturacion.COD_DEST_MCIA',
        'facturacion.DESC_DEST_MCIA',
        'facturacion.ORG_VENTAS',
        'facturacion.DESC_ORG_VENTAS',
        'facturacion.CENTRO',
        'facturacion.DESCR_CENTRO',
        'facturacion.DESC_OF_VENTAS',
        'facturacion.GRU_VENDEDORES',
        'facturacion.DESC_GRUPO_VENDEDORES',
        'facturacion.COD_TELEOPERADOR',
        'facturacion.COND_PAGO',
        'facturacion.DESC_COND_PAGO',
        'facturacion.MATERIAL',
        'facturacion.DESC_MATERIAL',
        'facturacion.CANT',
        'facturacion.UND',
        'facturacion.CANT_KG',
        'facturacion.UND_2',
        'facturacion.VALOR_NETO',
        'facturacion.DSCTO',
        'facturacion.SUBTOTAL',
        'facturacion.IMPUESTO',
        'facturacion.TOTAL',
        'facturacion.DOC_REGION',
        'facturacion.REGION'
      ] )
      .getMany();

    console.warn( results.length );

    const sanitizeDate = ( date: string | Date ): Date | null => {
      if ( date === '0000-00-00' ) {
        return null;
      }
      return new Date( date );
    };

    const negocios = results.map( ( result ) => {
      const negocio = new Negocio();
      negocio.DOC_FACTURACION = result.DOC_FACTURACION;
      negocio.CLASE_FRA = result.CLASE_FRA;
      negocio.TRANS_FACT = result.TRANS_FACT;
      negocio.FACT_DIAN = result.FACT_DIAN;
      negocio.ESTADO_TECN = result.ESTADO_TECN;
      negocio.ESTADO_TECN_TXT = result.ESTADO_TECN_TXT;
      negocio.FECHA_DOC = sanitizeDate( result.FECHA_DOC );
      negocio.NRO_DOCUMENTO_FI = result.NRO_DOCUMENTO_FI;
      negocio.FECHA_FACT = sanitizeDate( result.FECHA_FACT );
      negocio.COD_CLIENTE = result.COD_CLIENTE;
      negocio.NOMBRE = result.NOMBRE;
      negocio.COD_DEST_MCIA = result.COD_DEST_MCIA;
      negocio.DESC_DEST_MCIA = result.DESC_DEST_MCIA;
      negocio.ORG_VENTAS = result.ORG_VENTAS;
      negocio.DESC_ORG_VENTAS = result.DESC_ORG_VENTAS;
      negocio.CENTRO = result.CENTRO;
      negocio.DESCR_CENTRO = result.DESCR_CENTRO;
      negocio.DESC_OF_VENTAS = result.DESC_OF_VENTAS;
      negocio.GRU_VENDEDORES = result.GRU_VENDEDORES;
      negocio.DESC_GRUPO_VENDEDORES = result.DESC_GRUPO_VENDEDORES;
      negocio.COD_TELEOPERADOR = result.COD_TELEOPERADOR;
      negocio.COND_PAGO = result.COND_PAGO;
      negocio.DESC_COND_PAGO = result.DESC_COND_PAGO;
      negocio.MATERIAL = result.MATERIAL;
      negocio.DESC_MATERIAL = result.DESC_MATERIAL;
      negocio.CANT = result.CANT;
      negocio.UND = result.UND;
      negocio.CANT_KG = result.CANT_KG;
      negocio.UND_2 = result.UND_2;
      negocio.VALOR_NETO = result.VALOR_NETO;
      negocio.DSCTO = result.DSCTO;
      negocio.SUBTOTAL = result.SUBTOTAL;
      negocio.IMPUESTO = result.IMPUESTO;
      negocio.TOTAL = result.TOTAL;
      negocio.DOC_REGION = result.DOC_REGION;
      negocio.REGION = result.REGION;

      return negocio;
    });

    const guardarNegociosEnLotes = async ( negocios: Negocio[], batchSize: number = 1000 ): Promise<void> => {
      for ( let i = 0; i < negocios.length; i += batchSize ) {
        const batch = negocios.slice( i, i + batchSize );
        await this._negocioService.guardarNegocios( batch );
      }
      return;
    };

    const processAndSaveNegocios = async ( negocios: Negocio[] ): Promise<void> => {
      await guardarNegociosEnLotes( negocios );
    };

    await processAndSaveNegocios( negocios );
  }
}
