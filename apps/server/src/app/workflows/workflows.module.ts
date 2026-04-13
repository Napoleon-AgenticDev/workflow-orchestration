import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/node.entity';
import { WorkflowEdge } from './entities/edge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowNode, WorkflowEdge])],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}