import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JoinRequest } from './join-request.entity';
import { JoinRequestsService } from './join-requests.service';

@Module({
    imports: [TypeOrmModule.forFeature([JoinRequest])],
    providers: [JoinRequestsService],
    exports: [JoinRequestsService],
})
export class JoinRequestsModule { }
