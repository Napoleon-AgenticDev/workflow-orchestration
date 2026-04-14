---
meta:
  id: nestjs-database-integration-specification
  title: NestJS Database Integration Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - database
    - typeorm
    - mongoose
    - prisma
    - orm
    - entities
    - repositories
    - database integration
    - data persistence
    - repository pattern
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS Database Integration Specification
category: Data Persistence
feature: TypeORM, Mongoose, Prisma
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.entity.ts'
  - '**/*.repository.ts'
  - '**/*.service.ts'
  - '**/database/**/*'
keywords:
  - database
  - typeorm
  - mongoose
  - prisma
  - orm
  - entities
  - repositories
topics:
  - database integration
  - typeorm
  - mongoose
  - prisma
  - data persistence
  - repository pattern
useCases: []
---

# NestJS Database Integration Specification

## Overview

NestJS provides excellent integration with various database solutions including SQL databases through TypeORM, NoSQL databases through Mongoose for MongoDB, and modern ORM solutions like Prisma. This specification covers the patterns, best practices, and implementation details for database integration in NestJS applications.

The framework's modular architecture allows for flexible database configurations, connection management, and repository patterns that scale from simple CRUD operations to complex enterprise applications.

## Core Concepts

### TypeORM Integration

TypeORM is the most commonly used ORM with NestJS for SQL databases, providing a powerful Active Record and Data Mapper pattern:

**Key Features:**

- Entity-based modeling
- Repository pattern support
- Query builder for complex queries
- Migration system
- Transaction support
- Multiple database support

**Implementation Patterns:**

```typescript
// Database configuration
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'myapp',
      entities: [User, Product, Order],
      synchronize: process.env.NODE_ENV === 'development',
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([User, Product, Order]),
  ],
})
export class DatabaseModule {}

// Entity definition
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ select: false })
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}

// Repository service
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll(options: FindManyOptions<User> = {}): Promise<User[]> {
    return this.userRepository.find({
      relations: ['profile', 'roles'],
      ...options,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'roles'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  // Complex query with query builder
  async findUsersWithOrdersInDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.orders', 'order')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }
}
```

### Mongoose Integration (MongoDB)

For MongoDB integration, NestJS provides excellent support through Mongoose:

```typescript
// MongoDB configuration
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
})
export class DatabaseModule {}

// Schema definition
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }] })
  roles: Role[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' })
  profile: UserProfile;

  // Virtual for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Pre-save middleware
  @Prop()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add pre-save hook
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Service with Mongoose
@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(filter: FilterQuery<User> = {}): Promise<User[]> {
    return this.userModel.find(filter).populate('roles').populate('profile').exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate('roles').populate('profile').exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).populate('roles').populate('profile').exec();
  }

  async remove(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  // Aggregation pipeline example
  async getUserStatistics(): Promise<any[]> {
    return this.userModel
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }
}
```

### Prisma Integration

Prisma provides a modern, type-safe database toolkit:

```typescript
// Prisma schema (schema.prisma)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String
  lastName  String
  password  String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  profile UserProfile?
  orders  Order[]
  roles   UserRole[]

  @@map("users")
}

model UserProfile {
  id     Int    @id @default(autoincrement())
  bio    String?
  avatar String?
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id])

  @@map("user_profiles")
}

// Prisma service
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// User service with Prisma
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        orders: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        profile: true,
        roles: true,
      },
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
      include: {
        profile: true,
        roles: true,
      },
    });
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Database Configuration:**

- Use environment-based configuration
- Implement connection pooling for better performance
- Use migrations for schema management
- Separate read and write operations when needed

**Entity/Model Design:**

- Keep entities focused and normalized
- Use proper indexing for frequently queried fields
- Implement soft deletes instead of hard deletes
- Use timestamps for audit trails

**Service Layer Patterns:**

- Use repository pattern for data access abstraction
- Implement proper error handling for database operations
- Use transactions for complex operations
- Cache frequently accessed data

### Common Use Cases

1. **CRUD Operations**: Standard create, read, update, delete operations
2. **Complex Queries**: Using query builders or raw queries for advanced filtering
3. **Data Relationships**: Managing one-to-one, one-to-many, and many-to-many relationships
4. **Data Validation**: Ensuring data integrity at the database level
5. **Performance Optimization**: Implementing caching and query optimization

### Anti-Patterns to Avoid

- **N+1 Query Problem**: Not using proper joins or includes
- **Missing Indexes**: Not optimizing frequently queried fields
- **Synchronous Operations**: Not using async/await properly
- **No Error Handling**: Not catching and handling database errors
- **Hard-coded Connections**: Not using configuration management

## API Reference

### TypeORM Decorators

#### @Entity(name?: string)

**Purpose**: Marks a class as a database entity
**Usage**: Class-level decorator
**Parameters**: Optional table name

#### @Column(options?: ColumnOptions)

**Purpose**: Marks a property as a table column
**Usage**: Property-level decorator
**Parameters**: Column configuration options

#### @PrimaryGeneratedColumn()

**Purpose**: Creates an auto-increment primary key column
**Usage**: Property-level decorator

### Mongoose Decorators

#### @Schema(options?: SchemaOptions)

**Purpose**: Marks a class as a Mongoose schema
**Usage**: Class-level decorator
**Parameters**: Schema configuration options

#### @Prop(options?: PropOptions)

**Purpose**: Marks a property as a schema property
**Usage**: Property-level decorator
**Parameters**: Property configuration options

## Testing Strategies

### Testing with TypeORM

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
    };

    const user = { id: 1, ...createUserDto };
    jest.spyOn(repository, 'create').mockReturnValue(user as User);
    jest.spyOn(repository, 'save').mockResolvedValue(user as User);

    const result = await service.create(createUserDto);
    expect(result).toEqual(user);
  });
});
```

