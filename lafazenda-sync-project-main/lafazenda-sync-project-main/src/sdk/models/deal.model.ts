import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Contact } from './contact.model';

@Entity()
export class Deal {
    @PrimaryGeneratedColumn()
    id: string; //aqui el HS_OBJECT_ID de deal

    // @Column()
    // contactId: string; //aqui el HS_OBJECT_ID de contacto

    @ManyToOne( () => Contact, ( contact ) => contact.deals )
    contact: Contact; //aqui la relacion con contacto

    @Column()
    name: string;

}
