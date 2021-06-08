import { Body, Get, Param, Post, Put } from "@nestjs/common";
import { Controller } from "@nestjs/common";
import { Administrator } from "entities/administrator.entity";
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { EditAdministratorDto } from "src/dtos/administrator/edit.administrator.dto";
import { AdministratorService } from "src/services/administrator/administrator.service";

@Controller('api/administrator')
export class AdministratorController {
    constructor(
        private administratorService: AdministratorService
    ){}

    // https://localhost:3000/api/administrator/
    @Get() 
    getAll(): Promise<Administrator[]> {
      return this.administratorService.getAll();
    }

    // https://localhost:3000/api/administrator/id/
    @Get(':id') 
    getById( @Param('id') administratorId: number): Promise<Administrator> {
      return this.administratorService.getById(administratorId);
    }

    // PUT https://localhost:3000/api/administrator/
    //@Body kaze da cemo koristiti telo http zahteva i da ocekujemo data koji je tipa AdminDTO
    @Put() 
    add(@Body() data: AddAdministratorDto): Promise<Administrator> {
        return this.administratorService.add(data);
    }

    // POST https://localhost:3000/api/administrator/id/
    @Post(':id') 
    edit(@Param('id') id: number, @Body() data: EditAdministratorDto): Promise<Administrator> {
        return this.administratorService.editById(id, data);
    }
}