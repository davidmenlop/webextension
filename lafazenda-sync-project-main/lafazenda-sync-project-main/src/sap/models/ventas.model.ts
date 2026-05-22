import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'SAP_HUBSPOT_REPORTE_VENTAS' })
export class SAP_HUBSPOT_REPORTE_VENTAS {
  @PrimaryColumn({ type: 'varchar', length: 250 })
  DOC_FACTURACION: string;

  @Column({ type: 'varchar', length: 250 })
  CLASE_FRA: string;

  @Column({ type: 'varchar', length: 250 })
  TRANS_FACT: string;

  @Column({ type: 'varchar', length: 250 })
  FACT_DIAN: string;

  @Column({ type: 'varchar', length: 250 })
  ESTADO_TECN: string;

  @Column({ type: 'varchar', length: 250 })
  ESTADO_TECN_TXT: string;

  @Column({ type: 'date' })
  FECHA_DOC: Date;

  @Column({ type: 'varchar', length: 250 })
  NRO_DOCUMENTO_FI: string;

  @Column({ type: 'date' })
  FECHA_FACT: Date;

  @Column({ type: 'varchar', length: 250 })
  COD_CLIENTE: string;

  @Column({ type: 'varchar', length: 250 })
  NOMBRE: string;

  @Column({ type: 'varchar', length: 250 })
  COD_DEST_MCIA: string;

  @Column({ type: 'varchar', length: 250 })
  DESC_DEST_MCIA: string;

  @Column({ type: 'varchar', length: 250 })
  ORG_VENTAS: string;

  @Column({ type: 'varchar', length: 250 })
  DESC_ORG_VENTAS: string;

  @Column({ type: 'varchar', length: 250 })
  CENTRO: string;

  @Column({ type: 'varchar', length: 250 })
  DESCR_CENTRO: string;

  @Column({ type: 'varchar', length: 250 })
  DESC_OF_VENTAS: string;

  @Column({ type: 'varchar', length: 250 })
  GRU_VENDEDORES: string;

  @Column({ type: 'varchar', length: 250 })
  DESC_GRUPO_VENDEDORES: string;

  @Column({ type: 'varchar', length: 250 })
  COD_TELEOPERADOR: string;

  @Column({ type: 'varchar', length: 250 })
  COND_PAGO: string;

  @Column({ type: 'varchar', length: 250 })
  DESC_COND_PAGO: string;

  @Column({ type: 'varchar', length: 250 })
  MATERIAL: string;

  @PrimaryColumn({ type: 'varchar', length: 250 })
  DESC_MATERIAL: string;

  @Column({ type: 'int' })
  CANT: number;

  @Column({ type: 'varchar', length: 250 })
  UND: string;

  @Column({ type: 'int' })
  CANT_KG: number;

  @Column({ type: 'varchar', length: 250 })
  UND_2: string;

  @Column({ type: 'decimal' })
  VALOR_NETO: number;

  @Column({ type: 'decimal' })
  DSCTO: number;

  @Column({ type: 'decimal' })
  SUBTOTAL: number;

  @Column({ type: 'decimal' })
  IMPUESTO: number;

  @Column({ type: 'decimal' })
  TOTAL: number;

  @Column({ type: 'varchar', length: 250 })
  DOC_REGION: string;

  @Column({ type: 'varchar', length: 250 })
  REGION: string;
}
