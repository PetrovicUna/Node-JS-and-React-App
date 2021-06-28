import * as Validator from 'class-validator';
import { ArticleSearchDeatureComponentDto } from './article.search.feature.component';

export class ArticleSearchDto {
    @Validator.IsOptional()
    @Validator.IsString()
    @Validator.Length(2, 128)
    keywords: string;

    @Validator.IsOptional()
    categoryId: number;

    @Validator.IsOptional()
    @Validator.IsPositive()
    @Validator.IsNumber({
        allowInfinity: false,
        allowNaN: false,
        maxDecimalPlaces: 2
    })
    priceMin: number;

    
    @Validator.IsOptional()
    @Validator.IsPositive()
    @Validator.IsNumber({
        allowInfinity: false,
        allowNaN: false,
        maxDecimalPlaces: 2
    })
    priceMax: number;


    features: ArticleSearchDeatureComponentDto[];

    @Validator.IsOptional()
    @Validator.IsIn(['name', 'price'])
    orderBy: 'name' | 'price';

    @Validator.IsOptional()
    @Validator.IsIn(['asc','desc'])
    orderDirection: 'asc' | 'desc';

    @Validator.IsOptional()
    @Validator.IsPositive()
    @Validator.IsNumber({
        allowInfinity: false,
        allowNaN: false,
        maxDecimalPlaces: 0,
    })
    page: number;

    @Validator.IsOptional()
    @Validator.IsIn([ 5, 10, 25, 50, 75])
    itemsPerPage: 5 | 10 | 25 | 50 | 75;
}