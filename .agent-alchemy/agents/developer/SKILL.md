---
name: developer
description: Agent Alchemy Developer agent transforms architecture specifications into implementation-ready development specifications. Produces 6 separate specification artifacts following SRP - implementation guide, code structure, development environment setup, integration points, testing strategy, and documentation requirements. Use when translating architectural designs into detailed implementation instructions for developers.
compatibility: Requires architecture artifacts in .agent-alchemy/products/ structure, access to .agent-alchemy/specs/ specifications, understanding of tech stack and coding standards.
license: Proprietary
metadata:
  agent-version: '2.0.0'
  author: buildmotion-ai
  repository: buildmotion-ai-agency
  workflow-phase: development
  output-artifacts:
    - development/implementation-guide.specification.md
    - development/code-structure.specification.md
    - development/development-environment.specification.md
    - development/integration-points.specification.md
    - development/testing-strategy.specification.md
    - development/documentation-requirements.specification.md
  artifact-type: technical-implementation
  design-principle: Single Responsibility Principle (SRP) - Each specification addresses one development concern
---

# Agent Alchemy: Developer

**Role**: Transform architecture specifications into detailed implementation instructions for developers.

**Workflow Phase**: Development (Phase 4 of 5)

**Outputs**: 6 separate specification files in `.agent-alchemy/products/<product>/features/<feature>/development/`

## Output Artifacts (Following SRP)

1. **implementation-guide.specification.md** - Step-by-step implementation instructions, coding patterns, best practices
2. **code-structure.specification.md** - File organization, module structure, naming conventions, imports
3. **development-environment.specification.md** - Environment setup, dependencies, tools, configuration
4. **integration-points.specification.md** - Service integration, API contracts, event flows, error handling
5. **testing-strategy.specification.md** - Test approach, test cases, coverage requirements, mock strategies
6. **documentation-requirements.specification.md** - Code comments, README files, API docs, inline documentation

## Why Multiple Specification Files?

Following **Single Responsibility Principle (SRP)** and **Separation of Concerns (SoC)**:

- Each file addresses one specific development concern
- Easier to navigate and reference during implementation
- Clear guidelines per topic without overwhelming detail
- Thorough yet concise documentation
- Verifiable during quality phase
- Reduces cognitive load for developers
- Parallel development of different aspects
- Targeted updates without affecting other specs

## When to Use This Agent

Use the Developer agent when:

- Architecture phase is complete with all 8 specifications
- Need detailed implementation instructions for developers
- Translating architectural designs into actionable code
- Setting up development environment and tooling
- Planning integration implementation
- Defining testing approach and test cases
- Documenting code and API requirements

## Prerequisites

1. Completed research specifications (5 files):

   - `research/feasibility-analysis.specification.md`
   - `research/market-research.specification.md`
   - `research/user-research.specification.md`
   - `research/risk-assessment.specification.md`
   - `research/recommendations.specification.md`

2. Completed plan specifications (6 files):

   - `plan/functional-requirements.specification.md`
   - `plan/non-functional-requirements.specification.md`
   - `plan/business-rules.specification.md`
   - `plan/ui-ux-workflows.specification.md`
   - `plan/implementation-sequence.specification.md`
   - `plan/constraints-dependencies.specification.md`

3. Completed architecture specifications (8 files):

   - `architecture/system-architecture.specification.md`
   - `architecture/ui-components.specification.md`
   - `architecture/database-schema.specification.md`
   - `architecture/api-specifications.specification.md`
   - `architecture/security-architecture.specification.md`
   - `architecture/business-logic.specification.md`
   - `architecture/devops-deployment.specification.md`
   - `architecture/architecture-decisions.specification.md`

4. Access to `.agent-alchemy/specs/` for technical standards
5. Understanding of tech stack from `stack.json`
6. Awareness of guardrails from `guardrails.json`

## Step-by-Step Process

### 1. Create Development Directory Structure

```bash
# Create development directory
mkdir -p .agent-alchemy/products/[product-name]/features/[feature-name]/development
```

### 2. Read All Prior Specifications

```bash
# Read all research specifications (5 files)
cat .agent-alchemy/products/[product]/features/[feature]/research/feasibility-analysis.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/market-research.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/user-research.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/risk-assessment.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/recommendations.specification.md

# Read all plan specifications (6 files)
cat .agent-alchemy/products/[product]/features/[feature]/plan/functional-requirements.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/plan/non-functional-requirements.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/plan/business-rules.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/plan/ui-ux-workflows.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/plan/implementation-sequence.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/plan/constraints-dependencies.specification.md

# Read all architecture specifications (8 files)
cat .agent-alchemy/products/[product]/features/[feature]/architecture/system-architecture.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/ui-components.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/database-schema.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/api-specifications.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/security-architecture.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/business-logic.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/devops-deployment.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/architecture/architecture-decisions.specification.md

# Review technical standards and coding guidelines
cat .agent-alchemy/specs/stack.json
cat .agent-alchemy/specs/guardrails.json
cat .agent-alchemy/specs/standards-remote/coding-standards.spec.md
cat .agent-alchemy/specs/standards-remote/component-service-structure.spec.md
cat .agent-alchemy/specs/standards-remote/testing-practices.spec.md
cat .agent-alchemy/specs/angular/*.spec.md
cat .agent-alchemy/specs/nestjs/*.spec.md
```

### 3. Create Specification 1: Implementation Guide

**File**: `development/implementation-guide.specification.md`

**Purpose**: Provide step-by-step implementation instructions with coding patterns and best practices

**Content**:

````markdown
---
title: Implementation Guide - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: development
specification: implementation-guide
created: [YYYY-MM-DD]
author: Agent Alchemy Developer
version: 1.0.0
depends-on:
  - architecture/system-architecture.specification.md
  - architecture/ui-components.specification.md
  - architecture/database-schema.specification.md
  - architecture/api-specifications.specification.md
  - architecture/business-logic.specification.md
  - plan/implementation-sequence.specification.md
references:
  - .agent-alchemy/specs/stack.json
  - .agent-alchemy/specs/standards-remote/coding-standards.spec.md
  - .agent-alchemy/specs/angular/
  - .agent-alchemy/specs/nestjs/
---

# Implementation Guide: [Feature Name]

## Overview

**Purpose**: Provide detailed step-by-step implementation instructions for developers

**Implementation Phases**: [Number of phases from plan/05-implementation-sequence]

**Estimated Effort**: [Total effort from architecture specs]

**Technology Stack** (from stack.json):

- **Frontend**: Angular 18+, TypeScript 5.3+, Signals, RxJS
- **UI Components**: PrimeNG/Kendo UI, TailwindCSS
- **Backend**: NestJS 10+, TypeScript
- **Database**: PostgreSQL 15+ via Supabase
- **Testing**: Jest, Playwright
- **Build**: Nx monorepo

## Implementation Order

Based on `plan/implementation-sequence.specification.md` and `architecture/system-architecture.specification.md`:

### Phase 1: Database Schema Implementation

**Duration**: [X days]
**Dependencies**: None
**Deliverables**: Database migrations, seed data

### Phase 2: Backend API Implementation

**Duration**: [X days]
**Dependencies**: Phase 1 complete
**Deliverables**: API endpoints, DTOs, services, tests

### Phase 3: Frontend UI Implementation

**Duration**: [X days]
**Dependencies**: Phase 2 complete
**Deliverables**: Components, services, state management, tests

### Phase 4: Integration and Testing