### Testing with Test Database

```typescript
// test-database.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, UserProfile],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([User, UserProfile]),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class TestDatabaseModule {}

// Integration test
describe('UserService (Integration)', () => {
  let app: INestApplication;
  let userService: UserService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create and retrieve a user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'integration@test.com',
      firstName: 'Integration',
      lastName: 'Test',
      password: 'password123',
    };

    const createdUser = await userService.create(createUserDto);
    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe(createUserDto.email);

    const foundUser = await userService.findById(createdUser.id);
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(createUserDto.email);
  });
});
```

## Performance Considerations

### Optimization Techniques

- Use connection pooling with appropriate pool sizes
- Implement query result caching
- Use database indexes strategically
- Optimize N+1 query problems with proper joins
- Use pagination for large datasets
- Implement read replicas for read-heavy applications

### Common Performance Pitfalls

- Not using indexes on frequently queried columns
- Loading unnecessary relations (over-fetching)
- Not implementing proper pagination
- Using synchronous database operations
- Not monitoring query performance

## Related Specifications

- [NestJS Fundamentals](./nestjs-fundamentals.specification.md)
- [NestJS Advanced Concepts](./nestjs-advanced-concepts.specification.md)
- [NestJS Testing](./nestjs-testing.specification.md)
- [NestJS Performance](./nestjs-performance.specification.md)

## References

- [NestJS Database Documentation](https://docs.nestjs.com/techniques/database)
- [TypeORM Integration](https://docs.nestjs.com/recipes/sql-typeorm)
- [Mongoose Integration](https://docs.nestjs.com/recipes/mongodb)
- [Prisma Integration](https://docs.nestjs.com/recipes/prisma)

## Code Examples

### Transaction Management

```typescript
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource
  ) {}

  async createOrderWithTransaction(userId: number, orderData: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // Create order
      const order = manager.create(Order, {
        ...orderData,
        userId,
      });

      const savedOrder = await manager.save(order);

      // Update user's order count
      await manager.increment(User, { id: userId }, 'orderCount', 1);

      // Send notification (this could fail and rollback the transaction)
      await this.notificationService.sendOrderConfirmation(savedOrder);

      return savedOrder;
    });
  }
}
```

### Database Migration Example

```typescript
// migration file: 1234567890-CreateUserTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_USER_EMAIL',
            columnNames: ['email'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

## Migration Notes

### From Sequelize to TypeORM

- Convert models to entities with decorators
- Update query syntax to TypeORM query builder
- Migrate migrations to TypeORM format
- Update service layer to use repositories

### Breaking Changes

- TypeORM version updates may change entity decorators
- Mongoose schema definitions may require updates
- Migration file formats change between versions

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**: Increase pool size or check for connection leaks
2. **Slow Queries**: Add indexes, optimize queries, or implement caching
3. **Migration Failures**: Check schema changes and rollback strategies
4. **Entity Relationship Errors**: Verify foreign key constraints and cascade options

### Debug Techniques

- Enable query logging in development
- Use database profiling tools
- Monitor connection pool metrics
- Implement query performance monitoring