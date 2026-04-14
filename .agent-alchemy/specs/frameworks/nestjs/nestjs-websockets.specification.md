---
meta:
  id: nestjs-websockets-specification
  title: NestJS WebSockets & Real-time Communication Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - websockets
    - socket-io
    - real-time
    - sse
    - gateways
    - bidirectional-communication
    - real-time communication
    - socket.io
    - server-sent events
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: NestJS WebSockets & Real-time Communication Specification
category: Real-time Features
feature: WebSockets, Server-Sent Events, Microservices
lastUpdated: 2024-09-24T00:00:00.000Z
source: NestJS Official Documentation
version: NestJS 10+
aiContext: true
applyTo:
  - '**/*.gateway.ts'
  - '**/websockets/**/*'
  - '**/realtime/**/*'
keywords:
  - websockets
  - socket-io
  - real-time
  - sse
  - gateways
  - bidirectional-communication
topics:
  - websockets
  - real-time communication
  - socket.io
  - server-sent events
  - gateways
useCases: []
---

# NestJS WebSockets & Real-time Communication Specification

## Overview

NestJS provides comprehensive support for real-time communication through WebSockets, Server-Sent Events (SSE), and microservice messaging patterns. The framework integrates seamlessly with Socket.IO, native WebSockets, and various message brokers to enable real-time, bidirectional communication between clients and servers.

This specification covers WebSocket gateways, real-time event handling, authentication for WebSocket connections, and scaling considerations for real-time applications.

## Core Concepts

### WebSocket Gateways

WebSocket gateways handle real-time communication using decorators similar to HTTP controllers:

**Key Features:**

- Bidirectional communication
- Event-driven architecture
- Namespace and room support
- Connection lifecycle management
- Authentication and authorization

**Implementation Patterns:**

```typescript
// Basic WebSocket gateway
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ChatGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection', 'Successfully connected to chat server');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: JoinRoomDto): Promise<WsResponse<any>> {
    const { roomId, userId } = data;

    // Validate room membership
    const canJoin = await this.chatService.canUserJoinRoom(userId, roomId);

    if (!canJoin) {
      return {
        event: 'error',
        data: { message: 'Access denied to room' },
      };
    }

    await client.join(roomId);

    // Notify room members
    client.to(roomId).emit('userJoined', {
      userId,
      roomId,
      timestamp: new Date(),
    });

    // Send room history to new member
    const history = await this.chatService.getRoomHistory(roomId, 50);

    return {
      event: 'joinedRoom',
      data: {
        roomId,
        history,
        memberCount: await this.getRoomMemberCount(roomId),
      },
    };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: SendMessageDto): Promise<void> {
    const { roomId, message, userId } = data;

    // Validate message
    if (!message || message.trim().length === 0) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    // Save message to database
    const savedMessage = await this.chatService.saveMessage({
      roomId,
      userId,
      content: message.trim(),
      timestamp: new Date(),
    });

    // Broadcast to room members
    this.server.to(roomId).emit('newMessage', {
      id: savedMessage.id,
      userId,
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      user: await this.userService.findById(userId),
    });

    // Update room activity
    await this.chatService.updateRoomActivity(roomId);
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: TypingDto): void {
    const { roomId, userId, isTyping } = data;

    client.to(roomId).emit('userTyping', {
      userId,
      isTyping,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: LeaveRoomDto): Promise<void> {
    const { roomId, userId } = data;

    await client.leave(roomId);

    client.to(roomId).emit('userLeft', {
      userId,
      roomId,
      timestamp: new Date(),
    });
  }

  // Server-side message broadcasting
  async broadcastToRoom(roomId: string, event: string, data: any): Promise<void> {
    this.server.to(roomId).emit(event, data);
  }

  private async getRoomMemberCount(roomId: string): Promise<number> {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    return room ? room.size : 0;
  }
}
```

### Authentication for WebSockets

Implementing authentication and authorization for WebSocket connections:

```typescript
// WebSocket authentication guard
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Authentication token required');
      }

      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new WsException('Invalid or inactive user');
      }

      client.data.user = user;
      return true;
    } catch (error) {
      throw new WsException('Authentication failed');
    }
  }

  private extractToken(client: Socket): string | null {
    const token = client.handshake.auth?.token ||
                 client.handshake.headers?.authorization?.replace('Bearer ', '');
    return token || null;
  }
}

// Authenticated WebSocket gateway
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class AuthenticatedChatGateway {
  @SubscribeMessage('authenticatedMessage')
  async handleAuthenticatedMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): Promise<WsResponse<any>> {
    const user = client.data.user;

    // User is automatically available from authentication guard
    const message = await this.chatService.saveMessage({
      userId: user.id,
      content: data.message,
      roomId: data.roomId,
    });

    return {
      event: 'messageReceived',
      data: message,
    };
  }
}

// Custom WebSocket decorator for getting authenticated user
export const WsUser = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext): User | any => {
    const client = ctx.switchToWs().getClient<Socket>();
    const user = client.data.user;

    return data ? user[data] : user;
  },
);

// Usage with custom decorator
@SubscribeMessage('privateMessage')
async handlePrivateMessage(
  @ConnectedSocket() client: Socket,
  @WsUser() user: User,
  @MessageBody() data: PrivateMessageDto,
): Promise<void> {
  // User is automatically injected from token
  await this.messageService.sendPrivateMessage(user.id, data.recipientId, data.message);
}
```

### Server-Sent Events (SSE)

Implementing Server-Sent Events for one-way real-time communication:

```typescript
// SSE controller
@Controller('events')
export class EventsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Sse('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotificationStream(@Request() req): Promise<Observable<MessageEvent>> {
    const userId = req.user.id;

    return new Observable((observer) => {
      // Send initial connection message
      observer.next({
        data: JSON.stringify({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date(),
        }),
      } as MessageEvent);

      // Set up notification subscription
      const subscription = this.notificationService.getUserNotificationStream(userId).subscribe({
        next: (notification) => {
          observer.next({
            data: JSON.stringify(notification),
            id: notification.id,
            type: notification.type,
          } as MessageEvent);
        },
        error: (error) => {
          observer.error(error);
        },
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        observer.next({
          data: JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date(),
          }),
        } as MessageEvent);
      }, 30000); // Every 30 seconds

      // Cleanup on disconnect
      return () => {
        subscription.unsubscribe();
        clearInterval(heartbeat);
      };
    });
  }

  @Sse('system-status')
  @Roles('admin')
  async getSystemStatusStream(): Promise<Observable<MessageEvent>> {
    return interval(10000).pipe(
      // Every 10 seconds
      map(() => ({
        data: JSON.stringify({
          type: 'system-status',
          cpu: process.cpuUsage(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          timestamp: new Date(),
        }),
      }))
    );
  }
}

// Notification service for SSE
@Injectable()
export class NotificationService {
  private notificationSubjects = new Map<number, Subject<Notification>>();

  getUserNotificationStream(userId: number): Observable<Notification> {
    if (!this.notificationSubjects.has(userId)) {
      this.notificationSubjects.set(userId, new Subject<Notification>());
    }

    return this.notificationSubjects.get(userId).asObservable();
  }

  async sendNotificationToUser(userId: number, notification: Notification): Promise<void> {
    // Save to database
    await this.saveNotification(userId, notification);

    // Send via SSE if user is connected
    const subject = this.notificationSubjects.get(userId);
    if (subject) {
      subject.next(notification);
    }
  }

  async broadcastSystemNotification(notification: Notification): Promise<void> {
    // Send to all connected users
    for (const [userId, subject] of this.notificationSubjects.entries()) {
      subject.next({
        ...notification,
        type: 'system',
        userId,
      });
    }
  }

  disconnectUser(userId: number): void {
    const subject = this.notificationSubjects.get(userId);
    if (subject) {
      subject.complete();
      this.notificationSubjects.delete(userId);
    }
  }
}
```

### Microservice Communication

Implementing real-time microservice communication patterns:

```typescript
// Message broker configuration
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
      {
        name: 'CHAT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
    ]),
  ],
  providers: [MessageBrokerService],
})
export class MessageBrokerModule {}

// Microservice message patterns
@Injectable()
export class MessageBrokerService {
  constructor(@Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy, @Inject('CHAT_SERVICE') private chatClient: ClientProxy) {}

  async onModuleInit() {
    await this.notificationClient.connect();
    await this.chatClient.connect();
  }

  async onModuleDestroy() {
    await this.notificationClient.close();
    await this.chatClient.close();
  }

  // Send notification via microservice
  async sendNotification(userId: number, notification: any): Promise<void> {
    this.notificationClient.emit('user_notification', {
      userId,
      notification,
      timestamp: new Date(),
    });
  }

  // Request-response pattern
  async getUserChatHistory(userId: number, roomId: string): Promise<any> {
    return this.chatClient.send('get_chat_history', { userId, roomId }).pipe(timeout(5000)).toPromise();
  }

  // Event streaming pattern
  getChatEventStream(): Observable<any> {
    return this.chatClient.send('chat_events_stream', {}).pipe(
      retry(3),
      catchError((error) => {
        console.error('Chat event stream error:', error);
        return EMPTY;
      })
    );
  }
}

// Microservice event handlers
@Controller()
export class NotificationMicroserviceController {
  constructor(private readonly notificationService: NotificationService, private readonly websocketGateway: ChatGateway) {}

  @EventPattern('user_notification')
  async handleUserNotification(data: { userId: number; notification: any }) {
    const { userId, notification } = data;

    // Send via SSE
    await this.notificationService.sendNotificationToUser(userId, notification);

    // Also send via WebSocket if user is connected
    this.websocketGateway.server.to(`user_${userId}`).emit('notification', notification);
  }

  @MessagePattern('get_user_notifications')
  async getUserNotifications(data: { userId: number; limit?: number }) {
    return this.notificationService.getUserNotifications(data.userId, data.limit || 20);
  }
}
```

## Angular Patterns and Best Practices

### Recommended Implementation

**WebSocket Best Practices:**

- Implement proper connection lifecycle management
- Use namespaces and rooms for logical grouping
- Implement authentication for secure connections
- Handle connection failures and reconnection logic

**Real-time Communication:**

- Choose appropriate technology (WebSocket vs SSE) based on use case
- Implement proper error handling and fallback mechanisms
- Use message queuing for reliable delivery
- Implement rate limiting to prevent abuse

**Scaling Considerations:**

- Use Redis adapter for multi-server WebSocket scaling
- Implement load balancing strategies
- Consider using dedicated WebSocket servers
- Monitor connection counts and resource usage

### Common Use Cases

1. **Chat Applications**: Real-time messaging and presence
2. **Live Updates**: Real-time data updates and notifications
3. **Collaborative Editing**: Multi-user document editing
4. **Gaming**: Real-time multiplayer game states
5. **Monitoring Dashboards**: Live system metrics and alerts

### Anti-Patterns to Avoid

- **No Connection Management**: Not handling disconnections properly
- **Broadcasting Everything**: Sending unnecessary data to all clients
- **No Authentication**: Allowing unauthenticated WebSocket connections
- **Memory Leaks**: Not cleaning up event listeners and subscriptions
- **No Error Handling**: Not implementing proper error recovery

## API Reference

### WebSocket Decorators

#### @WebSocketGateway(options?: GatewayMetadata)

**Purpose**: Declares a WebSocket gateway class
**Usage**: Class-level decorator
**Parameters**: Gateway configuration options

#### @SubscribeMessage(message: string)

**Purpose**: Handles incoming WebSocket messages
**Usage**: Method-level decorator
**Parameters**: Message event name

#### @WebSocketServer()

**Purpose**: Injects the WebSocket server instance
**Usage**: Property-level decorator

### SSE Decorators

#### @Sse(path?: string)

**Purpose**: Creates a Server-Sent Events endpoint
**Usage**: Method-level decorator
**Parameters**: Optional path string

## Testing Strategies

### WebSocket Testing