**Duration**: [X days]
**Dependencies**: Phases 1-3 complete
**Deliverables**: Integration tests, E2E tests, documentation

## Phase 1: Database Schema Implementation

### 1.1 Create Database Migration Files

**Reference**: `architecture/database-schema.specification.md`

**Location**: `libs/[domain]/data-access/src/lib/migrations/`

**Implementation Steps**:

1. Create migration file with timestamp naming convention:

```bash
nx generate @nx/workspace:library migration-[timestamp]-[description] \
  --directory=libs/[domain]/data-access/migrations \
  --importPath=@[workspace]/[domain]/data-access/migrations
```
````

2. Implement SQL DDL from database schema specification:

```sql
-- Migration: [timestamp]_create_[entity]_table.sql
-- Reference: architecture/03-database-schema.specification.md

-- Create main entity table
CREATE TABLE [schema].[entity_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [field1] VARCHAR(255) NOT NULL,
  [field2] INTEGER,
  [field3] JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance (from NFR-P-001 requirements)
CREATE INDEX idx_[entity]_[field1] ON [schema].[entity_name]([field1]);
CREATE INDEX idx_[entity]_created_at ON [schema].[entity_name](created_at DESC);

-- Create trigger for updated_at timestamp
CREATE TRIGGER [entity]_updated_at_trigger
  BEFORE UPDATE ON [schema].[entity_name]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add row level security policies (from security architecture)
ALTER TABLE [schema].[entity_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY [entity]_select_policy ON [schema].[entity_name]
  FOR SELECT
  USING (auth.uid() = created_by OR [other_conditions]);

CREATE POLICY [entity]_insert_policy ON [schema].[entity_name]
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY [entity]_update_policy ON [schema].[entity_name]
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add comments for documentation
COMMENT ON TABLE [schema].[entity_name] IS '[Description from architecture spec]';
COMMENT ON COLUMN [schema].[entity_name].[field1] IS '[Field description]';
```

3. Create rollback migration:

```sql
-- Rollback: [timestamp]_drop_[entity]_table.sql
DROP TABLE IF EXISTS [schema].[entity_name] CASCADE;
```

### 1.2 Create TypeScript Entity Models

**Reference**: `architecture/database-schema.specification.md`

**Location**: `libs/[domain]/data-access/src/lib/entities/`

**Implementation**:

```typescript
// libs/[domain]/data-access/src/lib/entities/[entity].entity.ts

/**
 * [Entity] database entity
 * Maps to [schema].[entity_name] table
 *
 * @see architecture/database-schema.specification.md - [Section reference]
 * @see plan/functional-requirements.specification.md - FR-D-001
 */
@Entity('[entity_name]', { schema: '[schema]' })
export class [Entity]Entity {
  /**
   * Primary key - UUID generated by database
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * [Field description from architecture spec]
   *
   * @example "[example value]"
   * @see plan/functional-requirements.specification.md - FR-[ID]
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  @Index()
  field1: string;

  /**
   * [Field description]
   *
   * @min [min value]
   * @max [max value]
   */
  @Column({ type: 'integer', nullable: true })
  field2?: number;

  /**
   * [Field description]
   * Stores JSON data for flexible structure
   */
  @Column({ type: 'jsonb', nullable: true })
  field3?: Record<string, any>;

  /**
   * Timestamp when record was created
   * Automatically set by database trigger
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when record was last updated
   * Automatically updated by database trigger
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * User who created this record
   * References auth.users.id
   */
  @Column({ name: 'created_by', type: 'uuid' })
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: string;

  /**
   * User who last updated this record
   * References auth.users.id
   */
  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: string;

  // Relationships (from architecture/03-database-schema.specification.md)
  @OneToMany(() => [RelatedEntity], (related) => related.[entity])
  [relatedEntities]: [RelatedEntity][];

  @ManyToOne(() => [ParentEntity], (parent) => parent.[children])
  @JoinColumn({ name: '[parent]_id' })
  [parent]: [ParentEntity];
}
```

### 1.3 Create Repository Layer

**Reference**: `architecture/business-logic.specification.md`

**Location**: `libs/[domain]/data-access/src/lib/repositories/`

**Implementation**:

```typescript
// libs/[domain]/data-access/src/lib/repositories/[entity].repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { [Entity]Entity } from '../entities/[entity].entity';

/**
 * Repository for [Entity] data access operations
 * Implements data access patterns from architecture/06-business-logic.specification.md
 *
 * @see architecture/database-schema.specification.md
 * @see architecture/business-logic.specification.md
 */
@Injectable()
export class [Entity]Repository {
  constructor(
    @InjectRepository([Entity]Entity)
    private readonly repository: Repository<[Entity]Entity>
  ) {}

  /**
   * Find entity by ID with optional relations
   *
   * @param id - Entity UUID
   * @param relations - Optional relations to load
   * @returns Entity or null if not found
   *
   * @implements FR-D-002 from plan/functional-requirements.specification.md
   */
  async findById(
    id: string,
    relations: string[] = []
  ): Promise<[Entity]Entity | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  /**
   * Find all entities with pagination and filtering
   *
   * @param options - Find options including filters, sorting, pagination
   * @returns Array of entities
   *
   * @implements NFR-P-002 - Query performance requirements
   * @implements FR-SF-001 - Search and filter functionality
   */
  async findAll(
    options: FindManyOptions<[Entity]Entity>
  ): Promise<[Entity]Entity[]> {
    return this.repository.find({
      ...options,
      take: options.take ?? 100, // Default limit from NFR-P-002
    });
  }

  /**
   * Count entities matching criteria
   *
   * @param where - Filter conditions
   * @returns Count of matching entities
   */
  async count(
    where: FindOptionsWhere<[Entity]Entity>
  ): Promise<number> {
    return this.repository.count({ where });
  }

  /**
   * Create new entity
   *
   * @param data - Entity data to create
   * @param userId - User creating the entity
   * @returns Created entity
   *
   * @implements FR-D-001 - Data creation requirements
   * @throws {BusinessRuleViolationException} If business rules fail (BR-001)
   */
  async create(
    data: Partial<[Entity]Entity>,
    userId: string
  ): Promise<[Entity]Entity> {
    const entity = this.repository.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.repository.save(entity);
  }

  /**
   * Update existing entity
   *
   * @param id - Entity UUID
   * @param data - Fields to update
   * @param userId - User updating the entity
   * @returns Updated entity
   *
   * @implements FR-D-003 - Data update with optimistic locking
   * @throws {NotFoundException} If entity not found
   * @throws {ConflictException} If concurrent modification detected
   */
  async update(
    id: string,
    data: Partial<[Entity]Entity>,
    userId: string
  ): Promise<[Entity]Entity> {
    const entity = await this.findById(id);

    if (!entity) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    // Optimistic locking check (NFR-R-003)
    if (data.updatedAt && entity.updatedAt > data.updatedAt) {
      throw new ConflictException(
        'Entity was modified by another user. Please refresh and try again.'
      );
    }

    Object.assign(entity, {
      ...data,
      updatedBy: userId,
    });

    return this.repository.save(entity);
  }

  /**
   * Soft delete entity
   *
   * @param id - Entity UUID
   * @returns Deleted entity
   *
   * @implements FR-D-004 - Soft delete requirements
   */
  async softDelete(id: string): Promise<[Entity]Entity> {
    const entity = await this.findById(id);

    if (!entity) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    entity.deletedAt = new Date();
    return this.repository.save(entity);
  }

  /**
   * Custom query method for complex business logic
   *
   * @param criteria - Query criteria from business rules
   * @returns Query results
   *
   * @implements BR-[ID] from plan/business-rules.specification.md
   */
  async customQuery(criteria: [QueryCriteria]): Promise<[Entity]Entity[]> {
    const queryBuilder = this.repository.createQueryBuilder('[entity]');

    // Apply filters from criteria
    if (criteria.filter1) {
      queryBuilder.andWhere('[entity].field1 = :filter1', {
        filter1: criteria.filter1,
      });
    }

    // Apply business rule conditions (from BR specifications)
    // ... additional query logic

    return queryBuilder.getMany();
  }
}
```

