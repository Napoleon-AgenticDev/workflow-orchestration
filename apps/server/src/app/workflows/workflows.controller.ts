import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsOptional, IsIn, IsNumber, Min, Max, IsString } from 'class-validator';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowNodesDto } from './dto/workflow.dto';

export class WorkflowQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'draft', 'paused'])
  status?: 'active' | 'draft' | 'paused';

  @IsOptional()
  @IsIn(['newest', 'oldest', 'name-asc', 'name-desc', 'status'])
  sortBy?: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

@Controller('workflows')
@UsePipes(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } }))
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  findAll(@Query() query: WorkflowQueryDto) {
    return this.workflowsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.delete(id);
  }

  @Put(':id/nodes')
  updateNodes(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WorkflowNodesDto) {
    return this.workflowsService.updateNodes(id, dto);
  }
}
