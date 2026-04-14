---
meta:
  id: nestjs-authentication-specification
  title: NestJS Authentication & Authorization Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - authentication
    - authorization
    - jwt
    - passport
    - guards
    - rbac
    - security
    - jwt tokens
    - passport.js
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS Authentication & Authorization Specification
category: Security
feature: JWT, Passport, Guards, RBAC
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.guard.ts'
  - '**/*.strategy.ts'
  - '**/*.controller.ts'
  - '**/auth/**/*'
keywords:
  - authentication
  - authorization
  - jwt
  - passport
  - guards
  - rbac
  - security
topics:
  - authentication
  - authorization
  - jwt tokens
  - passport.js
  - guards
  - rbac
  - security
useCases: []
---

# NestJS Authentication & Authorization Specification

## Overview

Authentication and authorization are critical components of secure NestJS applications. NestJS provides excellent integration with Passport.js for authentication strategies, JWT for stateless authentication, and flexible guard systems for authorization. This specification covers the implementation patterns, best practices, and security considerations for building secure applications.

The framework supports various authentication methods including local authentication, JWT tokens, OAuth providers, and custom authentication strategies, while providing fine-grained authorization through guards and role-based access control.

## Core Concepts

### JWT Authentication

JSON Web Tokens provide a stateless authentication mechanism that's ideal for REST APIs and microservices:

**Key Features:**

- Stateless authentication
- Token-based authorization
- Refresh token support
- Configurable expiration
- Claims-based security

**Implementation Patterns:**

```typescript
// JWT configuration
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
          issuer: configService.get<string>('JWT_ISSUER', 'myapp'),
          audience: configService.get<string>('JWT_AUDIENCE', 'myapp-users'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

// Authentication service
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: User): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.login(user);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(decoded.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId, type: 'refresh' };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  async logout(userId: number, token: string): Promise<void> {
    // Add token to blacklist (implement token blacklist storage)
    await this.addToBlacklist(token);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.usersService.updatePasswordReset(user.id, {
      resetToken: await bcrypt.hash(resetToken, 10),
      resetExpires,
    });

    // Send reset email (implement email service)
    await this.emailService.sendPasswordReset(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.resetExpires || user.resetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const isValidToken = await bcrypt.compare(token, user.resetToken);

    if (!isValidToken) {
      throw new BadRequestException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
    });
  }
}
```

### Passport Strategies

Passport.js integration for various authentication methods:

```typescript
// Local strategy (username/password)
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}

// JWT strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.authService.isTokenBlacklisted(payload.jti);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return user;
  }
}

// OAuth2 Google strategy
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService, private authService: AuthService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<User> {
    const { id, name, emails, photos } = profile;

    const userDto = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      providerId: id,
      provider: 'google',
    };

    return this.authService.validateOAuthUser(userDto);
  }
}
```

### Authorization Guards

Implementing role-based and permission-based authorization:

```typescript
// Basic authentication guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}

// Role-based authorization guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('User roles not found');
    }

    const userRoles = user.roles.map((role: any) => role.name);
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

// Permission-based authorization guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private permissionsService: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userPermissions = await this.permissionsService.getUserPermissions(user.id);

    return requiredPermissions.every((permission) => userPermissions.includes(permission));
  }
}

// Resource ownership guard
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;
    const resourceType = this.reflector.get<string>('resourceType', context.getHandler());

    if (!resourceType) {
      return true; // No resource type specified, allow access
    }

    // Check if user is admin
    if (user.roles.some((role: any) => role.name === 'admin')) {
      return true;
    }

    // Check resource ownership
    const resource = await this.getResource(resourceType, resourceId);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource.userId === user.id;
  }

  private async getResource(resourceType: string, resourceId: string) {
    switch (resourceType) {
      case 'user':
        return this.usersService.findById(+resourceId);
      // Add other resource types as needed
      default:
        return null;
    }
  }
}
```

### Custom Decorators

Creating reusable authorization decorators:

```typescript
// Public route decorator
export const Public = () => SetMetadata('isPublic', true);

// Roles decorator
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Permissions decorator
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// Resource type decorator
export const ResourceType = (type: string) => SetMetadata('resourceType', type);

// Get current user decorator
export const CurrentUser = createParamDecorator((data: keyof User, ctx: ExecutionContext): User | any => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user[data] : user;
});

// API key decorator
export const ApiKeyAuth = () => SetMetadata('apiKeyAuth', true);
```

## Angular Patterns and Best Practices

### Recommended Implementation

**Authentication Best Practices:**

- Use strong, randomly generated JWT secrets
- Implement token rotation and refresh mechanisms
- Store sensitive tokens securely (httpOnly cookies)
- Implement proper logout functionality with token blacklisting

**Authorization Best Practices:**

