# Architecture: Product & Feature Management System

## System Architecture

### Technology Stack
- **Frontend**: Angular 19 with Signals, standalone components
- **Backend**: NestJS with TypeORM
- **Database**: PostgreSQL
- **UI Components**: Custom Tailwind CSS

### Layer Architecture

```
┌─────────────────────────────────────┐
│  Angular Frontend                   │
│  - ProductsComponent               │
│  - ApiService                      │
│  - Signal-based state              │
└─────────────────────────────────────┘
              │ HTTP
              ▼
┌─────────────────────────────────────┐
│  NestJS API Server                  │
│  - ProductsController              │
│  - FeaturesController               │
│  - ProductsService                  │
│  - FeaturesService                  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  TypeORM / PostgreSQL               │
│  - Product Entity                   │
│  - ProductFeature Entity            │
└─────────────────────────────────────┘
```

## Database Schema

### Product Table
```sql
CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Planning',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ProductFeature Table
```sql
CREATE TABLE product_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Todo',
  product_id UUID REFERENCES product(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Design

### REST Endpoints

#### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/products | Create product |
| GET | /api/products | List products |
| GET | /api/products/:id | Get product |
| PATCH | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/products/:id/progress | Get progress |

#### Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/features | Create feature |
| GET | /api/features | List features |
| GET | /api/features/product/:productId | Get by product |
| GET | /api/features/:id | Get feature |
| PATCH | /api/features/:id | Update feature |
| DELETE | /api/features/:id | Delete feature |

## Component Structure

### Angular Components

#### ProductsComponent
- Standalone component with inline template
- Uses Angular Signals for state
- Grid display with card layout
- Modal for feature management

#### ApiService
- HTTP client wrapper
- Product and Feature API methods
- Type-safe observables

## State Management

### Frontend State
- Angular Signals for reactive state
- `products` signal: Product[]
- `features` signal: Feature[]
- `selectedProduct` signal: Product | null

### Progress Calculation
```typescript
getProgress(product: Product): number {
  if (!product.features.length) return 0;
  const done = product.features.filter(f => f.status === 'Done').length;
  return Math.round((done / product.features.length) * 100);
}
```

## Error Handling

### Backend
- NotFoundException for missing entities
- ValidationPipe for DTO validation
- Global prefix /api for all routes

### Frontend
- HTTP error handling in service
- User-friendly error messages
- Confirm dialogs for delete actions

## Security Considerations

- UUID validation with ParseUUIDPipe
- Input validation with class-validator
- CORS configured for localhost origins
- No sensitive data exposure
