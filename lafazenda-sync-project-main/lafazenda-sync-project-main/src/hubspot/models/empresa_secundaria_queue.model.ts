import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity( )
export class SecondaryCompanyQueue {
  @Column({ type: 'varchar', length: 250 })
  cod_cliente: string;

  @PrimaryColumn({ type: 'varchar', length: 250 })
  destinatario: string;

  @Column({ type: 'boolean', default: false })
  is_processed: boolean;

  @Column({ type: 'json', nullable: true })
  body: any;

  @Column({ type: 'json', nullable: true })
  error: any;
}
