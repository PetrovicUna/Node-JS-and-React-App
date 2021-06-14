import { Body, Get, Param, Patch, Post, Put, SetMetadata, UseGuards } from "@nestjs/common";
import { Controller } from "@nestjs/common";
import { Administrator } from "src/entities/administrator.entity";
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { EditAdministratorDto } from "src/dtos/administrator/edit.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { RoleCheckedGuard } from "src/misc/role.checker.guard";

@Controller('api/administrator')
export class AdministratorController {
    constructor(
        private administratorService: AdministratorService
    ){}

    // https://localhost:3000/api/administrator/
    @Get() 
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    getAll(): Promise<Administrator[]> {
      return this.administratorService.getAll();
    }

    // https://localhost:3000/api/administrator/id/
    @Get(':id') 
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    getById( @Param('id') administratorId: number): Promise<Administrator | ApiResponse> {
      return new Promise(async (resolve) =>{
        let admin = await this.administratorService.getById(administratorId);

        if(admin === undefined){
          resolve(new ApiResponse("error", -1002));
        }
        resolve(admin);
      });
    }

    // POST https://localhost:3000/api/administrator/
    //@Body kaze da cemo koristiti telo http zahteva i da ocekujemo data koji je tipa AdminDTO
    @Post() 
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    add(@Body() data: AddAdministratorDto): Promise<Administrator | ApiResponse> {
        return this.administratorService.add(data);
    }

    // PATCH https://localhost:3000/api/administrator/id/
    @Patch(':id') 
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    edit(@Param('id') id: number, @Body() data: EditAdministratorDto): Promise<Administrator | ApiResponse> {
        return this.administratorService.editById(id, data);
    }
}