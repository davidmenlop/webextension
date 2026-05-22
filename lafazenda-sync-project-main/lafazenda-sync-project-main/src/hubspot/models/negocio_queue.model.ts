import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity( )
export class DealQueue {
  @PrimaryColumn({ type: 'varchar', length: 250 })
  doc_facturacion: string;

  @PrimaryColumn({ type: 'varchar', length: 250 })
  material: string;

  @Column({ type: 'boolean', default: false })
  is_processed: boolean;

  @Column({ type: 'json', nullable: true })
  body: any;

  @Column({ type: 'json', nullable: true })
  bodyHb: any;

  @Column({ type: 'json', nullable: true })
  error: any;
}
