import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class EmpresaPrimaria {
  @PrimaryColumn()
  COD_CLIENTE: string;

  @Column()
  NOMBRE: string;

  @Column({ nullable: true })
  CANAL_VENTA: string;

  @Column({ nullable: true })
  CONDICION_PAGO: string;

  @Column({ nullable: true })
  CREACION_BP: string;

  @Column({ nullable: true })
  CREACION_DM: string;

  @Column({ nullable: true })
  DESC_CANAL: string;

  @Column({ nullable: true })
  DESC_FRECUENCIA: string;

  @Column({ nullable: true })
  DESC_TIPOLOGIA: string;

  @Column({ nullable: true })
  DEST_POBLACION: string;

  @Column({ nullable: true })
  FRECUENCIA: string;

  @Column({ nullable: true })
  GRUPO_VENDEDORES: string;

  @Column({ nullable: true })
  IDENTIFICACION: string;

  @Column({ nullable: true })
  LISTA_PRECIOS: string;

  @Column({ nullable: true })
  OFICINA_VENTAS: string;

  @Column({ nullable: true })
  ORG_VENTAS: string;

  @Column({ nullable: true })
  POBLACION: string;

  @Column({ nullable: true })
  TELEOPERADOR: string;

  @Column({ nullable: true })
  TIPOLOGIA: string;
}
