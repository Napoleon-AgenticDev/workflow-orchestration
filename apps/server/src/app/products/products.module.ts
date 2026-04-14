import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { FeaturesController } from './features.controller';
import { ProductsService } from './products.service';
import { FeaturesService } from './features.service';
import { Product } from './entities/product.entity';
import { ProductFeature } from './entities/product-feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductFeature])],
  controllers: [ProductsController, FeaturesController],
  providers: [ProductsService, FeaturesService],
  exports: [ProductsService, FeaturesService],
})
export class ProductsModule {}
