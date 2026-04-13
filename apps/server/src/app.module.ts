import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsModule } from './workflows/workflows.module';
import { ExecutionsModule } from './executions/executions.module';
import { SchedulesModule } from './schedules/schedules.module';
import { SeederService } from './seeder.service';
import { Workflow } from './workflows/entities/workflow.entity';
import { WorkflowNode } from './workflows/entities/node.entity';
import { WorkflowEdge } from './workflows/entities/edge.entity';
import { Execution } from './executions/entities/execution.entity';
import { ExecutionNode } from './executions/entities/execution-node.entity';
import { Schedule } from './schedules/entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'alchemy_flow',
      entities: [Workflow, WorkflowNode, WorkflowEdge, Execution, ExecutionNode, Schedule],
      synchronize: true,
    }),
    WorkflowsModule,
    ExecutionsModule,
    SchedulesModule,
  ],
  providers: [SeederService],
})
export class AppModule {}