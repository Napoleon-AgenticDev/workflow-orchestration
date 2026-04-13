import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ExecutionsService } from './executions.service';

@Controller('executions')
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Get()
  findAll(@Body('workflowId') workflowId?: string) {
    return this.executionsService.findAll(workflowId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.executionsService.findOne(id);
  }

  @Post('execute')
  execute(@Body('workflowId') workflowId: string, @Body('input') input?: Record<string, any>) {
    return this.executionsService.execute(workflowId, input);
  }
}