### 1.4 Create Seed Data

**Location**: `libs/[domain]/data-access/src/lib/seeds/`

**Implementation**:

```typescript
// libs/[domain]/data-access/src/lib/seeds/[entity].seed.ts

/**
 * Seed data for [Entity] table
 * Used for development and testing environments
 *
 * @see architecture/database-schema.specification.md
 */
export const [entity]SeedData = [
  {
    id: '[uuid]',
    field1: '[value]',
    field2: [value],
    createdBy: '[system-user-uuid]',
  },
  // Additional seed records...
];

/**
 * Seed function to populate [Entity] table
 */
export async function seed[Entity]Table(
  repository: Repository<[Entity]Entity>
): Promise<void> {
  await repository.save([entity]SeedData);
  console.log(`Seeded ${[entity]SeedData.length} [entity] records`);
}
```

## Phase 2: Backend API Implementation

### 2.1 Create DTOs (Data Transfer Objects)

**Reference**: `architecture/api-specifications.specification.md`

**Location**: `libs/[domain]/api/src/lib/dtos/`

**Implementation**:

```typescript
// libs/[domain]/api/src/lib/dtos/create-[entity].dto.ts

import { IsString, IsInt, IsOptional, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating [Entity]
 * Validates input from API endpoint: POST /api/[entities]
 *
 * @see architecture/api-specifications.specification.md - API-POST-001
 * @see plan/functional-requirements.specification.md - FR-C-001
 * @see plan/business-rules.specification.md - BR-VAL-001
 */
export class Create[Entity]Dto {
  /**
   * [Field description]
   *
   * @example "[example value]"
   *
   * Business Rules:
   * - BR-VAL-001: Must be between 2-255 characters
   * - BR-VAL-002: Must be unique per user
   */
  @ApiProperty({
    description: '[Field description from API spec]',
    example: '[example value]',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  field1: string;

  /**
   * [Field description]
   *
   * @min [min value]
   * @max [max value]
   *
   * Business Rules:
   * - BR-VAL-003: Must be positive integer
   * - BR-VAL-004: Cannot exceed [max value]
   */
  @ApiPropertyOptional({
    description: '[Field description]',
    example: [example],
    minimum: [min],
    maximum: [max],
  })
  @IsOptional()
  @IsInt()
  @Min([min])
  @Max([max])
  field2?: number;

  /**
   * [Field description]
   * Optional JSON data
   */
  @ApiPropertyOptional({
    description: '[Field description]',
    example: { key: 'value' },
  })
  @IsOptional()
  @IsObject()
  field3?: Record<string, any>;

  /**
   * Parent entity ID (for relationships)
   *
   * @see architecture/database-schema.specification.md - Relationships
   */
  @ApiProperty({
    description: 'Parent [entity] UUID',
    example: '[uuid]',
  })
  @IsUUID()
  [parent]Id: string;
}
```

```typescript
// libs/[domain]/api/src/lib/dtos/update-[entity].dto.ts

import { PartialType } from '@nestjs/swagger';
import { Create[Entity]Dto } from './create-[entity].dto';

/**
 * DTO for updating [Entity]
 * All fields optional for partial updates
 *
 * @see architecture/api-specifications.specification.md - API-PATCH-001
 * @see plan/functional-requirements.specification.md - FR-U-001
 */
export class Update[Entity]Dto extends PartialType(Create[Entity]Dto) {
  /**
   * Updated timestamp for optimistic locking
   * Must match current database value to prevent concurrent modifications
   *
   * @see plan/non-functional-requirements.specification.md - NFR-R-003
   */
  @ApiPropertyOptional({
    description: 'Current updated_at timestamp for optimistic locking',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}
```

```typescript
// libs/[domain]/api/src/lib/dtos/[entity]-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Response DTO for [Entity]
 * Defines API response structure for GET endpoints
 *
 * @see architecture/api-specifications.specification.md - API-GET-001
 */
@Exclude()
export class [Entity]ResponseDto {
  /**
   * Entity UUID
   */
  @ApiProperty({
    description: 'Entity UUID',
    example: '[uuid]',
  })
  @Expose()
  id: string;

  /**
   * [Field description]
   */
  @ApiProperty({
    description: '[Field description]',
    example: '[example]',
  })
  @Expose()
  field1: string;

  /**
   * [Field description]
   */
  @ApiPropertyOptional({
    description: '[Field description]',
    example: [example],
  })
  @Expose()
  field2?: number;

  /**
   * Created timestamp
   */
  @ApiProperty({
    description: 'When entity was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  /**
   * Last updated timestamp
   */
  @ApiProperty({
    description: 'When entity was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  /**
   * Nested related entities (if included in query)
   */
  @ApiPropertyOptional({
    description: 'Related entities',
    type: [RelatedEntityResponseDto],
  })
  @Expose()
  @Type(() => RelatedEntityResponseDto)
  relatedEntities?: RelatedEntityResponseDto[];

  /**
   * Map database entity to response DTO
   *
   * @param entity - Database entity
   * @returns Response DTO
   */
  static fromEntity(entity: [Entity]Entity): [Entity]ResponseDto {
    return plainToClass([Entity]ResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }
}
```

```typescript
// libs/[domain]/api/src/lib/dtos/[entity]-query.dto.ts

import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query parameters for listing [Entity]
 * Supports pagination, filtering, and sorting
 *
 * @see architecture/api-specifications.specification.md - API-GET-002
 * @see plan/functional-requirements.specification.md - FR-SF-001, FR-SF-002
 * @see plan/non-functional-requirements.specification.md - NFR-P-002
 */
export class [Entity]QueryDto {
  /**
   * Page number (1-based)
   *
   * @default 1
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Items per page
   *
   * @default 20
   * @max 100
   */
  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Search query for full-text search
   * Searches across [field1, field2] fields
   *
   * @see FR-SF-001
   */
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'search term',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter by field1
   */
  @ApiPropertyOptional({
    description: 'Filter by field1',
    example: '[value]',
  })
  @IsOptional()
  @IsString()
  field1Filter?: string;

  /**
   * Sort field
   *
   * @default 'createdAt'
   */
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'field1', 'field2'],
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'field1', 'field2'])
  sortBy?: string = 'createdAt';

  /**
   * Sort direction
   *
   * @default 'DESC'
   */
  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  /**
   * Include related entities in response
   */
  @ApiPropertyOptional({
    description: 'Include related entities',
    example: ['relatedEntities'],
    isArray: true,
  })
  @IsOptional()
  @IsString({ each: true })
  include?: string[];
}
```

### 2.2 Create Controller

**Reference**: `architecture/api-specifications.specification.md`

**Location**: `apps/api/src/app/[domain]/controllers/`

**Implementation**:

