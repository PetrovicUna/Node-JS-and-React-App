export class LoginInfoAdministratorDto {
   amdinistratorId: number;
   username: string;
   token: string;

   constructor(id: number, un: string, jwt:string)
   {
       this.amdinistratorId = id;
       this.username = un;
       this.token = jwt;
   }
}