import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  metadata?: {
    owner?: string;
    team?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  metadata?: {
    owner?: string;
    team?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}
