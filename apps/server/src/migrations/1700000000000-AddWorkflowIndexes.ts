import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddWorkflowIndexes1700000000000 implements MigrationInterface {
  name = 'AddWorkflowIndexes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for workflow queries
    await queryRunner.createIndex(
      'workflow',
      new TableIndex({
        name: 'IDX_workflow_metadata_status',
        columnNames: ['metadata'],
        isUnique: false,
        using: 'GIN',
      })
    );

    // Add index for name search
    await queryRunner.createIndex(
      'workflow',
      new TableIndex({
        name: 'IDX_workflow_name',
        columnNames: ['name'],
        isUnique: false,
      })
    );

    // Add index for updatedAt sorting
    await queryRunner.createIndex(
      'workflow',
      new TableIndex({
        name: 'IDX_workflow_updated_at',
        columnNames: ['updatedAt'],
        isUnique: false,
      })
    );

    // Add index for createdAt
    await queryRunner.createIndex(
      'workflow',
      new TableIndex({
        name: 'IDX_workflow_created_at',
        columnNames: ['createdAt'],
        isUnique: false,
      })
    );

    // Add composite index for workflow nodes
    await queryRunner.createIndex(
      'workflow_node',
      new TableIndex({
        name: 'IDX_workflow_node_workflow_type',
        columnNames: ['workflowId', 'type'],
        isUnique: false,
      })
    );

    // Add composite index for workflow edges
    await queryRunner.createIndex(
      'workflow_edge',
      new TableIndex({
        name: 'IDX_workflow_edge_workflow_source_target',
        columnNames: ['workflowId', 'source', 'target'],
        isUnique: false,
      })
    );

    // Add index for execution status
    await queryRunner.createIndex(
      'execution',
      new TableIndex({
        name: 'IDX_execution_status',
        columnNames: ['status'],
        isUnique: false,
      })
    );

    // Add composite index for execution workflow and status
    await queryRunner.createIndex(
      'execution',
      new TableIndex({
        name: 'IDX_execution_workflow_status',
        columnNames: ['workflowId', 'status'],
        isUnique: false,
      })
    );

    // Add index for schedule enabled status
    await queryRunner.createIndex(
      'schedule',
      new TableIndex({
        name: 'IDX_schedule_enabled',
        columnNames: ['enabled'],
        isUnique: false,
      })
    );

    // Add composite index for schedule workflow and enabled
    await queryRunner.createIndex(
      'schedule',
      new TableIndex({
        name: 'IDX_schedule_workflow_enabled',
        columnNames: ['workflowId', 'enabled'],
        isUnique: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('workflow', 'IDX_workflow_metadata_status');
    await queryRunner.dropIndex('workflow', 'IDX_workflow_name');
    await queryRunner.dropIndex('workflow', 'IDX_workflow_updated_at');
    await queryRunner.dropIndex('workflow', 'IDX_workflow_created_at');
    await queryRunner.dropIndex('workflow_node', 'IDX_workflow_node_workflow_type');
    await queryRunner.dropIndex('workflow_edge', 'IDX_workflow_edge_workflow_source_target');
    await queryRunner.dropIndex('execution', 'IDX_execution_status');
    await queryRunner.dropIndex('execution', 'IDX_execution_workflow_status');
    await queryRunner.dropIndex('schedule', 'IDX_schedule_enabled');
    await queryRunner.dropIndex('schedule', 'IDX_schedule_workflow_enabled');
  }
}
