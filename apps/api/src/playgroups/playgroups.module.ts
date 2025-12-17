import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayGroupsService } from './playgroups.service';
import { PlayGroupsController } from './playgroups.controller';
import { PlayGroup } from './playgroups.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [TypeOrmModule.forFeature([PlayGroup, User]), UsersModule, NotificationsModule],
    controllers: [PlayGroupsController],
    providers: [PlayGroupsService],
    exports: [PlayGroupsService],
})
export class PlayGroupsModule { }
