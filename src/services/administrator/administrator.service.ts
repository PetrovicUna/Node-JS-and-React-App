import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { timeStamp } from 'console';
import { Administrator } from 'entities/administrator.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdministratorService {
    constructor(
        @InjectRepository(Administrator)
        private readonly administrator : Repository<Administrator>
    ) {}

    //nasa funkcija treba da vrati obecanje da ce vratiti niz administratora 
    getAll(): Promise<Administrator[]> {
        return this.administrator.find();
    }

    //nasa funkcija treba da vrati odredjenog administratora po Id-ju
    getById(id: number): Promise<Administrator>{
        return this.administrator.findOne(id);
    }
}
