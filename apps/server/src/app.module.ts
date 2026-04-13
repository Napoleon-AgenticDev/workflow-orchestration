import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsModule } from './app/workflows/workflows.module';
import { ExecutionsModule } from './app/executions/executions.module';
import { SchedulesModule } from './app/schedules/schedules.module';
import { SeederService } from './app/seeder.service';
import { Workflow } from './app/workflows/entities/workflow.entity';
import { WorkflowNode } from './app/workflows/entities/node.entity';
import { WorkflowEdge } from './app/workflows/entities/edge.entity';
import { Execution } from './app/executions/entities/execution.entity';
import { ExecutionNode } from './app/executions/entities/execution-node.entity';
import { Schedule } from './app/schedules/entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      username: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || '',
      database: process.env['DB_NAME'] || 'postgres',
      entities: [Workflow, WorkflowNode, WorkflowEdge, Execution, ExecutionNode, Schedule],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Workflow, WorkflowNode, WorkflowEdge]),
    WorkflowsModule,
    ExecutionsModule,
    SchedulesModule,
  ],
  providers: [SeederService],
})
export class AppModule {}