- Use role-based access control (RBAC) for scalability
- Implement fine-grained permissions where needed
- Check authorization at both route and business logic levels
- Use guards consistently across the application

**Security Best Practices:**

- Hash passwords using strong algorithms (bcrypt)
- Implement rate limiting for authentication endpoints
- Use HTTPS in production environments
- Validate and sanitize all inputs

### Common Use Cases

1. **User Registration/Login**: Standard email/password authentication
2. **Social Login**: OAuth integration with Google, Facebook, GitHub
3. **API Authentication**: JWT tokens for API access
4. **Role-based Access**: Different user roles with varying permissions
5. **Multi-tenant Applications**: Tenant-based authorization

### Anti-Patterns to Avoid

- **Storing Passwords in Plain Text**: Always hash passwords
- **No Token Expiration**: Implement reasonable token expiration
- **Client-side Authorization**: Never rely solely on client-side checks
- **Overly Broad Permissions**: Follow principle of least privilege
- **No Rate Limiting**: Implement brute force protection

## API Reference

### Authentication Decorators

#### @UseGuards(...guards)

**Purpose**: Applies guards to controllers or routes
**Usage**: Controller or method-level decorator
**Parameters**: Array of guard classes

#### @Public()

**Purpose**: Marks a route as publicly accessible
**Usage**: Method-level decorator

#### @Roles(...roles)

**Purpose**: Specifies required roles for a route
**Usage**: Method-level decorator
**Parameters**: Array of role names

### Passport Decorators

#### @UseGuards(AuthGuard('strategy'))

**Purpose**: Applies passport authentication strategy
**Usage**: Controller or method-level decorator
**Parameters**: Strategy name (jwt, local, google, etc.)

## Testing Strategies

### Testing Authentication

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should validate user credentials', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    };

    jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

    const result = await service.validateUser('test@example.com', 'password123');

    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(result).not.toHaveProperty('password');
  });

  it('should return null for invalid credentials', async () => {
    jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

    const result = await service.validateUser('test@example.com', 'wrongpassword');

    expect(result).toBeNull();
  });
});
```

### Testing Guards

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when user has required role', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            roles: [{ name: 'admin' }],
          },
        }),
      }),
    } as any;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            roles: [{ name: 'user' }],
          },
        }),
      }),
    } as any;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
```

## Performance Considerations

### Optimization Techniques

- Use Redis for token blacklisting and session storage
- Implement caching for user permissions and roles
- Use connection pooling for database operations
- Implement rate limiting to prevent brute force attacks
- Cache JWT verification results when appropriate

### Common Performance Pitfalls

- Not caching user roles and permissions
- Excessive database queries in guards
- Not implementing proper token cleanup
- Synchronous password hashing in request handlers
- Not using database indexes for user lookups

## Related Specifications

- [NestJS Fundamentals](./nestjs-fundamentals.specification.md)
- [NestJS Advanced Concepts](./nestjs-advanced-concepts.specification.md)
- [NestJS Database Integration](./nestjs-database-integration.specification.md)
- [NestJS Testing](./nestjs-testing.specification.md)

## References

- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [NestJS Authorization Documentation](https://docs.nestjs.com/security/authorization)
- [Passport.js Strategies](https://docs.nestjs.com/recipes/passport)
- [JWT Security Best Practices](https://docs.nestjs.com/security/encryption-and-hashing)

## Code Examples

### Complete Authentication Controller

```typescript
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(@CurrentUser() user: User): Promise<LoginResponse> {
    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body() refreshDto: RefreshTokenDto): Promise<LoginResponse> {
    return this.authService.refreshToken(refreshDto.refresh_token);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentUser() user: User, @Headers('authorization') auth: string): Promise<void> {
    const token = auth.replace('Bearer ', '');
    await this.authService.logout(user.id, token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(204)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(204)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() updateProfileDto: UpdateProfileDto): Promise<User> {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@CurrentUser() user: User): Promise<LoginResponse> {
    return this.authService.login(user);
  }
}
```

### DTOs for Authentication

```typescript
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @IsString()
  @MinLength(8)
  @Validate(MatchesProperty, ['password'])
  confirmPassword: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;
}
```

## Migration Notes

### From Session-based to JWT

- Replace session middleware with JWT strategies
- Update authentication guards to use JWT
- Implement token refresh mechanisms
- Handle client-side token storage

### Breaking Changes

- Passport strategy configurations may change
- JWT payload structure updates
- Guard interface changes between versions

## Troubleshooting

### Common Issues

1. **JWT Secret Mismatch**: Ensure same secret across all instances
2. **Token Expiration Issues**: Check token expiration configuration
3. **Guard Order Problems**: Verify guard execution order
4. **CORS Issues**: Configure CORS for authentication endpoints

### Debug Techniques

- Log authentication attempts and failures
- Use JWT debugger tools for token inspection
- Monitor guard execution flow
- Implement detailed error logging for auth failures