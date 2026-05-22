import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'SAP_HUBSPOT_BPS' })
export class SAP_HUBSPOT_BPS_2 {
  @Column()
  COD_CLIENTE: string;

  @Column()
  NOMBRE: string;

  @Column()
  CANAL_VENTA: string;

  @Column()
  CONDICION_PAGO: string;

  @Column()
  CREACION_BP: string;

  @Column()
  CREACION_DM: string;

  @Column()
  DESC_CANAL: string;

  @Column()
  DESC_FRECUENCIA: string;

  @Column()
  DESC_TIPOLOGIA: string;

  @Column()
  DEST_POBLACION: string;

  @PrimaryColumn()
  DESTINATARIO: string;

  @Column()
  FRECUENCIA: string;

  @Column()
  GRUPO_VENDEDORES: string;

  @Column()
  IDENTIFICACION: string;

  @Column()
  LISTA_PRECIOS: string;

  @Column()
  OFICINA_VENTAS: string;

  @Column()
  ORG_VENTAS: string;

  @Column()
  POBLACION: string;

  @Column()
  TELEOPERADOR: string;

  @Column()
  TIPOLOGIA: string;
}
