import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsGateway } from './events.gateway';
import { UsersModule } from '../users/users.module';
import { Tournament } from '../tournaments/entities/tournament.entity';

@Module({
    imports: [UsersModule, TypeOrmModule.forFeature([Tournament])],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class EventsModule { }
