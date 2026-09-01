import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectEntity } from './entities/object.entity';
import { ObjectsController } from './objects.controller';
import { ObjectsService } from './objects.service';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ObjectEntity]), AuthModule],
  controllers: [ObjectsController],
  providers: [ObjectsService],
  exports: [ObjectsService],
})
export class ObjectsModule {}