```typescript
// apps/api/src/app/[domain]/controllers/[entity].controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@[workspace]/auth';
import { CurrentUser } from '@[workspace]/auth/decorators';
import { [Entity]Service } from '../services/[entity].service';
import {
  Create[Entity]Dto,
  Update[Entity]Dto,
  [Entity]ResponseDto,
  [Entity]QueryDto,
} from '../dtos';

/**
 * Controller for [Entity] API endpoints
 * Implements REST API from architecture/04-api-specifications.specification.md
 *
 * Base path: /api/[entities]
 *
 * @see architecture/api-specifications.specification.md
 * @see architecture/security-architecture.specification.md - JWT authentication
 * @see plan/functional-requirements.specification.md - FR-C-001, FR-R-001, FR-U-001, FR-D-001
 */
@Controller('[entities]')
@ApiTags('[Entities]')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class [Entity]Controller {
  constructor(private readonly [entity]Service: [Entity]Service) {}

  /**
   * Create new [entity]
   *
   * POST /api/[entities]
   *
   * @implements FR-C-001 - Create [entity]
   * @implements API-POST-001 from architecture/api-specifications
   *
   * Business Rules Applied:
   * - BR-VAL-001: Field validation
   * - BR-AUTH-001: User must be authenticated
   * - BR-[ID]: [Specific business rule]
   *
   * @param createDto - Entity creation data
   * @param userId - Current authenticated user ID
   * @returns Created entity
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new [entity]',
    description: 'Creates a new [entity] with provided data',
  })
  @ApiResponse({
    status: 201,
    description: '[Entity] created successfully',
    type: [Entity]ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 409,
    description: 'Business rule violation',
  })
  async create(
    @Body() createDto: Create[Entity]Dto,
    @CurrentUser('id') userId: string
  ): Promise<[Entity]ResponseDto> {
    return this.[entity]Service.create(createDto, userId);
  }

  /**
   * Get all [entities] with pagination and filtering
   *
   * GET /api/[entities]
   *
   * @implements FR-R-001 - Read [entities]
   * @implements FR-SF-001 - Search functionality
   * @implements FR-SF-002 - Filter functionality
   * @implements API-GET-002 from architecture/api-specifications
   * @implements NFR-P-002 - Query performance < 500ms
   *
   * @param query - Query parameters (pagination, filters, sorting)
   * @param userId - Current authenticated user ID
   * @returns Paginated list of entities
   */
  @Get()
  @ApiOperation({
    summary: 'Get all [entities]',
    description: 'Retrieve paginated list of [entities] with filtering and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'List of [entities]',
    type: [Entity]ResponseDto,
    isArray: true,
  })
  @ApiQuery({ type: [Entity]QueryDto })
  async findAll(
    @Query() query: [Entity]QueryDto,
    @CurrentUser('id') userId: string
  ): Promise<{
    data: [Entity]ResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return this.[entity]Service.findAll(query, userId);
  }

  /**
   * Get [entity] by ID
   *
   * GET /api/[entities]/:id
   *
   * @implements FR-R-002 - Read specific [entity]
   * @implements API-GET-001 from architecture/api-specifications
   *
   * @param id - Entity UUID
   * @param userId - Current authenticated user ID
   * @returns Entity details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get [entity] by ID',
    description: 'Retrieve single [entity] by UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Entity UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: '[Entity] found',
    type: [Entity]ResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '[Entity] not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string
  ): Promise<[Entity]ResponseDto> {
    return this.[entity]Service.findOne(id, userId);
  }

  /**
   * Update [entity] (full update)
   *
   * PUT /api/[entities]/:id
   *
   * @implements FR-U-001 - Update [entity]
   * @implements API-PUT-001 from architecture/api-specifications
   * @implements NFR-R-003 - Optimistic locking
   *
   * Business Rules Applied:
   * - BR-AUTH-002: User must own entity or have admin role
   * - BR-VAL-001: Updated data validation
   *
   * @param id - Entity UUID
   * @param updateDto - Complete updated entity data
   * @param userId - Current authenticated user ID
   * @returns Updated entity
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update [entity]',
    description: 'Update entire [entity] (full update)',
  })
  @ApiParam({
    name: 'id',
    description: 'Entity UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: '[Entity] updated successfully',
    type: [Entity]ResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '[Entity] not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Concurrent modification detected (optimistic locking)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Update[Entity]Dto,
    @CurrentUser('id') userId: string
  ): Promise<[Entity]ResponseDto> {
    return this.[entity]Service.update(id, updateDto, userId);
  }

  /**
   * Partial update [entity]
   *
   * PATCH /api/[entities]/:id
   *
   * @implements FR-U-002 - Partial update
   * @implements API-PATCH-001 from architecture/api-specifications
   *
   * @param id - Entity UUID
   * @param updateDto - Partial entity data
   * @param userId - Current authenticated user ID
   * @returns Updated entity
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Partially update [entity]',
    description: 'Update specific fields of [entity]',
  })
  @ApiParam({
    name: 'id',
    description: 'Entity UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: '[Entity] updated successfully',
    type: [Entity]ResponseDto,
  })
  async partialUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<Update[Entity]Dto>,
    @CurrentUser('id') userId: string
  ): Promise<[Entity]ResponseDto> {
    return this.[entity]Service.update(id, updateDto, userId);
  }

  /**
   * Delete [entity]
   *
   * DELETE /api/[entities]/:id
   *
   * @implements FR-D-001 - Delete [entity]
   * @implements API-DELETE-001 from architecture/api-specifications
   *
   * Business Rules Applied:
   * - BR-DEL-001: Soft delete (not permanent)
   * - BR-AUTH-003: Only owner or admin can delete
   *
   * @param id - Entity UUID
   * @param userId - Current authenticated user ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete [entity]',
    description: 'Soft delete [entity] (can be restored)',
  })
  @ApiParam({
    name: 'id',
    description: 'Entity UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: '[Entity] deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: '[Entity] not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string
  ): Promise<void> {
    await this.[entity]Service.remove(id, userId);
  }
}
```

### 2.3 Create Service (Business Logic)

**Reference**: `architecture/business-logic.specification.md`

**Location**: `apps/api/src/app/[domain]/services/`

**Implementation**:

