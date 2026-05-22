import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Deal } from './deal.model';

@Entity()
export class Contact {
    @PrimaryGeneratedColumn()
    id: number; //aqui el HS_OBJECT_ID del contacto

    @Column()
    name: string;

    @OneToMany( () => Deal, ( deal ) => deal.contact )
    deals: Deal[];

}
