import { Controller } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { Cart } from "entities/cart.entity";
import { CartService } from "src/services/cart/cart.service";




//params dodajemo zato sto crud metode prepoznaju samo id 
//koji je ovako definisan a kod nas se zove categoryId npr.

@Controller('api/cart')
@Crud({
    model: {
        type: Cart
    },
    params: {
        id: {
            field: 'cartId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            cartArticles: {
                eager: true
            },
            order: {
                eager: false
            }
        }
    }
})
export class CartController {
    constructor(
       public service: CartService
    ){}
}
