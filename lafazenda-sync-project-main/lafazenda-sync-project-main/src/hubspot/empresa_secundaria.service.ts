import { Injectable } from '@nestjs/common';
import { LoggerService } from '../utils/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EmpresaSecundaria } from './models/empresa_secundaria.model';
import { Repository } from 'typeorm';

@Injectable()
export class EmpresaSecundariaService {

  constructor (
    @InjectRepository( EmpresaSecundaria )
    private readonly _empresaSecundariaRepository: Repository<EmpresaSecundaria>,
    private logger: LoggerService
  ) { }

  async obtenerCantidadEmpresasSecundarias () {

    try {
      return await this._empresaSecundariaRepository.count();
    } catch ( error ) {
      this.logger.error( error );
    }

  }

  async guardarEmpresasSecundarias ( empresasSecundarias: EmpresaSecundaria[] ) {
    try {
      await this._empresaSecundariaRepository.save( empresasSecundarias );
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async eliminarEmpresasSecundarias ( DESTINATARIO: string ) {
    try {
      await this._empresaSecundariaRepository.delete({
        DESTINATARIO
      });
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async obtenerEmpresasSecundariasParaColas () {
    try {
      return await this._empresaSecundariaRepository.find({
        take: 1
      });
    } catch ( error ) {
      this.logger.error( error );
    }
  }

}
