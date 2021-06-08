import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Cart } from "entities/cart.entity";
import { Repository } from "typeorm";

@Injectable()
export class CartService extends TypeOrmCrudService<Cart>{
    constructor(
        @InjectRepository(Cart)
        private readonly cart: Repository<Cart>
    ) {
        super(cart);
    }
}