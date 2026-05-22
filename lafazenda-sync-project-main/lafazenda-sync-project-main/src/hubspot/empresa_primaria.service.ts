import { Injectable } from '@nestjs/common';
import { LoggerService } from '../utils/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EmpresaPrimaria } from './models/empresa_primaria.model';
import { Repository } from 'typeorm';

@Injectable()
export class EmpresaPrimariaService {

  constructor (
    @InjectRepository( EmpresaPrimaria )
    private readonly _empresaPrimariaRepository: Repository<EmpresaPrimaria>,
    private logger: LoggerService
  ) { }

  async obtenerCantidadEmpresasPrimarias () {

    try {
      return await this._empresaPrimariaRepository.count();
    } catch ( error ) {
      this.logger.error( error );
    }

  }

  async guardarEmpresasPrimarias ( empresasPrimarias: EmpresaPrimaria[] ) {
    try {
      await this._empresaPrimariaRepository.save( empresasPrimarias );
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async eliminarEmpresasPrimarias ( COD_CLIENTE: string ) {
    try {
      await this._empresaPrimariaRepository.delete({
        COD_CLIENTE
      });
    } catch ( error ) {
      this.logger.error( error );
    }
  }

  async obtenerEmpresasPrimariasParaColas () {
    try {
      return await this._empresaPrimariaRepository.find({
        take: 1
      });
    } catch ( error ) {
      this.logger.error( error );
    }
  }

}
