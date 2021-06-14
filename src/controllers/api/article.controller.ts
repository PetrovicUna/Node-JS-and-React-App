import { Body, Controller, Param, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { Article } from "entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import { diskStorage} from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";
import * as fileType from 'file-type';
import * as fs from 'fs';
import * as sharp from 'sharp';


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
    }
})
export class ArticleController {
    constructor(
       public service: ArticleService,
       public photoService: PhotoService,
    ){}

    @Post('createFull')
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @Post(':id/uploadPhoto/') //POST http://localhost:3000/api/article/:id/uploadPhoto/
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photoDestination,
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
                fileSize: StorageConfig.photoMaxFileSize,
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

        await this.createThumb(photo);
        await this.createSmallImage(photo);

        const newPhoto: Photo = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;

        const savedPhoto = await this.photoService.add(newPhoto);

        if(!savedPhoto){
            return new ApiResponse('error', -4001);
        }

        return savedPhoto;
    }

    async createThumb(photo) {

        const originalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = StorageConfig.photoDestination + "thumb/" + fileName;

        await sharp(originalFilePath)
            .resize({
                fit: 'cover',
                width: StorageConfig.photoThumbSize.width,
                height: StorageConfig.photoThumbSize.height,
                background: {
                    r: 255, g: 255, b: 255, alpha: 0.0
                }
            })
            .toFile(destinationFilePath);
    }

    
    async createSmallImage(photo) {

        const originalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = StorageConfig.photoDestination + "small/" + fileName;

        await sharp(originalFilePath)
            .resize({
                fit: 'cover',
                width: StorageConfig.photoSmallSize.width,
                height: StorageConfig.photoSmallSize.height,
                background: {
                    r: 255, g: 255, b: 255, alpha: 0.0
                }
            })
            .toFile(destinationFilePath);
    }
}