```typescript
// apps/api/src/app/[domain]/services/[entity].service.ts

import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@[workspace]/logging';
import { [Entity]Repository } from '@[workspace]/[domain]/data-access';
import { [Entity]Entity } from '@[workspace]/[domain]/data-access/entities';
import {
  Create[Entity]Dto,
  Update[Entity]Dto,
  [Entity]ResponseDto,
  [Entity]QueryDto,
} from '../dtos';

/**
 * Service for [Entity] business logic
 * Implements business rules from plan/03-business-rules.specification.md
 * and logic architecture from architecture/06-business-logic.specification.md
 *
 * @see architecture/business-logic.specification.md
 * @see plan/business-rules.specification.md
 */
@Injectable()
export class [Entity]Service {
  constructor(
    private readonly [entity]Repository: [Entity]Repository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger
  ) {
    this.logger.setContext([Entity]Service.name);
  }

  /**
   * Create new [entity]
   *
   * @implements FR-C-001
   * @implements BR-VAL-001, BR-VAL-002 - Validation rules
   * @implements BR-[ID] - Business rule from plan/business-rules
   *
   * Business Logic:
   * 1. Validate input (DTO validation already applied)
   * 2. Check business rule: BR-VAL-002 (uniqueness per user)
   * 3. Apply business rule: BR-[ID]
   * 4. Create entity in database
   * 5. Emit event for audit/notification
   *
   * @param createDto - Entity creation data
   * @param userId - Current user ID
   * @returns Created entity
   * @throws {ConflictException} If business rules violated
   */
  async create(
    createDto: Create[Entity]Dto,
    userId: string
  ): Promise<[Entity]ResponseDto> {
    this.logger.log(`Creating [entity] for user ${userId}`, { createDto });

    // Business Rule BR-VAL-002: Check uniqueness per user
    const existing = await this.[entity]Repository.findOne({
      where: {
        field1: createDto.field1,
        createdBy: userId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `[Entity] with field1 '${createDto.field1}' already exists for this user`
      );
    }

    // Business Rule BR-[ID]: Apply specific business logic
    // [Implement specific business rule from plan/03-business-rules.specification.md]

    try {
      // Create entity
      const entity = await this.[entity]Repository.create(createDto, userId);

      // Emit event for audit trail and notifications
      this.eventEmitter.emit('[entity].created', {
        entityId: entity.id,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`[Entity] created successfully: ${entity.id}`);

      return [Entity]ResponseDto.fromEntity(entity);
    } catch (error) {
      this.logger.error(`Failed to create [entity]`, error);
      throw error;
    }
  }

  /**
   * Find all [entities] with pagination and filtering
   *
   * @implements FR-R-001
   * @implements FR-SF-001 - Search
   * @implements FR-SF-002 - Filtering
   * @implements NFR-P-002 - Performance < 500ms
   *
   * Business Logic:
   * 1. Apply user-specific filters (row-level security)
   * 2. Apply search query if provided
   * 3. Apply additional filters
   * 4. Apply pagination
   * 5. Return results with metadata
   *
   * @param query - Query parameters
   * @param userId - Current user ID
   * @returns Paginated results
   */
  async findAll(
    query: [Entity]QueryDto,
    userId: string
  ): Promise<{
    data: [Entity]ResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    this.logger.log(`Finding [entities] for user ${userId}`, { query });

    const { page = 1, limit = 20, search, sortBy, sortOrder, include } = query;

    // Build query
    const where: any = {
      createdBy: userId, // Row-level security
    };

    // Apply search filter (FR-SF-001)
    if (search) {
      where.field1 = { contains: search }; // Or use full-text search
    }

    // Apply additional filters
    if (query.field1Filter) {
      where.field1 = query.field1Filter;
    }

    // Count total for pagination
    const total = await this.[entity]Repository.count(where);

    // Fetch paginated data
    const entities = await this.[entity]Repository.findAll({
      where,
      relations: include,
      order: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: entities.map((entity) => [Entity]ResponseDto.fromEntity(entity)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find [entity] by ID
   *
   * @implements FR-R-002
   *
   * Business Logic:
   * 1. Fetch entity by ID
   * 2. Verify user has access (BR-AUTH-002)
   * 3. Return entity or 404
   *
   * @param id - Entity UUID
   * @param userId - Current user ID
   * @returns Entity
   * @throws {NotFoundException} If not found or no access
   */
  async findOne(id: string, userId: string): Promise<[Entity]ResponseDto> {
    this.logger.log(`Finding [entity] ${id} for user ${userId}`);

    const entity = await this.[entity]Repository.findById(id, ['relatedEntities']);

    if (!entity) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    // Business Rule BR-AUTH-002: Verify user has access
    if (entity.createdBy !== userId && !this.isAdmin(userId)) {
      throw new UnauthorizedException(
        'You do not have permission to access this [entity]'
      );
    }

    return [Entity]ResponseDto.fromEntity(entity);
  }

  /**
   * Update [entity]
   *
   * @implements FR-U-001
   * @implements NFR-R-003 - Optimistic locking
   *
   * Business Logic:
   * 1. Fetch existing entity
   * 2. Verify ownership (BR-AUTH-002)
   * 3. Check optimistic lock (NFR-R-003)
   * 4. Apply business rule validations
   * 5. Update entity
   * 6. Emit event
   *
   * @param id - Entity UUID
   * @param updateDto - Update data
   * @param userId - Current user ID
   * @returns Updated entity
   * @throws {NotFoundException} If not found
   * @throws {UnauthorizedException} If no access
   * @throws {ConflictException} If concurrent modification
   */
  async update(
    id: string,
    updateDto: Update[Entity]Dto | Partial<Update[Entity]Dto>,
    userId: string
  ): Promise<[Entity]ResponseDto> {
    this.logger.log(`Updating [entity] ${id} for user ${userId}`, { updateDto });

    const entity = await this.[entity]Repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    // Business Rule BR-AUTH-002: Verify ownership
    if (entity.createdBy !== userId && !this.isAdmin(userId)) {
      throw new UnauthorizedException(
        'You do not have permission to update this [entity]'
      );
    }

    // Optimistic locking check (NFR-R-003)
    if (
      updateDto.updatedAt &&
      entity.updatedAt.getTime() > new Date(updateDto.updatedAt).getTime()
    ) {
      throw new ConflictException(
        'Entity was modified by another user. Please refresh and try again.'
      );
    }

    // Apply business rule validations
    // [Implement specific business rules from plan/03-business-rules.specification.md]

    try {
      const updated = await this.[entity]Repository.update(id, updateDto, userId);

      // Emit event
      this.eventEmitter.emit('[entity].updated', {
        entityId: id,
        userId,
        changes: updateDto,
        timestamp: new Date(),
      });

      this.logger.log(`[Entity] ${id} updated successfully`);

      return [Entity]ResponseDto.fromEntity(updated);
    } catch (error) {
      this.logger.error(`Failed to update [entity] ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete [entity] (soft delete)
   *
   * @implements FR-D-001
   * @implements BR-DEL-001 - Soft delete
   *
   * Business Logic:
   * 1. Fetch entity
   * 2. Verify ownership (BR-AUTH-003)
   * 3. Soft delete (set deletedAt)
   * 4. Emit event
   *
   * @param id - Entity UUID
   * @param userId - Current user ID
   * @throws {NotFoundException} If not found
   * @throws {UnauthorizedException} If no access
   */
  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting [entity] ${id} for user ${userId}`);

    const entity = await this.[entity]Repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    // Business Rule BR-AUTH-003: Verify ownership
    if (entity.createdBy !== userId && !this.isAdmin(userId)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this [entity]'
      );
    }

    try {
      await this.[entity]Repository.softDelete(id);

      // Emit event
      this.eventEmitter.emit('[entity].deleted', {
        entityId: id,
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`[Entity] ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete [entity] ${id}`, error);
      throw error;
    }
  }

  /**
   * Helper: Check if user is admin
   *
   * @param userId - User ID to check
   * @returns true if admin
   */
  private isAdmin(userId: string): boolean {
    // Implement admin check (from security architecture)
    // Could check user roles, permissions, etc.
    return false; // Placeholder
  }
}
```

(Content continues with Phase 3 Frontend implementation...)

## Evaluation Criteria

This specification is verifiable if:

- [ ] Implementation order matches architecture dependencies
- [ ] Database schema implementation complete with migrations
- [ ] All DTOs created with validation and documentation
- [ ] Controller implements all API endpoints from architecture spec
- [ ] Service implements all business rules from plan phase
- [ ] Code follows coding standards from guardrails
- [ ] All code has JSDoc documentation
- [ ] Test placeholders included
- [ ] Integration points identified
- [ ] Error handling implemented

## References

