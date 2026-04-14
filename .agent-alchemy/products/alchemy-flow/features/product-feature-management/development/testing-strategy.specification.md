# Testing Strategy: Product & Feature Management

## Test Coverage Requirements

Target: 80%+ code coverage for services

## Unit Tests

### ProductsService Tests

```typescript
describe('ProductsService', () => {
  // create - should create a product
  // findAll - should return all products with relations
  // findOne - should return product by id
  // findOne - should throw NotFoundException if not found
  // update - should update product
  // remove - should remove product
  // getProgress - should calculate progress correctly
  // getProgress - should return 0% for no features
});
```

### FeaturesService Tests

```typescript
describe('FeaturesService', () => {
  // create - should create a feature
  // findAll - should return all features
  // findByProduct - should return features for product
  // findOne - should return feature by id
  // findOne - should throw NotFoundException if not found
  // update - should update feature
  // remove - should remove feature
});
```

## Test Data

### Mock Product
```typescript
const mockProduct: Product = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Product',
  description: 'Test description',
  status: ProductStatus.PLANNING,
  metadata: { priority: 'high' },
  features: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Mock Feature
```typescript
const mockFeature: ProductFeature = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Feature',
  description: 'Test feature description',
  status: FeatureStatus.TODO,
  productId: mockProduct.id,
  product: mockProduct,
  metadata: { priority: 'medium' },
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## Mock Strategies

- Use jest.fn() for repository methods
- Mock TypeORM repository with getRepositoryToken
- Clear mocks in beforeEach

## Run Commands

```bash
# Run server tests
nx test server

# Run with coverage
nx test server --coverage
```

## Acceptance Test Scenarios

1. Create product → verify in list
2. Add feature to product → verify appears in modal
3. Change feature status → verify progress updates
4. Delete product → verify cascade delete
5. Delete feature → verify removed
