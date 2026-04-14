import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { FeatureStatus } from '../entities/product-feature.entity';

export class CreateFeatureDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FeatureStatus)
  status?: FeatureStatus;

  @IsUUID()
  productId!: string;

  @IsOptional()
  metadata?: {
    assignee?: string;
    priority?: 'low' | 'medium' | 'high';
    storyPoints?: number;
  };
}

export class UpdateFeatureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FeatureStatus)
  status?: FeatureStatus;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  metadata?: {
    assignee?: string;
    priority?: 'low' | 'medium' | 'high';
    storyPoints?: number;
  };
}