- Architecture: architecture/system-architecture.specification.md
- Architecture: architecture/ui-components.specification.md
- Architecture: architecture/database-schema.specification.md
- Architecture: architecture/api-specifications.specification.md
- Architecture: architecture/business-logic.specification.md
- Plan: plan/functional-requirements.specification.md
- Plan: plan/business-rules.specification.md
- Standards: .agent-alchemy/specs/standards-remote/coding-standards.spec.md

---

**Specification Complete**: implementation-guide ✅

```

## Output Artifacts

All 6 specification files following SRP:

1. **implementation-guide.specification.md** - Step-by-step implementation with code examples
2. **code-structure.specification.md** - File organization, module structure, naming conventions
3. **development-environment.specification.md** - Environment setup, dependencies, tools
4. **integration-points.specification.md** - Service integration, API contracts, events
5. **testing-strategy.specification.md** - Test approach, test cases, coverage requirements
6. **documentation-requirements.specification.md** - Code comments, README, API docs

## Integration Points

**Reads from:**
- `.agent-alchemy/products/<product>/features/<feature>/research/` (all 5 research specs)
- `.agent-alchemy/products/<product>/features/<feature>/plan/` (all 6 plan specs)
- `.agent-alchemy/products/<product>/features/<feature>/architecture/` (all 8 architecture specs)
- `.agent-alchemy/specs/stack.json`
- `.agent-alchemy/specs/guardrails.json`
- `.agent-alchemy/specs/standards-remote/`
- `.agent-alchemy/specs/angular/`
- `.agent-alchemy/specs/nestjs/`

**Creates:**
- `.agent-alchemy/products/<product>/features/<feature>/development/implementation-guide.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/development/code-structure.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/development/development-environment.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/development/integration-points.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/development/testing-strategy.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/development/documentation-requirements.specification.md`

**Triggers:**
- Next phase: Quality agent (after implementation)

## Example Usage

```

User: "Create development specifications for user management feature"

Developer Agent:

1. Creates development/ directory
2. Reads all prior specifications (research, plan, architecture)
3. Creates implementation-guide.specification.md with step-by-step code
4. Creates code-structure.specification.md with file organization
5. Creates development-environment.specification.md with setup instructions
6. Creates integration-points.specification.md with integration details
7. Creates testing-strategy.specification.md with test plans
8. Creates documentation-requirements.specification.md with doc guidelines

Output location:
.agent-alchemy/products/my-app/features/user-management/development/
├── implementation-guide.specification.md
├── code-structure.specification.md
├── development-environment.specification.md
├── integration-points.specification.md
├── testing-strategy.specification.md
└── documentation-requirements.specification.md

````

## Summary

The Developer agent creates **6 focused specification files** that translate architecture into actionable implementation instructions:

- Each file follows **Single Responsibility Principle**
- Each file is **thorough yet concise** on its topic
- Each file has **complete code examples** and patterns
- All files together provide **complete implementation guidance**
- Directly consumable by developers during coding phase

This structure makes it easier to:
- Follow implementation order without confusion
- Reference specific implementation concerns quickly
- Understand integration points and dependencies
- Apply consistent coding patterns and standards
- Test implementation against specifications
- Document code properly from the start

---

**Agent**: Developer v2.0.0 ✅
**Design Principle**: Single Responsibility - 6 focused development specifications
**Next Phase**: Quality (validate implementation against all 25 specifications)

### 4. Create Specification 2: Code Structure

**File**: `development/code-structure.specification.md`

**Purpose**: Define file organization, module structure, naming conventions, and import patterns

**Content**:

```markdown
---
title: Code Structure - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: development
specification: code-structure
created: [YYYY-MM-DD]
author: Agent Alchemy Developer
version: 1.0.0
depends-on:
  - architecture/system-architecture.specification.md
  - architecture/ui-components.specification.md
references:
  - .agent-alchemy/specs/standards-remote/component-service-structure.spec.md
  - .agent-alchemy/specs/standards-remote/coding-standards.spec.md
---

# Code Structure: [Feature Name]

## Overview

**Purpose**: Define complete file organization, module structure, and naming conventions

**Source**: Based on architecture/system-architecture and component-service-structure standards

**Nx Workspace**: Monorepo structure with apps/ and libs/

## Directory Structure

### Backend Structure (NestJS)

````

apps/api/
└── src/
└── app/
└── [domain]/
├── controllers/
│ ├── [entity].controller.ts
│ ├── [entity].controller.spec.ts
│ └── index.ts
├── services/
│ ├── [entity].service.ts
│ ├── [entity].service.spec.ts
│ └── index.ts
├── dtos/
│ ├── create-[entity].dto.ts
│ ├── update-[entity].dto.ts
│ ├── [entity]-response.dto.ts
│ ├── [entity]-query.dto.ts
│ └── index.ts
├── guards/
│ ├── [entity]-ownership.guard.ts
│ ├── [entity]-ownership.guard.spec.ts
│ └── index.ts
├── interceptors/
│ ├── [entity]-logging.interceptor.ts
│ └── index.ts
├── pipes/
│ ├── [entity]-validation.pipe.ts
│ └── index.ts
└── [domain].module.ts

libs/[domain]/
├── data-access/
│ └── src/
│ ├── lib/
│ │ ├── entities/
│ │ │ ├── [entity].entity.ts
│ │ │ ├── [entity].entity.spec.ts
│ │ │ └── index.ts
│ │ ├── repositories/
│ │ │ ├── [entity].repository.ts
│ │ │ ├── [entity].repository.spec.ts
│ │ │ └── index.ts
│ │ ├── migrations/
│ │ │ ├── [timestamp]_create_[entity]_table.sql
│ │ │ └── [timestamp]\_rollback_[entity]\_table.sql
│ │ ├── seeds/
│ │ │ └── [entity].seed.ts
│ │ └── [domain]-data-access.module.ts
│ └── index.ts
├── models/
│ └── src/
│ ├── lib/
│ │ ├── interfaces/
│ │ │ ├── [entity].interface.ts
│ │ │ └── index.ts
│ │ ├── types/
│ │ │ ├── [entity].types.ts
│ │ │ └── index.ts
│ │ └── enums/
│ │ ├── [entity]-status.enum.ts
│ │ └── index.ts
│ └── index.ts
└── utils/
└── src/
├── lib/
│ ├── [entity].utils.ts
│ ├── [entity].utils.spec.ts
│ └── index.ts
└── index.ts

```

### Frontend Structure (Angular)

