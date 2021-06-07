import {Entity, PrimaryGeneratedColumn, Column} from "typeorm"; 


//ovim smo rekli da je Administrator entitet odnosno model
@Entity()
export class Administrator {
    @PrimaryGeneratedColumn({ name: 'administrator_id', type: 'int', unsigned: true}) 
    //primaryGeneratedColumn za primarni kljuc se koristi ukoliko nam je u bazi autoinkrement vrednost
    administratorId: number;

    @Column({type: 'varchar', length: '32', unique: true})
    username: string;

    @Column({name: 'password_hash', type: 'varchar', length: '128', unique: true})
    password: string;
}
