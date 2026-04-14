import { IsString, IsOptional, IsObject, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class TriggerDto {
  @IsString()
  type!: 'cron' | 'webhook' | 'manual' | 'event';

  @IsObject()
  config!: Record<string, any>;
}

class MetadataDto {
  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsString()
  status!: 'draft' | 'active' | 'paused';
}

export class CreateWorkflowDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @ValidateNested()
  @Type(() => TriggerDto)
  trigger!: TriggerDto;

  @ValidateNested()
  @Type(() => MetadataDto)
  @IsOptional()
  metadata?: MetadataDto;
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  trigger?: { type: 'cron' | 'webhook' | 'manual' | 'event'; config: Record<string, any> };

  @IsOptional()
  @IsObject()
  metadata?: MetadataDto;
}

export class NodeDto {
  @IsString()
  nodeId!: string;

  @IsString()
  type!: string;

  @IsNumber()
  positionX!: number;

  @IsNumber()
  positionY!: number;

  @IsObject()
  data!: Record<string, any>;
}

export class EdgeDto {
  @IsString()
  edgeId!: string;

  @IsString()
  source!: string;

  @IsString()
  target!: string;

  @IsOptional()
  @IsString()
  condition?: string;
}

export class WorkflowNodesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeDto)
  nodes!: NodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeDto)
  edges!: EdgeDto[];
}