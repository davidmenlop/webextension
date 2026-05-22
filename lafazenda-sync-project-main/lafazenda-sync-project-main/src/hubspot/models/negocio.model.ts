import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Negocio {
  @PrimaryColumn({ type: 'varchar', length: 250 })
  DOC_FACTURACION: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  CLASE_FRA: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  TRANS_FACT: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  FACT_DIAN: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  ESTADO_TECN: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  ESTADO_TECN_TXT: string;

  @Column({ type: 'date', nullable: true })
  FECHA_DOC: Date;

  @Column({ type: 'varchar', length: 250, nullable: true })
  NRO_DOCUMENTO_FI: string;

  @Column({ type: 'date', nullable: true })
  FECHA_FACT: Date;

  @Column({ type: 'varchar', length: 250, nullable: true })
  COD_CLIENTE: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOMBRE: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  COD_DEST_MCIA: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESC_DEST_MCIA: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  ORG_VENTAS: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESC_ORG_VENTAS: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  CENTRO: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESCR_CENTRO: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESC_OF_VENTAS: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  GRU_VENDEDORES: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESC_GRUPO_VENDEDORES: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  COD_TELEOPERADOR: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  COND_PAGO: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESC_COND_PAGO: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  MATERIAL: string;

  @PrimaryColumn({ type: 'varchar', length: 250 })
  DESC_MATERIAL: string;

  @Column({ type: 'int', nullable: true })
  CANT: number;

  @Column({ type: 'varchar', length: 250, nullable: true })
  UND: string;

  @Column({ type: 'int', nullable: true })
  CANT_KG: number;

  @Column({ type: 'varchar', length: 250, nullable: true })
  UND_2: string;

  @Column({ type: 'decimal', nullable: true })
  VALOR_NETO: number;

  @Column({ type: 'decimal', nullable: true })
  DSCTO: number;

  @Column({ type: 'decimal', nullable: true })
  SUBTOTAL: number;

  @Column({ type: 'decimal', nullable: true })
  IMPUESTO: number;

  @Column({ type: 'decimal', nullable: true })
  TOTAL: number;

  @Column({ type: 'varchar', length: 250, nullable: true })
  DOC_REGION: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  REGION: string;
}
