import { All, Body, Controller, Delete, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { Article } from "src/entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import { diskStorage} from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "src/entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";
import * as fileType from 'file-type';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { EditArticleDto } from "src/dtos/article/edit.article.dto";
import { RoleCheckedGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { ArticleSearchDto } from "src/dtos/article/article.search.dto";


//params dodajemo zato sto crud metode prepoznaju samo id 
//koji je ovako definisan a kod nas se zove articleId npr.

@Controller('api/article')
@Crud({
    model: {
        type: Article
    },
    params: {
        id: {
            field: 'articleId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            category: {
                eager: true
            },
            photos: {
                eager: true
            },
            articlePrices: {
                eager: true
            },
            articleFeatures: {
                eager: true
            },
            features: {
                eager: true 
            }
        }
    },
    routes: {
        only: [
            'getOneBase',
            'getManyBase',
        ],
        getOneBase: {
            decorators: [
                UseGuards(RoleCheckedGuard),
                AllowToRoles('administrator', 'user')
            ],
        },
        getManyBase: {
            decorators: [
                UseGuards(RoleCheckedGuard),
                AllowToRoles('administrator', 'user')
            ],
        },
    },
})
export class ArticleController {
    constructor(
       public service: ArticleService,
       public photoService: PhotoService,
    ){}

    @Post('createFull')
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @Patch(':id')
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    editFullArticle(@Param('id') id: number, @Body() data: EditArticleDto){
        return this.service.editFullArticle(id,data);
    }

    @Post(':id/uploadPhoto/') //POST http://localhost:3000/api/article/:id/uploadPhoto/
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photo.destination,
                filename: (req, file, callback) => {

                    let original = file.originalname;

                    let normalized = original.replace(/\s+/g, '-'); //bilo koji whitespace na globalnom nivou zameni sa crticom
                    normalized = normalized.replace(/[^A-z0-9\.\-]/g, '');

                    let now = new Date();

                    let datePart = '';
                    datePart += now.getFullYear().toString();
                    datePart += (now.getMonth() + 1).toString();
                    datePart += now.getDate().toString();

                    let randomPart: string =
                    new Array(10)
                        .fill(0)
                        .map(e => (Math.random() * 9).toFixed(0).toString())
                        .join('');

                    let fileName = datePart + '-' + randomPart + '-' + normalized;
                    fileName = fileName.toLocaleLowerCase();

                    callback(null, fileName);
                }
            }),
            fileFilter: (req, file, callback) => {
                // 1. Check ekstenzije: JPG, PNG
                if(!file.originalname.match(/\.(jpg|png)$/)){
                    req.fileFilterError = 'Bad file extension!';
                    callback(null, false);
                    return;
                }

                // 2. Check tipa sadrzaja: image/jpeg, image/png (mimetype)
                if(!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
                    req.fileFilterError = 'Bad file content!';
                    callback(null, false);
                    return;
                }

                callback(null, true);
            },
            limits: {
                files: 1,
                fileSize: StorageConfig.photo.maxSize,
            },
        })
    )
    async uploadPhoto(
        @Param('id') articleId: number, 
        @UploadedFile() photo,
        @Req() req
        ): Promise<ApiResponse | Photo>{

        if(req.fileFilterError){
            return new ApiResponse('error', -4002, req.fileFilterError);
        }

        if(!photo){
            return new ApiResponse('error', -4002, 'File not uploaded!');
        }

        const fileTypeResult = await fileType.fromFile(photo.path);
        if(!fileTypeResult){

            fs.unlinkSync(photo.path); //brisanje file

            return new ApiResponse('error', -4002, 'Cannot detect file type');
        }

        const realMimeType = fileTypeResult.mime;
        if(!(realMimeType.includes('jpeg') || realMimeType.includes('png'))) {

            fs.unlinkSync(photo.path);

            return new ApiResponse('error', -4002, 'Bad file content type!');
        }

        await this.createResizedImage(photo, StorageConfig.photo.resize.thumb);
        await this.createResizedImage(photo, StorageConfig.photo.resize.small)

        const newPhoto: Photo = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;

        const savedPhoto = await this.photoService.add(newPhoto);

        if(!savedPhoto){
            return new ApiResponse('error', -4001);
        }

        return savedPhoto;
    }

    async createResizedImage(photo, resizeSettings)
    {
        const originalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = 
            StorageConfig.photo.destination +
            resizeSettings.directory +
            fileName;

        await sharp(originalFilePath)
            .resize({
                fit: 'cover',
                width:  resizeSettings.width,
                height: resizeSettings.height,
            })
            .toFile(destinationFilePath);
    }

    // http://localhost:3000/api/article/1/deletePhoto/3
    @Delete(':articleId/deletePhoto/:photoId')
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator')
    public async deletePhoto(
        @Param('articleId') articleId: number,
        @Param('photoId') photoId: number
    ) {
        const photo = await this.photoService.findOne({
            articleId: articleId,
            photoId: photoId
        });

        if(!photo){
            return new ApiResponse('error', -4004, 'Photo not found!');
        }

        try{

            fs.unlinkSync(StorageConfig.photo.destination + photo.imagePath);
            fs.unlinkSync(StorageConfig.photo.destination + 
                        StorageConfig.photo.resize.thumb.directory +
                        photo.imagePath);
            fs.unlinkSync(StorageConfig.photo.destination + 
                        StorageConfig.photo.resize.small.directory +
                        photo.imagePath);
        }
        catch (e) {

        }
        
        const deleteResult = await this.photoService.deleteById(photoId);      
        
        if(deleteResult.affected === 0){
            return new ApiResponse('error', -4004, 'Photo not found!');
        }

        return new ApiResponse('ok', 0, 'One photo delete');

    }

    @Post('search')
    @UseGuards(RoleCheckedGuard)
    @AllowToRoles('administrator', 'user')
    async search(@Body() data: ArticleSearchDto): Promise<Article[]>{
        return await this.service.search(data);
    }
}