```

apps/[app]/
└── src/
└── app/
└── [feature]/
├── components/
│ ├── [component]/
│ │ ├── [component].component.ts
│ │ ├── [component].component.html
│ │ ├── [component].component.scss
│ │ ├── [component].component.spec.ts
│ │ └── index.ts
│ └── index.ts
├── containers/
│ ├── [container]/
│ │ ├── [container].component.ts
│ │ ├── [container].component.html
│ │ ├── [container].component.scss
│ │ ├── [container].component.spec.ts
│ │ └── index.ts
│ └── index.ts
├── services/
│ ├── [entity].service.ts
│ ├── [entity].service.spec.ts
│ └── index.ts
├── models/
│ ├── [entity].model.ts
│ ├── [entity].interface.ts
│ └── index.ts
├── guards/
│ ├── [feature].guard.ts
│ ├── [feature].guard.spec.ts
│ └── index.ts
├── resolvers/
│ ├── [entity].resolver.ts
│ ├── [entity].resolver.spec.ts
│ └── index.ts
├── [feature]-routing.module.ts
└── [feature].module.ts

libs/[domain]/
├── feature/
│ └── src/
│ ├── lib/
│ │ ├── components/
│ │ ├── services/
│ │ ├── state/
│ │ │ ├── [entity].state.ts
│ │ │ ├── [entity].state.spec.ts
│ │ │ └── index.ts
│ │ └── [domain]-feature.module.ts
│ └── index.ts
├── ui/
│ └── src/
│ ├── lib/
│ │ ├── components/
│ │ │ ├── [ui-component]/
│ │ │ │ ├── [ui-component].component.ts
│ │ │ │ ├── [ui-component].component.html
│ │ │ │ ├── [ui-component].component.scss
│ │ │ │ ├── [ui-component].component.spec.ts
│ │ │ │ └── index.ts
│ │ │ └── index.ts
│ │ ├── directives/
│ │ │ └── [directive].directive.ts
│ │ ├── pipes/
│ │ │ └── [pipe].pipe.ts
│ │ └── [domain]-ui.module.ts
│ └── index.ts
└── data-access/
└── src/
├── lib/
│ ├── services/
│ │ ├── [entity]-api.service.ts
│ │ ├── [entity]-api.service.spec.ts
│ │ └── index.ts
│ ├── models/
│ │ └── [entity].model.ts
│ └── [domain]-data-access.module.ts
└── index.ts

````

## Naming Conventions

### File Naming

**Pattern**: `[name].[type].[extension]`

- **Components**: `user-profile.component.ts`
- **Services**: `user.service.ts`
- **Controllers**: `user.controller.ts`
- **DTOs**: `create-user.dto.ts`
- **Entities**: `user.entity.ts`
- **Tests**: `user.service.spec.ts`
- **Interfaces**: `user.interface.ts`
- **Types**: `user.types.ts`
- **Enums**: `user-status.enum.ts`

**Rules** (from coding-standards.spec.md):
- Use kebab-case for file names
- Use descriptive names that indicate purpose
- Include type indicator before extension
- Test files mirror source file name with .spec suffix

### Class Naming

**Pattern**: `[Name][Type]`

```typescript
// Components
export class UserProfileComponent { }
export class UserListContainerComponent { }

// Services
export class UserService { }
export class UserApiService { }

// Controllers
export class UserController { }

// DTOs
export class CreateUserDto { }
export class UpdateUserDto { }
export class UserResponseDto { }

// Entities
export class UserEntity { }

// Guards
export class UserOwnershipGuard { }

// Interceptors
export class UserLoggingInterceptor { }

// Pipes
export class UserValidationPipe { }

// Interfaces
export interface IUser { }
export interface IUserService { }

// Types
export type UserId = string;
export type UserRole = 'admin' | 'user' | 'guest';

// Enums
export enum UserStatus { }
````

**Rules**:

- Use PascalCase for classes and interfaces
- Suffix with type indicator (Component, Service, Controller, etc.)
- Interfaces prefixed with 'I' (optional but consistent)
- Keep names descriptive and specific

### Variable/Property Naming

```typescript
// camelCase for variables, properties, methods
const userId: string = '123';
let currentUser: User;
const isAuthenticated: boolean = true;

// Boolean prefixes
const isActive: boolean;
const hasPermission: boolean;
const canEdit: boolean;
const shouldUpdate: boolean;

// Constants (UPPER_SNAKE_CASE)
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// Private properties (prefix with underscore - optional)
private _internalState: State;
private readonly _logger: Logger;

// Methods (verb prefixes)
getUserById(id: string): User { }
createUser(data: CreateUserDto): User { }
updateUser(id: string, data: UpdateUserDto): User { }
deleteUser(id: string): void { }
validateUserInput(input: any): boolean { }
```

### Module Naming

```typescript
// Feature Modules
@Module({})
export class UserModule {}
@Module({})
export class AuthModule {}

// Shared Modules
@Module({})
export class SharedModule {}
@Module({})
export class CoreModule {}

// Data Access Modules
@Module({})
export class UserDataAccessModule {}

// UI Modules (Angular)
@NgModule({})
export class UserFeatureModule {}
@NgModule({})
export class UserUiModule {}
```

## Import Organization

### Import Order (ESLint enforced)

```typescript
// 1. External/third-party imports (alphabetical)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 2. Workspace libraries (alphabetical by domain)
import { Logger } from '@[workspace]/logging';
import { [Entity]Entity } from '@[workspace]/[domain]/data-access/entities';
import { [Entity]Repository } from '@[workspace]/[domain]/data-access/repositories';

// 3. Relative imports from parent directories
import { BaseService } from '../../base/base.service';

// 4. Relative imports from current directory
import { Create[Entity]Dto } from './dtos/create-[entity].dto';
import { [Entity]ResponseDto } from './dtos/[entity]-response.dto';

// 5. Type imports (if using TypeScript 4.5+ with type modifiers)
import type { [Entity]Interface } from './interfaces/[entity].interface';
```

### Path Aliases (from tsconfig.base.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@[workspace]/[domain]/data-access": ["libs/[domain]/data-access/src/index.ts"],
      "@[workspace]/[domain]/feature": ["libs/[domain]/feature/src/index.ts"],
      "@[workspace]/[domain]/ui": ["libs/[domain]/ui/src/index.ts"],
      "@[workspace]/shared/ui": ["libs/shared/ui/src/index.ts"],
      "@[workspace]/shared/utils": ["libs/shared/utils/src/index.ts"]
    }
  }
}
```

**Usage**:

```typescript
// ✅ Use path aliases for workspace libraries
import { UserService } from '@[workspace]/[domain]/feature';

// ❌ Don't use relative paths for workspace libraries
import { UserService } from '../../../libs/[domain]/feature/src/lib/services/user.service';
```

## Barrel Exports (index.ts)

### Purpose

Simplify imports by re-exporting from a single entry point

### Pattern

```typescript
// libs/[domain]/data-access/src/lib/entities/index.ts
export * from './user.entity';
export * from './user-profile.entity';
export * from './user-role.entity';

// libs/[domain]/data-access/src/lib/repositories/index.ts
export * from './user.repository';
export * from './user-profile.repository';

// libs/[domain]/data-access/src/index.ts
export * from './lib/entities';
export * from './lib/repositories';
export * from './lib/[domain]-data-access.module';
```

### Usage

```typescript
// Import multiple entities from single barrel
import { UserEntity, UserProfileEntity, UserRoleEntity } from '@[workspace]/[domain]/data-access/entities';

// Or import everything
import * as entities from '@[workspace]/[domain]/data-access/entities';
```

## Module Dependencies

### Feature Module Structure (NestJS)

```typescript
// apps/api/src/app/[domain]/[domain].module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain imports
import { [Entity]Controller } from './controllers/[entity].controller';
import { [Entity]Service } from './services/[entity].service';

// Data access imports
import { [Entity]Entity, [Entity]Repository } from '@[workspace]/[domain]/data-access';

// Shared imports
import { LoggingModule } from '@[workspace]/shared/logging';
import { CacheModule } from '@[workspace]/shared/cache';

@Module({
  imports: [
    TypeOrmModule.forFeature([[Entity]Entity]),
    LoggingModule,
    CacheModule,
  ],
  controllers: [[Entity]Controller],
  providers: [
    [Entity]Service,
    [Entity]Repository,
  ],
  exports: [[Entity]Service],
})
export class [Domain]Module {}
```

### Feature Module Structure (Angular)

```typescript
// apps/[app]/src/app/[feature]/[feature].module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Routing
import { [Feature]RoutingModule } from './[feature]-routing.module';

