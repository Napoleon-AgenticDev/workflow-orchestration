import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';
import { Execution } from './entities/execution.entity';
import { ExecutionNode } from './entities/execution-node.entity';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution, ExecutionNode]),
    WorkflowsModule,
  ],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}