```typescript
describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;
  let client: Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: {
            canUserJoinRoom: jest.fn(),
            saveMessage: jest.fn(),
            getRoomHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    chatService = module.get<ChatService>(ChatService);

    // Mock Socket client
    client = {
      id: 'test-client-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      data: {},
    } as any;
  });

  describe('handleJoinRoom', () => {
    it('should allow user to join room', async () => {
      const joinRoomDto = { roomId: 'room1', userId: 1 };

      jest.spyOn(chatService, 'canUserJoinRoom').mockResolvedValue(true);
      jest.spyOn(chatService, 'getRoomHistory').mockResolvedValue([]);

      const result = await gateway.handleJoinRoom(client, joinRoomDto);

      expect(client.join).toHaveBeenCalledWith('room1');
      expect(result.event).toBe('joinedRoom');
      expect(result.data).toHaveProperty('roomId', 'room1');
    });

    it('should deny access to unauthorized user', async () => {
      const joinRoomDto = { roomId: 'room1', userId: 1 };

      jest.spyOn(chatService, 'canUserJoinRoom').mockResolvedValue(false);

      const result = await gateway.handleJoinRoom(client, joinRoomDto);

      expect(client.join).not.toHaveBeenCalled();
      expect(result.event).toBe('error');
    });
  });
});
```

### Integration Testing for WebSockets

```typescript
describe('ChatGateway (Integration)', () => {
  let app: INestApplication;
  let gateway: ChatGateway;
  let ioClient: SocketIOClient.Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ChatModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    gateway = app.get<ChatGateway>(ChatGateway);

    await app.listen(3001);

    ioClient = SocketIOClient('http://localhost:3001/chat', {
      autoConnect: false,
    });
  });

  afterAll(async () => {
    ioClient.close();
    await app.close();
  });

  it('should connect and receive welcome message', (done) => {
    ioClient.connect();

    ioClient.on('connect', () => {
      expect(ioClient.connected).toBe(true);
    });

    ioClient.on('connection', (data) => {
      expect(data).toBe('Successfully connected to chat server');
      done();
    });
  });

  it('should handle message sending', (done) => {
    const testMessage = {
      roomId: 'test-room',
      userId: 1,
      message: 'Hello, World!',
    };

    ioClient.emit('sendMessage', testMessage);

    ioClient.on('newMessage', (data) => {
      expect(data.content).toBe('Hello, World!');
      expect(data.userId).toBe(1);
      done();
    });
  });
});
```

## Performance Considerations

### Optimization Techniques

- Use Redis adapter for horizontal scaling
- Implement connection pooling for database operations
- Use message queuing for reliable delivery
- Implement proper memory management for connections
- Use clustering for high availability

### Common Performance Pitfalls

- Not implementing proper connection cleanup
- Broadcasting to all clients unnecessarily
- Not using Redis adapter for scaling
- Keeping too much connection state in memory
- Not implementing proper rate limiting

## Related Specifications

- [NestJS Fundamentals](./nestjs-fundamentals.specification.md)
- [NestJS Advanced Concepts](./nestjs-advanced-concepts.specification.md)
- [NestJS Authentication](./nestjs-authentication.specification.md)
- [NestJS Performance](./nestjs-performance.specification.md)

## References

- [NestJS WebSockets Documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Server-Sent Events](https://docs.nestjs.com/techniques/server-sent-events)
- [Microservices Communication](https://docs.nestjs.com/microservices/basics)

## Code Examples

### Complete Real-time Chat Application

```typescript
// Complete chat module
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatMessage, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ChatGateway, ChatService, NotificationService],
  controllers: [EventsController],
})
export class ChatModule {}

// DTOs for type safety
export class JoinRoomDto {
  @IsString()
  roomId: string;

  @IsNumber()
  userId: number;
}

export class SendMessageDto {
  @IsString()
  roomId: string;

  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
```

## Migration Notes

### From HTTP to WebSockets

- Convert REST endpoints to WebSocket message handlers
- Implement proper authentication for WebSocket connections
- Update client-side code to use WebSocket connections
- Consider backward compatibility with HTTP endpoints

### Breaking Changes

- WebSocket gateway API changes between versions
- Socket.IO version compatibility updates
- Message format changes

## Troubleshooting

### Common Issues

1. **Connection Drops**: Check network stability and implement reconnection logic
2. **Authentication Failures**: Verify JWT token handling in WebSocket handshake
3. **Message Loss**: Implement message acknowledgment and retry logic
4. **Memory Leaks**: Ensure proper cleanup of event listeners and subscriptions

### Debug Techniques

- Use Socket.IO debugging tools
- Implement comprehensive logging for connections and messages
- Monitor connection counts and memory usage
- Use network tools to debug WebSocket connections