// Components
import { [Feature]ContainerComponent } from './containers/[feature]-container/[feature]-container.component';
import { [Component]Component } from './components/[component]/[component].component';

// Workspace libraries
import { SharedUiModule } from '@[workspace]/shared/ui';
import { [Domain]DataAccessModule } from '@[workspace]/[domain]/data-access';

// UI framework
import { KendoModule } from '@[workspace]/shared/kendo';

@NgModule({
  declarations: [
    [Feature]ContainerComponent,
    [Component]Component,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    [Feature]RoutingModule,
    SharedUiModule,
    [Domain]DataAccessModule,
    KendoModule,
  ],
})
export class [Feature]Module {}
```

## Code Organization Principles

### Single File Responsibility

**Rule**: One class/component per file

```typescript
// ✅ Good - Single responsibility
// user.service.ts
export class UserService {}

// user.controller.ts
export class UserController {}

// ❌ Bad - Multiple classes in one file
// user.ts
export class UserService {}
export class UserController {}
export class UserEntity {}
```

### File Size Guidelines

- **Maximum file size**: 300 lines (excluding tests)
- **Recommended**: 100-200 lines
- **If exceeding 300 lines**: Extract to separate files/functions

### Grouping Related Code

```
[domain]/
├── [entity]/                    # Group by entity
│   ├── [entity].controller.ts
│   ├── [entity].service.ts
│   ├── [entity].entity.ts
│   ├── dtos/
│   │   ├── create-[entity].dto.ts
│   │   └── update-[entity].dto.ts
│   └── index.ts
```

## Testing File Placement

### Co-located Tests

**Rule**: Test files adjacent to source files

```
services/
├── user.service.ts
├── user.service.spec.ts
├── auth.service.ts
└── auth.service.spec.ts
```

### Test Naming Convention

```typescript
// Source: user.service.ts
export class UserService {}

// Test: user.service.spec.ts
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when found', () => {});
    it('should throw NotFoundException when not found', () => {});
  });
});
```

## Configuration Files Location

### Application Configuration

```
apps/[app]/
└── src/
    ├── environments/
    │   ├── environment.ts
    │   ├── environment.prod.ts
    │   └── environment.staging.ts
    └── config/
        ├── app-config.ts          # Centralized config
        ├── database-config.ts      # DB connection config
        └── auth-config.ts          # Auth config
```

### Workspace Configuration

```
[workspace-root]/
├── nx.json                        # Nx configuration
├── tsconfig.base.json            # TypeScript base config
├── .eslintrc.json                # ESLint rules
├── jest.config.ts                # Jest configuration
└── .prettierrc                   # Prettier formatting
```

## Evaluation Criteria

This specification is verifiable if:

- [ ] Directory structure matches Nx monorepo conventions
- [ ] File naming follows kebab-case with type indicators
- [ ] Class naming follows PascalCase with type suffixes
- [ ] Import organization follows defined order
- [ ] Path aliases used for workspace libraries
- [ ] Barrel exports (index.ts) in all appropriate directories
- [ ] One class/component per file
- [ ] Tests co-located with source files
- [ ] Module dependencies clearly defined
- [ ] Configuration files properly organized

## References

- Standards: .agent-alchemy/specs/standards-remote/component-service-structure.spec.md
- Standards: .agent-alchemy/specs/standards-remote/coding-standards.spec.md
- Architecture: architecture/system-architecture.specification.md
- Architecture: architecture/ui-components.specification.md

---

**Specification Complete**: code-structure ✅

```

### 7. Create Specification 5: Testing Strategy

**File**: `development/testing-strategy.specification.md`

**Purpose**: Define comprehensive testing approach, test cases, coverage requirements, and mock strategies

**Template includes**:
- Unit testing strategy (Jest)
- Integration testing approach
- E2E testing with Playwright
- Test coverage requirements (80%+)
- Mocking strategies for dependencies
- Test data management
- Test organization patterns
- Continuous testing in CI/CD

### 8. Create Specification 6: Documentation Requirements

**File**: `development/documentation-requirements.specification.md`

**Purpose**: Define code documentation, API docs, README files, and inline documentation standards

**Template includes**:
- JSDoc comment standards
- README.md requirements per library/app
- API documentation (Swagger/OpenAPI)
- Inline code comments guidelines
- Architecture decision records
- Changelog maintenance
- Developer onboarding documentation

## Best Practices

1. **Incremental Implementation**: Build in phases matching implementation-sequence from plan
2. **Test-Driven Development**: Write tests before implementation where possible
3. **Code Review**: All code reviewed against architecture specifications
4. **Documentation First**: Document APIs and complex logic during development
5. **Continuous Integration**: Run tests and linters on every commit
6. **Security First**: Implement security measures from security-architecture spec
7. **Performance Monitoring**: Add logging and metrics from the start

## Quality Checklist

Before completing development phase, verify all specifications:

### Implementation Guide
- [ ] All phases implemented in correct order
- [ ] Database schema matches architecture spec
- [ ] DTOs match API specification
- [ ] Controllers implement all endpoints
- [ ] Services implement all business rules
- [ ] Error handling comprehensive
- [ ] Code follows coding standards

### Code Structure
- [ ] Directory structure follows conventions
- [ ] File naming consistent with standards
- [ ] Import organization correct
- [ ] Barrel exports in place
- [ ] Module dependencies properly defined
- [ ] Tests co-located with source

### Development Environment
- [ ] Environment setup documented
- [ ] All dependencies specified
- [ ] Development commands listed
- [ ] Configuration complete
- [ ] Troubleshooting guide included

### Integration Points
- [ ] All integrations documented
- [ ] Error handling implemented
- [ ] Retry logic in place
- [ ] Circuit breakers for external services
- [ ] Event flows documented

### Testing Strategy
- [ ] Unit tests written
- [ ] Integration tests complete
- [ ] E2E tests functional
- [ ] Coverage meets requirements (80%+)
- [ ] Mocks properly implemented

### Documentation
- [ ] JSDoc comments complete
- [ ] README files created
- [ ] API documentation generated
- [ ] Inline comments for complex logic
- [ ] Architecture decisions recorded

---

## Spec Citation Requirements (v2.1.0)

Every implementation file MUST include spec citations. Use this format:

```typescript
/**
 * Product entity implementing TypeORM patterns.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.specification.md#entity-definitions
 *   - .agent-alchemy/specs/stack/stack.json#primary-key-strategy
 * 
 * Feature specification:
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#database-schema
 */

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  // ...
}
```

### Citation Format

- **Hierarchical specs**: `.agent-alchemy/specs/<category>/<spec-name>.md#<section>`
- **Feature specs**: `.agent-alchemy/products/<product>/features/<feature>/<phase>/<spec-name>.md#<section>`

### Tracking

Spec citations are tracked in `.agent-alchemy/analytics/test-c-spec-usage.json`. Use the analytics script:

```bash
# Record a citation
node .agent-alchemy/analytics/spec-analytics.js --cite "specs/frameworks/nestjs/database.md"

# Generate report
node .agent-alchemy/analytics/spec-analytics.js --report
```

### Why Spec Citations Matter

1. **Traceability** - Every line of code tied to a requirement
2. **Validation** - Human reviewer can verify spec compliance
3. **Analytics** - Track which specs add value
4. **Compliance** - Pre-commit hooks can verify citations

**All Development Specifications Complete**: Ready for Quality Phase ✅

---

**Agent**: Developer v2.1.0 (Added spec citation requirements)  
**Version**: 2.1.0  
**Last Updated**: 2026-04-13

```
