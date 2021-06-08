import { Controller, Get } from '@nestjs/common';
import { Administrator } from 'entities/administrator.entity';
import { AdministratorService } from './services/administrator/administrator.service';

@Controller()
export class AppController {
  constructor(
    private administratorService: AdministratorService
  ) {}
  @Get() // http://localhost:3000/
  getHello(): string {
    return 'Hello World!';
  }

  @Get('/api/administrator')
  getAllAdmins(): Promise<Administrator[]> {
    return this.administratorService.getAll();
  }
}
