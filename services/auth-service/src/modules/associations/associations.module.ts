import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssociationsController } from './associations.controller';
import { AssociationsService } from './associations.service';
import { AssociationEntity } from './entities/association.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssociationEntity]),
    AuthModule,
  ],
  controllers: [AssociationsController],
  providers: [AssociationsService],
  exports: [AssociationsService],
})
export class AssociationsModule {}
